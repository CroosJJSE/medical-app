// src/pages/auth/PatientRegistrationFlow.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { auth } from '@/services/firebase';
import Loading from '@/components/common/Loading';
import ProgressIndicator from '@/components/common/ProgressIndicator';
import StepHeader from '@/components/common/StepHeader';
import FormField from '@/components/common/FormField';
import GenderSelector from '@/components/common/GenderSelector';
import patientService from '@/services/patientService';
import { Gender, BloodType, MaritalStatus, AllergySeverity } from '@/enums';
import type { Patient } from '@/models/Patient';

const PatientRegistrationFlow: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [patientExists, setPatientExists] = useState(false);

  // Handle redirect after submission
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500); // Give user time to see success message
      return () => clearTimeout(timer);
    }
  }, [submitted, navigate]);

  // Check if patient already exists
  useEffect(() => {
    const checkExistingPatient = async () => {
      // If user is null but signed in with Firebase Auth, they need to register
      if (!auth.currentUser) {
        setChecking(false);
        return;
      }
      
      // If user exists in Firestore, check if they're already a patient
      if (user) {
        try {
          const exists = user.userID !== undefined && user.userID.startsWith('PAT');
          setPatientExists(exists);
        } catch (err) {
          console.error('Error checking patient existence:', err);
        }
      } else {
        // User is signed in with Google but not registered - allow registration
        setPatientExists(false);
      }
      
      setChecking(false);
    };

    checkExistingPatient();
  }, [user]);

  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    primaryPhone: '',
    bloodType: '',
    maritalStatus: '',
    occupation: '',
  });

  // Contact Information State
  const [contactInfo, setContactInfo] = useState({
    secondaryPhone: '',
    email: user?.email || '',
    address: {
      street: '',
      city: '',
      country: '',
    },
  });

  // Emergency Contact State
  const [emergencyContact, setEmergencyContact] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: '',
  });

  // Medical Information State (all optional)
  const [medicalInfo, setMedicalInfo] = useState({
    pastMedicalHistory: '',
    pastSurgicalHistory: '',
    allergies: '',
    familyHistory: '',
    currentMedications: '',
    otherRelevantHistory: '',
  });

  // Allow access if user is signed in with Google (even if not yet registered in Firestore)
  // Only redirect to login if they're not signed in at all
  useEffect(() => {
    if (!auth.currentUser && !checking) {
      navigate('/login', { replace: true });
    }
  }, [checking, navigate]);

  // If not signed in with Firebase Auth, show loading while checking
  if (!auth.currentUser) {
    if (checking) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loading size={48} message="Loading..." />
        </div>
      );
    }
    // Will redirect via useEffect above
    return null;
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading..." />
      </div>
    );
  }

  // If patient already exists, show pending approval message
  if (patientExists) {
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

  const handleContactInfoChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setContactInfo((prev) => {
        const parentValue = prev[parent as keyof typeof prev];
        if (typeof parentValue === 'object' && parentValue !== null) {
          return {
            ...prev,
            [parent]: { ...(parentValue as Record<string, string>), [child]: value },
          };
        }
        return prev;
      });
    } else {
      setContactInfo((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    setEmergencyContact((prev) => ({ ...prev, [field]: value }));
  };

  const handleMedicalInfoChange = (field: string, value: string) => {
    setMedicalInfo((prev) => ({ ...prev, [field]: value }));
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
    if (!personalInfo.dateOfBirth) {
      setError('Date of birth is required');
      return false;
    }
    if (!personalInfo.gender) {
      setError('Gender is required');
      return false;
    }
    if (!personalInfo.primaryPhone.trim()) {
      setError('Primary phone is required');
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

  // Helper function to remove undefined values from object
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
    // Prevent duplicate submissions
    if (loading || submitted) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert form data to Patient model (excluding user metadata fields)
      const patientDataRaw: Omit<Patient, 'userID' | 'AuthID' | 'email' | 'role' | 'displayName' | 'photoURL' | 'status' | 'isApproved' | 'createdAt' | 'updatedAt'> = {
        personalInfo: {
          firstName: personalInfo.firstName.trim(),
          lastName: personalInfo.lastName.trim(),
          dateOfBirth: (() => {
            if (!personalInfo.dateOfBirth) {
              throw new Error('Date of birth is required');
            }
            const date = new Date(personalInfo.dateOfBirth);
            if (isNaN(date.getTime())) {
              throw new Error('Invalid date of birth');
            }
            return date;
          })(),
          gender: personalInfo.gender as Gender,
          ...(personalInfo.bloodType && { bloodType: personalInfo.bloodType as BloodType }),
          ...(personalInfo.maritalStatus && { maritalStatus: personalInfo.maritalStatus as MaritalStatus }),
          ...(personalInfo.occupation.trim() && { occupation: personalInfo.occupation.trim() }),
        },
        contactInfo: {
          primaryPhone: personalInfo.primaryPhone.trim(),
          ...(contactInfo.secondaryPhone.trim() && { secondaryPhone: contactInfo.secondaryPhone.trim() }),
          ...(contactInfo.email.trim() && { email: contactInfo.email.trim() }),
          ...(contactInfo.address.street.trim() && {
            address: [
              contactInfo.address.street.trim(),
              contactInfo.address.city.trim(),
              contactInfo.address.country.trim(),
            ]
              .filter(Boolean)
              .join(', '),
          }),
        },
        ...(emergencyContact.name.trim() || emergencyContact.phone.trim()
          ? {
              emergencyContact: {
                name: emergencyContact.name.trim(),
                relationship: emergencyContact.relationship.trim(),
                phone: emergencyContact.phone.trim(),
              },
            }
          : {}),
        medicalInfo: {
          allergies: medicalInfo.allergies.trim()
            ? medicalInfo.allergies
                .split(',')
                .map((a) => a.trim())
                .filter(Boolean)
                .map((name) => ({
                  name,
                  severity: AllergySeverity.MILD,
                }))
            : [],
          currentMedications: medicalInfo.currentMedications.trim()
            ? medicalInfo.currentMedications
                .split(',')
                .map((m) => m.trim())
                .filter(Boolean)
            : [],
          medicalHistory: medicalInfo.pastMedicalHistory.trim()
            ? medicalInfo.pastMedicalHistory
                .split(',')
                .map((h) => h.trim())
                .filter(Boolean)
            : [],
          surgicalHistory: medicalInfo.pastSurgicalHistory.trim()
            ? medicalInfo.pastSurgicalHistory
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          familyHistory: medicalInfo.familyHistory.trim()
            ? medicalInfo.familyHistory
                .split(',')
                .map((f) => f.trim())
                .filter(Boolean)
            : [],
          socialHistory: {},
        },
      };

      // Remove all undefined values before saving to Firestore
      const patientData = removeUndefined(patientDataRaw);

      // Get Firebase Auth UID and user info
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        setError('You must be signed in to register. Please sign in again.');
        setLoading(false);
        return;
      }

      // Create patient - this will generate userID and create document
      await patientService.createPatient(
        firebaseUser.uid,
        patientData,
        {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        }
      );
      
      // Mark as submitted to prevent duplicate submissions
      setSubmitted(true);
      // Redirect will be handled by useEffect
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to submit registration. Please try again.');
      setLoading(false);
    }
  };

  // Step titles
  const stepTitles = [
    'Step 1: Personal Information',
    'Step 2: Contact Information',
    'Step 3: Medical Information',
  ];

  // Step content renderers
  const renderStepContent = () => {
    if (step === 0) {
      // Step 1: Personal Information
      return (
        <div className="flex flex-1 flex-col px-4 pt-5 pb-8">
          <div className="flex w-full flex-1 flex-col rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-6">
            <h2 className="text-[#111418] text-[28px] font-bold leading-tight text-left pb-5">
              Let's start with the basics
            </h2>
            <div className="flex flex-col gap-4">
              <FormField
                label="First Name"
                value={personalInfo.firstName}
                onChange={(value) => handlePersonalInfoChange('firstName', value)}
                placeholder="Enter your first name"
                required
              />
              <FormField
                label="Last Name"
                value={personalInfo.lastName}
                onChange={(value) => handlePersonalInfoChange('lastName', value)}
                placeholder="Enter your last name"
                required
              />
              <FormField
                label="Date of Birth"
                type="date"
                value={personalInfo.dateOfBirth}
                onChange={(value) => handlePersonalInfoChange('dateOfBirth', value)}
                placeholder="MM/DD/YYYY"
                required
                icon={<span className="material-symbols-outlined text-2xl">calendar_today</span>}
              />
              <GenderSelector
                value={personalInfo.gender}
                onChange={(value) => handlePersonalInfoChange('gender', value)}
                required
              />
              <FormField
                label="Phone Number"
                type="tel"
                value={personalInfo.primaryPhone}
                onChange={(value) => handlePersonalInfoChange('primaryPhone', value)}
                placeholder="(555) 123-4567"
                required
              />
            </div>
          </div>
          <div className="flex-grow"></div>
          <div className="pt-8">
            <button
              onClick={handleNext}
              disabled={loading || submitted}
              className="flex h-14 w-full items-center justify-center rounded-xl bg-[#3c83f6] px-6 text-base font-bold text-white shadow-sm hover:bg-[#3c83f6]/90 focus:outline-none focus:ring-2 focus:ring-[#3c83f6] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      );
    } else if (step === 1) {
      // Step 2: Contact Information
      return (
        <div className="flex flex-1 flex-col px-4 pt-5 pb-8">
          <div className="flex w-full flex-1 flex-col rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-6">
            <h2 className="text-[#111418] text-[28px] font-bold leading-tight text-left pb-5">
              Contact details
            </h2>
            <div className="flex flex-col gap-4">
              <FormField
                label="Secondary Phone (Optional)"
                type="tel"
                value={contactInfo.secondaryPhone}
                onChange={(value) => handleContactInfoChange('secondaryPhone', value)}
                placeholder="(555) 123-4567"
              />
              <FormField
                label="Email (Optional)"
                type="email"
                value={contactInfo.email}
                onChange={(value) => handleContactInfoChange('email', value)}
                placeholder="your.email@example.com"
              />
              <div className="pt-2">
                <h3 className="text-[#111418] text-lg font-semibold mb-4">Address (Optional)</h3>
                <div className="flex flex-col gap-4">
                  <FormField
                    label="Street Address"
                    value={contactInfo.address.street}
                    onChange={(value) => handleContactInfoChange('address.street', value)}
                    placeholder="123 Main Street"
                  />
                  <FormField
                    label="City"
                    value={contactInfo.address.city}
                    onChange={(value) => handleContactInfoChange('address.city', value)}
                    placeholder="City"
                  />
                  <FormField
                    label="Country"
                    value={contactInfo.address.country}
                    onChange={(value) => handleContactInfoChange('address.country', value)}
                    placeholder="Country"
                  />
                </div>
              </div>
              <div className="pt-2">
                <h3 className="text-[#111418] text-lg font-semibold mb-4">Emergency Contact (Optional)</h3>
                <div className="flex flex-col gap-4">
                  <FormField
                    label="Name"
                    value={emergencyContact.name}
                    onChange={(value) => handleEmergencyContactChange('name', value)}
                    placeholder="Emergency contact name"
                  />
                  <FormField
                    label="Relationship"
                    value={emergencyContact.relationship}
                    onChange={(value) => handleEmergencyContactChange('relationship', value)}
                    placeholder="e.g., Spouse, Parent, Friend"
                  />
                  <FormField
                    label="Phone"
                    type="tel"
                    value={emergencyContact.phone}
                    onChange={(value) => handleEmergencyContactChange('phone', value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex-grow"></div>
          <div className="pt-8 flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={loading || submitted}
              className="flex h-14 flex-1 items-center justify-center rounded-xl border-2 border-[#dbdfe6] bg-white px-6 text-base font-bold text-[#111418] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#3c83f6] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={loading || submitted}
              className="flex h-14 flex-1 items-center justify-center rounded-xl bg-[#3c83f6] px-6 text-base font-bold text-white shadow-sm hover:bg-[#3c83f6]/90 focus:outline-none focus:ring-2 focus:ring-[#3c83f6] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      );
    } else {
      // Step 3: Medical Information
      return (
        <div className="flex flex-1 flex-col px-4 pt-5 pb-8">
          <div className="flex w-full flex-1 flex-col rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-6">
            <h2 className="text-[#111418] text-[28px] font-bold leading-tight text-left pb-2">
              Medical history
            </h2>
            <p className="text-gray-600 text-sm mb-5">
              All fields below are optional. Please provide any relevant medical information.
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="flex flex-col">
                  <p className="text-[#111418] text-base font-medium leading-normal pb-2">
                    Past Medical History
                    <span className="text-xs text-gray-500 block font-normal mt-1">
                      List any past or current medical conditions (e.g., Diabetes, Hypertension, Asthma). Separate multiple conditions with commas.
                    </span>
                  </p>
                  <textarea
                    value={medicalInfo.pastMedicalHistory}
                    onChange={(e) => handleMedicalInfoChange('pastMedicalHistory', e.target.value)}
                    className="w-full rounded-lg border border-[#dbdfe6] bg-white focus:outline-0 focus:ring-2 focus:ring-[#3c83f6]/50 focus:border-[#3c83f6] p-[15px] text-base font-normal leading-normal min-h-[100px] placeholder:text-[#60708a]"
                    placeholder="e.g., Diabetes Type 2, Hypertension"
                  />
                </label>
              </div>
              <div>
                <label className="flex flex-col">
                  <p className="text-[#111418] text-base font-medium leading-normal pb-2">
                    Past Surgical History
                    <span className="text-xs text-gray-500 block font-normal mt-1">
                      List any past surgeries or procedures. Include the date if known. Separate multiple entries with commas.
                    </span>
                  </p>
                  <textarea
                    value={medicalInfo.pastSurgicalHistory}
                    onChange={(e) => handleMedicalInfoChange('pastSurgicalHistory', e.target.value)}
                    className="w-full rounded-lg border border-[#dbdfe6] bg-white focus:outline-0 focus:ring-2 focus:ring-[#3c83f6]/50 focus:border-[#3c83f6] p-[15px] text-base font-normal leading-normal min-h-[100px] placeholder:text-[#60708a]"
                    placeholder="e.g., Appendectomy (2010), Knee Surgery (2015)"
                  />
                </label>
              </div>
              <div>
                <label className="flex flex-col">
                  <p className="text-[#111418] text-base font-medium leading-normal pb-2">
                    Allergies
                    <span className="text-xs text-gray-500 block font-normal mt-1">
                      List any known allergies (medications, food, environmental, etc.). Include severity if known. Separate multiple allergies with commas.
                    </span>
                  </p>
                  <textarea
                    value={medicalInfo.allergies}
                    onChange={(e) => handleMedicalInfoChange('allergies', e.target.value)}
                    className="w-full rounded-lg border border-[#dbdfe6] bg-white focus:outline-0 focus:ring-2 focus:ring-[#3c83f6]/50 focus:border-[#3c83f6] p-[15px] text-base font-normal leading-normal min-h-[100px] placeholder:text-[#60708a]"
                    placeholder="e.g., Penicillin (severe), Peanuts (moderate)"
                  />
                </label>
              </div>
              <div>
                <label className="flex flex-col">
                  <p className="text-[#111418] text-base font-medium leading-normal pb-2">
                    Family History
                    <span className="text-xs text-gray-500 block font-normal mt-1">
                      List any medical conditions that run in your family. Include the relation if known. Separate multiple entries with commas.
                    </span>
                  </p>
                  <textarea
                    value={medicalInfo.familyHistory}
                    onChange={(e) => handleMedicalInfoChange('familyHistory', e.target.value)}
                    className="w-full rounded-lg border border-[#dbdfe6] bg-white focus:outline-0 focus:ring-2 focus:ring-[#3c83f6]/50 focus:border-[#3c83f6] p-[15px] text-base font-normal leading-normal min-h-[100px] placeholder:text-[#60708a]"
                    placeholder="e.g., Heart disease (Father), Diabetes (Mother)"
                  />
                </label>
              </div>
              <div>
                <label className="flex flex-col">
                  <p className="text-[#111418] text-base font-medium leading-normal pb-2">
                    Current Medications
                    <span className="text-xs text-gray-500 block font-normal mt-1">
                      List all medications you are currently taking, including dosage if known. Separate multiple medications with commas.
                    </span>
                  </p>
                  <textarea
                    value={medicalInfo.currentMedications}
                    onChange={(e) => handleMedicalInfoChange('currentMedications', e.target.value)}
                    className="w-full rounded-lg border border-[#dbdfe6] bg-white focus:outline-0 focus:ring-2 focus:ring-[#3c83f6]/50 focus:border-[#3c83f6] p-[15px] text-base font-normal leading-normal min-h-[100px] placeholder:text-[#60708a]"
                    placeholder="e.g., Metformin 500mg twice daily, Lisinopril 10mg once daily"
                  />
                </label>
              </div>
              <div>
                <label className="flex flex-col">
                  <p className="text-[#111418] text-base font-medium leading-normal pb-2">
                    Any Other Relevant History
                    <span className="text-xs text-gray-500 block font-normal mt-1">
                      Include any other relevant medical information, lifestyle factors, or health concerns that may be important for your care.
                    </span>
                  </p>
                  <textarea
                    value={medicalInfo.otherRelevantHistory}
                    onChange={(e) => handleMedicalInfoChange('otherRelevantHistory', e.target.value)}
                    className="w-full rounded-lg border border-[#dbdfe6] bg-white focus:outline-0 focus:ring-2 focus:ring-[#3c83f6]/50 focus:border-[#3c83f6] p-[15px] text-base font-normal leading-normal min-h-[100px] placeholder:text-[#60708a]"
                    placeholder="e.g., Smoking history, exercise habits, dietary restrictions"
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="flex-grow"></div>
          <div className="pt-8 flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={loading || submitted}
              className="flex h-14 flex-1 items-center justify-center rounded-xl border-2 border-[#dbdfe6] bg-white px-6 text-base font-bold text-[#111418] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#3c83f6] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || submitted}
              className="flex h-14 flex-1 items-center justify-center rounded-xl bg-[#3c83f6] px-6 text-base font-bold text-white shadow-sm hover:bg-[#3c83f6]/90 focus:outline-none focus:ring-2 focus:ring-[#3c83f6] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <Loading size={20} />
                  <span className="ml-2">Submitting...</span>
                </span>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f5f7f8] overflow-x-hidden">
      {/* Top App Bar */}
      <StepHeader
        title={stepTitles[step]}
        onBack={step > 0 ? handlePrevious : undefined}
        showBack={step > 0}
      />

      {/* Progress Indicator */}
      <ProgressIndicator currentStep={step + 1} totalSteps={3} />

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Success State */}
      {submitted ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
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
    </div>
  );
};

export default PatientRegistrationFlow;

