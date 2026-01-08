// src/pages/patient/Profile.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePatient } from '@/hooks/usePatient';
import Loading from '@/components/common/Loading';
import BottomNavigation from '@/components/layout/BottomNavigation';
import encounterService from '@/services/encounterService';
import { getDoctor } from '@/services/doctorService';
import type { Encounter } from '@/models/Encounter';
import type { Doctor } from '@/models/Doctor';

const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const userId = user?.userID || user?.userId || '';
  const { patient, loading: patientLoading } = usePatient(userId, userId);
  const [latestEncounter, setLatestEncounter] = useState<Encounter | null>(null);
  const [assignedDoctor, setAssignedDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!patient) return;

      try {
        // Get latest encounter for weight
        const encounters = await encounterService.getEncountersByPatient(patient.userID);
        if (encounters.length > 0) {
          // Sort by date and get the most recent
          // Helper to convert date to Date object
          const toDate = (date: any): Date => {
            if (date instanceof Date) return date;
            if (date && typeof date.toDate === 'function') return date.toDate();
            return new Date(date);
          };
          const sorted = encounters.sort(
            (a, b) => toDate(b.encounterDate).getTime() - toDate(a.encounterDate).getTime()
          );
          setLatestEncounter(sorted[0]);
        }

        // Get assigned doctor info
        if (patient.assignedDoctorId) {
          const doctor = await getDoctor(patient.assignedDoctorId);
          setAssignedDoctor(doctor);
        }
      } catch (error) {
        console.error('[PATIENT_PROFILE] Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (patient) {
      loadData();
    } else if (!patientLoading) {
      setLoading(false);
    }
  }, [patient, patientLoading]);

  if (patientLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading profile..." />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-red-500 mb-4">Patient profile not found</p>
          <button
            onClick={() => navigate('/patient/dashboard')}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Convert Firestore Timestamp or Date to Date object
  const toDate = (date: any): Date => {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    if (date && typeof date.toDate === 'function') {
      // Firestore Timestamp
      return date.toDate();
    }
    if (typeof date === 'string' || typeof date === 'number') {
      return new Date(date);
    }
    return new Date();
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: any): number => {
    const dob = toDate(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  // Format date
  const formatDate = (date: any): string => {
    const d = toDate(date);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  };

  const age = patient.personalInfo?.dateOfBirth
    ? calculateAge(patient.personalInfo.dateOfBirth)
    : null;
  const weight = latestEncounter?.objective?.vitalSigns?.weight;
  const fullName = `${patient.personalInfo?.firstName || ''} ${patient.personalInfo?.lastName || ''}`.trim() || patient.displayName;
  const doctorName = assignedDoctor
    ? `Dr. ${assignedDoctor.professionalInfo?.firstName || ''} ${assignedDoctor.professionalInfo?.lastName || ''}`.trim()
    : 'Not assigned';

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-[#f9fafb] shadow-xl pb-24">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#e5e7eb]">
        <div className="w-12">
          <button
            onClick={() => navigate('/patient/dashboard')}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[#1f2937]">arrow_back</span>
          </button>
        </div>
        <h1 className="text-lg font-bold leading-tight tracking-tight text-center flex-1 text-[#1f2937]">
          Profile
        </h1>
        <div className="w-12"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 px-4 py-6">
        {/* Profile Header */}
        <section className="flex flex-col items-center gap-4">
          <div className="relative group">
            {patient.photoURL || user?.photoURL ? (
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full h-32 w-32 shadow-sm border-4 border-white"
                style={{
                  backgroundImage: `url("${patient.photoURL || user?.photoURL}")`,
                }}
              />
            ) : (
              <div className="rounded-full h-32 w-32 bg-primary flex items-center justify-center shadow-sm border-4 border-white">
                <span className="text-white text-4xl font-bold">
                  {fullName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center text-center gap-1">
            <h2 className="text-2xl font-bold leading-tight tracking-tight text-[#1f2937]">
              {fullName}
            </h2>
            <p className="text-[#4b5563] text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
              ID: #{patient.userID}
            </p>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1 rounded-2xl bg-white p-4 items-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#e5e7eb]">
            <div className="p-2 bg-blue-50 rounded-full mb-1">
              <span className="material-symbols-outlined text-primary text-[20px]">cake</span>
            </div>
            <p className="text-xl font-bold leading-tight text-[#1f2937]">{age || 'N/A'}</p>
            <p className="text-[#4b5563] text-xs font-medium">Age</p>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl bg-white p-4 items-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#e5e7eb]">
            <div className="p-2 bg-red-50 rounded-full mb-1">
              <span className="material-symbols-outlined text-red-500 text-[20px]">bloodtype</span>
            </div>
            <p className="text-xl font-bold leading-tight text-[#1f2937]">
              {patient.personalInfo?.bloodType || 'N/A'}
            </p>
            <p className="text-[#4b5563] text-xs font-medium">Blood Type</p>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl bg-white p-4 items-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#e5e7eb]">
            <div className="p-2 bg-green-50 rounded-full mb-1">
              <span className="material-symbols-outlined text-green-600 text-[20px]">monitor_weight</span>
            </div>
            <p className="text-xl font-bold leading-tight text-[#1f2937]">
              {weight ? `${weight} kg` : 'N/A'}
            </p>
            <p className="text-[#4b5563] text-xs font-medium">Weight</p>
          </div>
        </section>

        {/* Information Accordions */}
        <section className="flex flex-col gap-4">
          {/* Personal Info */}
          <details className="group flex flex-col rounded-xl bg-white border border-[#e5e7eb] overflow-hidden shadow-sm" open>
            <summary className="flex cursor-pointer items-center justify-between gap-4 p-4 hover:bg-gray-50 transition-colors select-none">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">person</span>
                <p className="text-base font-bold leading-normal text-[#1f2937]">
                  Personal Information
                </p>
              </div>
              <span className="material-symbols-outlined text-[#4b5563] group-open:rotate-180 transition-transform">
                expand_more
              </span>
            </summary>
            <div className="px-4 pb-4 pt-0 flex flex-col gap-3 border-t border-gray-100 mt-2">
              <div className="flex justify-between gap-x-6 py-2 border-b border-gray-50 last:border-0">
                <p className="text-[#4b5563] text-sm font-medium">Date of Birth</p>
                <p className="text-[#1f2937] text-sm font-medium text-right">
                  {patient.personalInfo?.dateOfBirth
                    ? formatDate(patient.personalInfo.dateOfBirth)
                    : 'N/A'}
                </p>
              </div>
              <div className="flex justify-between gap-x-6 py-2 border-b border-gray-50 last:border-0">
                <p className="text-[#4b5563] text-sm font-medium">Gender</p>
                <p className="text-[#1f2937] text-sm font-medium text-right">
                  {patient.personalInfo?.gender
                    ? patient.personalInfo.gender.charAt(0).toUpperCase() +
                      patient.personalInfo.gender.slice(1)
                    : 'N/A'}
                </p>
              </div>
              <div className="flex justify-between gap-x-6 py-2 border-b border-gray-50 last:border-0">
                <p className="text-[#4b5563] text-sm font-medium">Phone</p>
                <a
                  className="text-primary text-sm font-medium text-right hover:underline"
                  href={`tel:${patient.contactInfo?.primaryPhone || ''}`}
                >
                  {patient.contactInfo?.primaryPhone || 'N/A'}
                </a>
              </div>
              <div className="flex justify-between gap-x-6 py-2 border-b border-gray-50 last:border-0">
                <p className="text-[#4b5563] text-sm font-medium">Email</p>
                <p className="text-[#1f2937] text-sm font-medium text-right break-all">
                  {patient.contactInfo?.email || patient.email || 'N/A'}
                </p>
              </div>
            </div>
          </details>

          {/* Emergency Contact */}
          {patient.emergencyContact && (
            <details className="group flex flex-col rounded-xl bg-white border border-[#e5e7eb] overflow-hidden shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between gap-4 p-4 hover:bg-gray-50 transition-colors select-none">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">contact_phone</span>
                  <p className="text-base font-bold leading-normal text-[#1f2937]">
                    Emergency Contact
                  </p>
                </div>
                <span className="material-symbols-outlined text-[#4b5563] group-open:rotate-180 transition-transform">
                  expand_more
                </span>
              </summary>
              <div className="px-4 pb-4 pt-0 flex flex-col gap-3 border-t border-gray-100 mt-2">
                <div className="flex justify-between gap-x-6 py-2 border-b border-gray-50 last:border-0">
                  <p className="text-[#4b5563] text-sm font-medium">Name</p>
                  <p className="text-[#1f2937] text-sm font-medium text-right">
                    {patient.emergencyContact.name}
                  </p>
                </div>
                <div className="flex justify-between gap-x-6 py-2 border-b border-gray-50 last:border-0">
                  <p className="text-[#4b5563] text-sm font-medium">Relation</p>
                  <p className="text-[#1f2937] text-sm font-medium text-right">
                    {patient.emergencyContact.relationship
                      ? patient.emergencyContact.relationship.charAt(0).toUpperCase() +
                        patient.emergencyContact.relationship.slice(1)
                      : 'N/A'}
                  </p>
                </div>
                <div className="flex justify-between gap-x-6 py-2 border-b border-gray-50 last:border-0">
                  <p className="text-[#4b5563] text-sm font-medium">Phone</p>
                  <a
                    className="text-primary text-sm font-medium text-right hover:underline"
                    href={`tel:${patient.emergencyContact.phone}`}
                  >
                    {patient.emergencyContact.phone}
                  </a>
                </div>
              </div>
            </details>
          )}

          {/* Medical Snapshot */}
          <details className="group flex flex-col rounded-xl bg-white border border-[#e5e7eb] overflow-hidden shadow-sm" open>
            <summary className="flex cursor-pointer items-center justify-between gap-4 p-4 hover:bg-gray-50 transition-colors select-none">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">medical_services</span>
                <p className="text-base font-bold leading-normal text-[#1f2937]">
                  Medical Snapshot
                </p>
              </div>
              <span className="material-symbols-outlined text-[#4b5563] group-open:rotate-180 transition-transform">
                expand_more
              </span>
            </summary>
            <div className="px-4 pb-4 pt-0 flex flex-col gap-3 border-t border-gray-100 mt-2">
              {/* Known Allergies */}
              <div className="flex flex-col gap-1 py-2 border-b border-gray-50 last:border-0">
                <p className="text-[#4b5563] text-xs uppercase tracking-wider font-semibold">
                  Known Allergies
                </p>
                {patient.medicalInfo?.allergies && patient.medicalInfo.allergies.length > 0 ? (
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-red-500 text-sm pt-0.5">
                      warning
                    </span>
                    <p className="text-red-600 text-sm font-bold leading-normal">
                      {patient.medicalInfo.allergies.map((a) => a.name).join(', ')}
                    </p>
                  </div>
                ) : (
                  <p className="text-[#4b5563] text-sm font-medium">None recorded</p>
                )}
              </div>

              {/* Current Medications */}
              <div className="flex flex-col gap-1 py-2 border-b border-gray-50 last:border-0">
                <p className="text-[#4b5563] text-xs uppercase tracking-wider font-semibold">
                  Current Medications
                </p>
                {patient.medicalInfo?.currentMedications &&
                patient.medicalInfo.currentMedications.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#4b5563] text-sm">pill</span>
                    <p className="text-[#1f2937] text-sm font-medium leading-normal">
                      {patient.medicalInfo.currentMedications.join(', ')}
                    </p>
                  </div>
                ) : (
                  <p className="text-[#4b5563] text-sm font-medium">None recorded</p>
                )}
              </div>

              {/* Primary Care Physician */}
              <div className="flex flex-col gap-1 py-2 border-b border-gray-50 last:border-0">
                <p className="text-[#4b5563] text-xs uppercase tracking-wider font-semibold">
                  Primary Care Physician
                </p>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4b5563] text-sm">
                    stethoscope
                  </span>
                  <p className="text-[#1f2937] text-sm font-medium leading-normal">{doctorName}</p>
                </div>
              </div>
            </div>
          </details>
        </section>

        {/* Bottom Actions */}
        <div className="mt-4 mb-8">
          <button
            onClick={async () => {
              try {
                await signOut();
                navigate('/login');
              } catch (error) {
                console.error('Error signing out:', error);
              }
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-[#1f2937] text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[#4b5563]">logout</span>
            Log Out
          </button>
          <p className="text-center text-xs text-[#4b5563] mt-6">CareSync App v2.4.0</p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Profile;
