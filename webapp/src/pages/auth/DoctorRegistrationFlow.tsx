// src/pages/auth/DoctorRegistrationFlow.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { auth } from '@/services/firebase';
import Loading from '@/components/common/Loading';
import doctorService from '@/services/doctorService';
import { DayOfWeek, DEFAULTS } from '@/enums';
import type { Doctor } from '@/models/Doctor';
import logo from '@/assets/logo.png';

const DoctorRegistrationFlow: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [doctorExists, setDoctorExists] = useState(false);

  // Handle redirect after submission
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [submitted, navigate]);

  // Check if doctor already exists
  useEffect(() => {
    const checkExistingDoctor = async () => {
      if (!auth.currentUser) {
        setChecking(false);
        return;
      }
      
      if (user) {
        try {
          const exists = user.userID !== undefined && user.userID.startsWith('DOC');
          setDoctorExists(exists);
        } catch (err) {
          console.error('Error checking doctor existence:', err);
        }
      } else {
        setDoctorExists(false);
      }
      
      setChecking(false);
    };

    checkExistingDoctor();
  }, [user]);

  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    primaryPhone: '',
    secondaryPhone: '',
    email: auth.currentUser?.email || '',
    address: '',
  });

  // Professional Information State
  const [professionalInfo, setProfessionalInfo] = useState({
    title: '',
    specialization: '',
    qualifications: '',
    licenseNumber: '',
    clinicName: '',
    clinicAddress: '',
    consultationFee: '',
    currency: DEFAULTS.CURRENCY,
    workingDays: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY] as DayOfWeek[],
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    timeSlots: '',
    timeZone: DEFAULTS.TIME_ZONE,
  });

  // Allow access if user is signed in with Google
  useEffect(() => {
    if (!auth.currentUser && !checking) {
      navigate('/login', { replace: true });
    }
  }, [checking, navigate]);

  if (!auth.currentUser) {
    if (checking) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loading size={48} message="Loading..." />
        </div>
      );
    }
    return null;
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading..." />
      </div>
    );
  }

  // If doctor already exists, show pending approval message
  if (doctorExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f8] p-4">
        <div className="w-full max-w-lg rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-6 text-center">
          <h2 className="text-2xl font-bold mb-4 text-[#111418]">
            Registration Complete
          </h2>
          <p className="text-gray-600 mb-4">
            Your registration has been submitted successfully.
          </p>
          <p className="text-gray-600 mb-6">
            Your account is pending admin approval. Please wait for approval before accessing the system.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-[#3c83f6] px-6 text-base font-bold text-white shadow-sm hover:bg-[#3c83f6]/90 focus:outline-none focus:ring-2 focus:ring-[#3c83f6] focus:ring-offset-2"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const handlePersonalInfoChange = (field: string, value: string) => {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfessionalInfoChange = (field: string, value: string | DayOfWeek[]) => {
    setProfessionalInfo((prev) => ({ ...prev, [field]: value }));
  };

  const toggleWorkingDay = (day: DayOfWeek) => {
    setProfessionalInfo((prev) => {
      const days = prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day];
      return { ...prev, workingDays: days };
    });
  };

  const validateStep1 = (): boolean => {
    if (!personalInfo.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!personalInfo.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!personalInfo.primaryPhone.trim()) {
      setError('Primary phone is required');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!professionalInfo.specialization.trim()) {
      setError('Specialization is required');
      return false;
    }
    if (!professionalInfo.qualifications.trim()) {
      setError('Qualifications are required');
      return false;
    }
    if (professionalInfo.workingDays.length === 0) {
      setError('At least one working day is required');
      return false;
    }
    if (!professionalInfo.workingHoursStart || !professionalInfo.workingHoursEnd) {
      setError('Working hours are required');
      return false;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 0) {
      if (!validateStep1()) return;
    }
    setStep((s) => s + 1);
    setError(null);
  };

  const handlePrevious = () => {
    setStep((s) => s - 1);
    setError(null);
  };

  const removeUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(removeUndefined);
    }
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = removeUndefined(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  };

  const handleSubmit = async () => {
    if (loading || submitted) {
      return;
    }

    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        setError('You must be signed in to register. Please sign in again.');
        setLoading(false);
        return;
      }

      // Parse time slots (default to 30 minutes if not provided)
      const timeSlots = professionalInfo.timeSlots.trim()
        ? professionalInfo.timeSlots
            .split(',')
            .map((s) => parseInt(s.trim()))
            .filter((n) => !isNaN(n))
        : [30]; // Default to 30 minutes

      const practiceInfoData: any = {};
      if (professionalInfo.clinicName.trim()) {
        practiceInfoData.clinicName = professionalInfo.clinicName.trim();
      }
      if (professionalInfo.clinicAddress.trim()) {
        practiceInfoData.clinicAddress = professionalInfo.clinicAddress.trim();
      }
      if (professionalInfo.consultationFee) {
        practiceInfoData.consultationFee = parseFloat(professionalInfo.consultationFee);
      }
      if (professionalInfo.currency) {
        practiceInfoData.currency = professionalInfo.currency as typeof DEFAULTS.CURRENCY;
      }

      const doctorDataRaw: any = {
        professionalInfo: {
          firstName: personalInfo.firstName.trim(),
          lastName: personalInfo.lastName.trim(),
          ...(professionalInfo.title.trim() && { title: professionalInfo.title.trim() }),
          specialization: professionalInfo.specialization.trim(),
          qualifications: professionalInfo.qualifications
            .split(',')
            .map((q) => q.trim())
            .filter(Boolean),
          ...(professionalInfo.licenseNumber.trim() && { licenseNumber: professionalInfo.licenseNumber.trim() }),
        },
        contactInfo: {
          primaryPhone: personalInfo.primaryPhone.trim(),
          ...(personalInfo.secondaryPhone.trim() && { secondaryPhone: personalInfo.secondaryPhone.trim() }),
          ...(personalInfo.email.trim() && { email: personalInfo.email.trim() }),
          ...(personalInfo.address.trim() && { address: personalInfo.address.trim() }),
        },
        ...(Object.keys(practiceInfoData).length > 0 ? { practiceInfo: practiceInfoData } : {}),
        availability: {
          workingDays: professionalInfo.workingDays,
          workingHours: {
            start: professionalInfo.workingHoursStart,
            end: professionalInfo.workingHoursEnd,
          },
          timeSlots,
          timeZone: professionalInfo.timeZone || DEFAULTS.TIME_ZONE,
        },
        assignedPatients: [],
        isActive: false,
      };

      const doctorData = removeUndefined(doctorDataRaw);

      await doctorService.createDoctor(
        firebaseUser.uid,
        doctorData,
        {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        }
      );

      setSubmitted(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to submit registration. Please try again.');
      setLoading(false);
    }
  };

  // Email is pre-filled in initial state above

  const stepTitles = ['Step 1: Personal Information', 'Step 2: Professional Information'];

  const renderStepContent = () => {
    if (step === 0) {
      // Step 1: Personal Information
      return (
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#3c83f6]/10 text-[#3c83f6] text-xs font-bold uppercase tracking-wider">
                Step 1 of 2
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#111418] tracking-tight">Personal Information</h1>
            <p className="text-slate-500 text-sm mt-1">
              Please fill in your details below. Fields marked with <span className="text-red-500">*</span> are required.
            </p>
          </div>
          <div className="p-8">
            <form className="flex flex-col gap-8" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full h-12 px-4 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3c83f6]/50 focus:border-[#3c83f6] transition-all shadow-sm"
                    id="firstName"
                    name="firstName"
                    placeholder="e.g. Sarah"
                    required
                    type="text"
                    value={personalInfo.firstName}
                    onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full h-12 px-4 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3c83f6]/50 focus:border-[#3c83f6] transition-all shadow-sm"
                    id="lastName"
                    name="lastName"
                    placeholder="e.g. Connor"
                    required
                    type="text"
                    value={personalInfo.lastName}
                    onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="primaryPhone">
                    Primary Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">call</span>
                    <input
                      className="w-full h-12 pl-11 pr-4 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3c83f6]/50 focus:border-[#3c83f6] transition-all shadow-sm"
                      id="primaryPhone"
                      name="primaryPhone"
                      placeholder="(555) 000-0000"
                      required
                      type="tel"
                      value={personalInfo.primaryPhone}
                      onChange={(e) => handlePersonalInfoChange('primaryPhone', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 flex justify-between" htmlFor="secondaryPhone">
                    <span>Secondary Phone</span>
                    <span className="text-xs font-normal text-slate-400">Optional</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">phone_iphone</span>
                    <input
                      className="w-full h-12 pl-11 pr-4 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3c83f6]/50 focus:border-[#3c83f6] transition-all shadow-sm"
                      id="secondaryPhone"
                      name="secondaryPhone"
                      placeholder="(555) 000-0000"
                      type="tel"
                      value={personalInfo.secondaryPhone}
                      onChange={(e) => handlePersonalInfoChange('secondaryPhone', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 flex justify-between" htmlFor="email">
                  <span>Email Address</span>
                  <span className="text-xs font-normal text-slate-400">Optional</span>
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3c83f6] transition-colors material-symbols-outlined text-[20px]">mail</span>
                  <input
                    className="w-full h-12 pl-11 pr-4 rounded-lg bg-slate-50 border border-slate-300 text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3c83f6]/50 focus:border-[#3c83f6] transition-all shadow-sm"
                    id="email"
                    name="email"
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                  />
                  {auth.currentUser?.email && personalInfo.email === auth.currentUser.email && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded border border-green-200">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      <span>Verified via Google</span>
                    </div>
                  )}
                </div>
                {auth.currentUser?.email && (
                  <p className="text-xs text-slate-500">We've pre-filled this from your login account.</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 flex justify-between" htmlFor="address">
                  <span>Clinic / Home Address</span>
                  <span className="text-xs font-normal text-slate-400">Optional</span>
                </label>
                <textarea
                  className="w-full p-4 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3c83f6]/50 focus:border-[#3c83f6] transition-all shadow-sm resize-none"
                  id="address"
                  name="address"
                  placeholder="123 Medical Plaza, Suite 400..."
                  rows={3}
                  value={personalInfo.address}
                  onChange={(e) => handlePersonalInfoChange('address', e.target.value)}
                />
              </div>
            </form>
          </div>
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end items-center gap-4">
            <button
              onClick={handleNext}
              disabled={loading || submitted}
              className="px-8 py-3 rounded-lg bg-[#3c83f6] hover:bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 w-full sm:w-auto group disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              Next Step
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </div>
      );
    } else {
      // Step 2: Professional Information
      const dayLabels: Record<DayOfWeek, string> = {
        [DayOfWeek.MONDAY]: 'Mon',
        [DayOfWeek.TUESDAY]: 'Tue',
        [DayOfWeek.WEDNESDAY]: 'Wed',
        [DayOfWeek.THURSDAY]: 'Thu',
        [DayOfWeek.FRIDAY]: 'Fri',
        [DayOfWeek.SATURDAY]: 'Sat',
        [DayOfWeek.SUNDAY]: 'Sun',
      };

      return (
        <div className="w-full max-w-[960px] flex flex-col">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 md:px-10 pt-8 pb-4">
              <h1 className="text-[#111418] text-2xl md:text-3xl font-bold leading-tight tracking-tight mb-2">
                Doctor Registration
              </h1>
              <p className="text-gray-500">Please fill in your professional details to continue.</p>
            </div>
            <div className="px-6 md:px-10 py-4">
              <div className="flex flex-col gap-3">
                <div className="flex gap-6 justify-between items-end">
                  <p className="text-[#3c83f6] text-sm font-bold uppercase tracking-wider">Step 2 of 2</p>
                  <span className="text-xs font-medium text-gray-500">Professional Information</span>
                </div>
                <div className="flex w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-1/2"></div>
                  <div className="h-full bg-[#3c83f6] w-1/2"></div>
                </div>
              </div>
            </div>
            <form
              className="px-6 md:px-10 py-6 flex flex-col gap-8"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div className="space-y-6">
                <div>
                  <div className="border-b border-gray-100 pb-2 mb-6">
                    <h3 className="text-lg font-bold text-[#111418] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#3c83f6]">badge</span>
                      Professional Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-4">
                      <label className="block text-sm font-medium text-[#111418] mb-2">Title</label>
                      <div className="relative">
                        <select
                          className="w-full appearance-none rounded-lg border border-gray-300 bg-white text-[#111418] px-4 py-3 pr-10 focus:border-[#3c83f6] focus:ring-[#3c83f6] focus:outline-none"
                          value={professionalInfo.title}
                          onChange={(e) => handleProfessionalInfoChange('title', e.target.value)}
                        >
                          <option disabled value="">
                            Select Title
                          </option>
                          <option value="Dr">Dr.</option>
                          <option value="Prof">Prof.</option>
                          <option value="Assoc Prof">Assoc. Prof.</option>
                          <option value="Mr">Mr.</option>
                          <option value="Ms">Ms.</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>
                    <div className="md:col-span-8">
                      <label className="block text-sm font-medium text-[#111418] mb-2">
                        Specialization <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="w-full rounded-lg border border-gray-300 bg-white text-[#111418] px-4 py-3 focus:border-[#3c83f6] focus:ring-[#3c83f6] focus:outline-none placeholder-gray-400"
                        placeholder="e.g. Cardiologist"
                        required
                        type="text"
                        value={professionalInfo.specialization}
                        onChange={(e) => handleProfessionalInfoChange('specialization', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-12">
                      <label className="block text-sm font-medium text-[#111418] mb-2">
                        Qualifications <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        className="w-full rounded-lg border border-gray-300 bg-white text-[#111418] px-4 py-3 focus:border-[#3c83f6] focus:ring-[#3c83f6] focus:outline-none placeholder-gray-400"
                        placeholder="MD, MBBS, PhD"
                        required
                        rows={3}
                        value={professionalInfo.qualifications}
                        onChange={(e) => handleProfessionalInfoChange('qualifications', e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter qualifications separated by commas.</p>
                    </div>
                    <div className="md:col-span-12">
                      <label className="block text-sm font-medium text-[#111418] mb-2 flex justify-between">
                        <span>License Number</span>
                        <span className="text-xs font-normal text-slate-400">Optional</span>
                      </label>
                      <input
                        className="w-full rounded-lg border border-gray-300 bg-white text-[#111418] px-4 py-3 focus:border-[#3c83f6] focus:ring-[#3c83f6] focus:outline-none placeholder-gray-400"
                        placeholder="License #123456"
                        type="text"
                        value={professionalInfo.licenseNumber}
                        onChange={(e) => handleProfessionalInfoChange('licenseNumber', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="border-b border-gray-100 pb-2">
                    <h3 className="text-lg font-bold text-[#111418] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#3c83f6]">calendar_clock</span>
                      Availability
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#111418] mb-3">Working Days</label>
                      <div className="flex flex-wrap gap-2 md:gap-4">
                        {Object.values(DayOfWeek).map((day) => {
                          const isChecked = professionalInfo.workingDays.includes(day);
                          return (
                            <label key={day} className="cursor-pointer">
                              <input
                                className="peer sr-only"
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleWorkingDay(day)}
                              />
                              <div
                                className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border font-medium text-sm transition-all ${
                                  isChecked
                                    ? 'bg-[#3c83f6] text-white border-[#3c83f6]'
                                    : 'border-gray-300 bg-white text-gray-500'
                                }`}
                              >
                                {dayLabels[day]}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div>
                        <label className="block text-sm font-medium text-[#111418] mb-2">Working Hours Start</label>
                        <input
                          className="w-full rounded-lg border border-gray-300 bg-white text-[#111418] px-4 py-3 focus:border-[#3c83f6] focus:ring-[#3c83f6] focus:outline-none"
                          type="time"
                          value={professionalInfo.workingHoursStart || '09:00'}
                          onChange={(e) => handleProfessionalInfoChange('workingHoursStart', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#111418] mb-2">Working Hours End</label>
                        <input
                          className="w-full rounded-lg border border-gray-300 bg-white text-[#111418] px-4 py-3 focus:border-[#3c83f6] focus:ring-[#3c83f6] focus:outline-none"
                          type="time"
                          value={professionalInfo.workingHoursEnd || '17:00'}
                          onChange={(e) => handleProfessionalInfoChange('workingHoursEnd', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col-reverse md:flex-row gap-4 pt-4 border-t border-gray-100 mt-4">
                <button
                  onClick={handlePrevious}
                  disabled={loading || submitted}
                  className="flex-1 md:flex-none py-3 px-8 rounded-lg border border-gray-300 text-[#111418] font-bold text-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  Previous
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || submitted}
                  className="flex-1 md:ml-auto py-3 px-8 rounded-lg bg-[#3c83f6] text-white font-bold text-sm hover:bg-blue-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3c83f6] disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loading size={20} />
                      <span>Submitting...</span>
                    </span>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="flex justify-center mt-6 text-sm text-gray-500 gap-6">
            <a className="hover:text-[#3c83f6] transition-colors" href="#">
              Privacy Policy
            </a>
            <a className="hover:text-[#3c83f6] transition-colors" href="#">
              Terms of Service
            </a>
            <a className="hover:text-[#3c83f6] transition-colors" href="#">
              Help Center
            </a>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f5f7f8] overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 bg-white px-4 md:px-10 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-4 text-[#111418]">
          <div className="size-8 text-[#3c83f6]">
            <span className="material-symbols-outlined text-3xl">medical_services</span>
          </div>
          <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em]">CareSync</h2>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          {auth.currentUser?.photoURL && (
            <button className="flex items-center gap-2">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-gray-100"
                style={{ backgroundImage: `url("${auth.currentUser.photoURL}")` }}
                aria-label="Doctor profile avatar"
              ></div>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex justify-center py-8 px-4 md:px-8">

        {/* Error Message */}
        {error && (
          <div className="w-full max-w-[960px] mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Success State */}
        {submitted ? (
          <div className="w-full max-w-[960px] flex flex-col items-center justify-center px-4 py-8">
            <div className="flex w-full max-w-md flex-col items-center rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-8 text-center">
              <div className="mb-4">
                <div className="inline-block p-4 bg-green-100 rounded-full">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-[#111418] mb-2">
                Registration Submitted Successfully!
              </h2>
              <p className="text-gray-600 mb-4">
                Your account is pending admin approval. You will be redirected to the login page shortly.
              </p>
              <Loading size={32} message="Redirecting..." />
            </div>
          </div>
        ) : (
          renderStepContent()
        )}
      </main>
    </div>
  );
};

export default DoctorRegistrationFlow;

