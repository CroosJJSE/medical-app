// src/pages/doctor/NewEncounter.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DoctorHeader from '@/components/layout/DoctorHeader';
import Loading from '@/components/common/Loading';
import patientService from '@/services/patientService';
import appointmentService from '@/services/appointmentService';
import encounterService from '@/services/encounterService';
import type { Patient } from '@/models/Patient';
import type { Appointment } from '@/models/Appointment';
import type { Encounter } from '@/models/Encounter';
import { EncounterType } from '@/enums';

interface Diagnosis {
  code: string;
  name: string;
}

interface Prescription {
  medicationId?: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

const NewEncounter: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const patientId = searchParams.get('patientId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  // Form state
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState('');
  const [physicalExamination, setPhysicalExamination] = useState('');
  const [planInstructions, setPlanInstructions] = useState('');

  // Diagnosis state
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<Diagnosis[]>([]);
  const [diagnosisOptions, setDiagnosisOptions] = useState<Diagnosis[]>([]); // Will be loaded from DB

  // Prescription state
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [newPrescription, setNewPrescription] = useState<Prescription>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
  });
  const [medicationOptions, setMedicationOptions] = useState<any[]>([]); // Will be loaded from DB

  // Follow-up state
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!user?.userID || !patientId) {
        setLoading(false);
        return;
      }

      try {
        // Load patient data
        const patientData = await patientService.getPatient(patientId);
        setPatient(patientData);

        // Load appointment data if appointmentId is provided
        if (appointmentId) {
          try {
            const appointmentData = await appointmentService.getAppointment(appointmentId);
            setAppointment(appointmentData);
          } catch (error) {
            console.error('Error loading appointment:', error);
          }
        }

        // TODO: Load diagnosis options from database
        // TODO: Load medication options from database
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, patientId, appointmentId]);

  const handleAddDiagnosis = () => {
    if (diagnosisSearch.trim()) {
      // TODO: Search from database, for now add as-is
      const newDiagnosis: Diagnosis = {
        code: '', // Will be populated from DB search
        name: diagnosisSearch.trim(),
      };
      setSelectedDiagnoses([...selectedDiagnoses, newDiagnosis]);
      setDiagnosisSearch('');
    }
  };

  const handleRemoveDiagnosis = (index: number) => {
    setSelectedDiagnoses(selectedDiagnoses.filter((_, i) => i !== index));
  };

  const handleAddPrescription = () => {
    if (newPrescription.name && newPrescription.dosage && newPrescription.frequency && newPrescription.duration) {
      setPrescriptions([...prescriptions, { ...newPrescription }]);
      setNewPrescription({ name: '', dosage: '', frequency: '', duration: '' });
    }
  };

  const handleRemovePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!user?.userID || !patientId || !chiefComplaint.trim()) {
      alert('Please fill in at least the Chief Complaint field');
      return;
    }

    setSaving(true);
    try {
      const encounterData: Omit<Encounter, 'encounterId' | 'createdAt' | 'updatedAt' | 'isDraft'> = {
        patientId,
        doctorId: user.userID,
        appointmentId: appointmentId || undefined,
        encounterDate: new Date(),
        encounterType: EncounterType.FOLLOW_UP,
        subjective: {
          chiefComplaint,
          historyOfPresentingComplaint: historyOfPresentIllness || undefined,
        },
        objective: {
          physicalExamination: physicalExamination || undefined,
        },
        assessment: {
          icd10Codes: selectedDiagnoses.map(d => d.code || d.name),
          differentialDiagnosis: selectedDiagnoses.map(d => d.name),
        },
        plan: {
          treatmentPlan: planInstructions || undefined,
          medications: prescriptions.map(p => p.medicationId || p.name),
          followUp: followUpDate ? `${followUpDate}${followUpTime ? ` ${followUpTime}` : ''}${followUpNotes ? ` - ${followUpNotes}` : ''}` : undefined,
        },
        createdBy: user.userID,
      };

      await encounterService.saveDraft(encounterData);
      alert('Draft saved successfully');
    } catch (error: any) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!user?.userID || !patientId || !chiefComplaint.trim()) {
      alert('Please fill in at least the Chief Complaint field');
      return;
    }

    setSaving(true);
    try {
      const encounterData: Omit<Encounter, 'encounterId' | 'createdAt' | 'updatedAt' | 'isDraft'> = {
        patientId,
        doctorId: user.userID,
        appointmentId: appointmentId || undefined,
        encounterDate: new Date(),
        encounterType: EncounterType.FOLLOW_UP,
        subjective: {
          chiefComplaint,
          historyOfPresentingComplaint: historyOfPresentIllness || undefined,
        },
        objective: {
          physicalExamination: physicalExamination || undefined,
        },
        assessment: {
          icd10Codes: selectedDiagnoses.map(d => d.code || d.name),
          differentialDiagnosis: selectedDiagnoses.map(d => d.name),
        },
        plan: {
          treatmentPlan: planInstructions || undefined,
          medications: prescriptions.map(p => p.medicationId || p.name),
          followUp: followUpDate ? `${followUpDate}${followUpTime ? ` ${followUpTime}` : ''}${followUpNotes ? ` - ${followUpNotes}` : ''}` : undefined,
        },
        createdBy: user.userID,
      };

      await encounterService.createEncounter(encounterData);
      alert('Encounter finalized successfully');
      
      // Navigate back
      if (patientId) {
        navigate(`/doctor/patient-profile/${patientId}`);
      } else {
        navigate('/doctor/dashboard');
      }
    } catch (error: any) {
      console.error('Error finalizing encounter:', error);
      alert('Failed to finalize encounter: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = (dateOfBirth: Date | string | undefined): number => {
    if (!dateOfBirth) return 0;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const formatAppointmentDate = (date: Date): string => {
    const d = new Date(date);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + 
           d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7f8] flex flex-col">
        <DoctorHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loading size={48} message="Loading patient data..." />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-[#f5f7f8] flex flex-col">
        <DoctorHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">Patient not found</p>
            <button
              onClick={() => navigate('/doctor/patients')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600"
            >
              Back to Patients
            </button>
          </div>
        </div>
      </div>
    );
  }

  const age = calculateAge(patient.personalInfo?.dateOfBirth);
  const gender = patient.personalInfo?.gender || 'N/A';
  const phone = patient.contactInfo?.primaryPhone || 'N/A';

  return (
    <div className="min-h-screen bg-[#f5f7f8] flex flex-col">
      <DoctorHeader />

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8 lg:px-20 max-w-[1600px] mx-auto w-full">
        {/* Page Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            {appointment && (
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  Linked to Appointment #{appointment.appointmentId}
                </span>
                <span className="text-xs text-gray-500">
                  • {formatAppointmentDate(appointment.dateTime)}
                </span>
              </div>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-[#111418]">New Medical Encounter</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center justify-center rounded-lg h-10 px-5 border border-[#dbdfe6] bg-white text-[#111418] text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={handleFinalize}
              disabled={saving}
              className="flex items-center justify-center rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Finalizing...' : 'Finalize Encounter'}
            </button>
          </div>
        </div>

        {/* Patient Context Card */}
        <div className="bg-white rounded-xl border border-[#dbdfe6] p-5 shadow-sm mb-6 flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-blue-50 to-transparent pointer-events-none"></div>
          <div className="flex items-center gap-4 flex-1">
            <div className="relative">
              <div className="size-16 rounded-full bg-center bg-cover border border-gray-200" style={{
                backgroundImage: patient.photoURL ? `url("${patient.photoURL}")` : undefined,
                backgroundColor: patient.photoURL ? undefined : '#e5e7eb'
              }}>
                {!patient.photoURL && (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl font-bold">
                    {patient.displayName?.charAt(0) || 'P'}
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 size-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#111418] flex items-center gap-2">
                {patient.displayName || `${patient.personalInfo?.firstName || ''} ${patient.personalInfo?.lastName || ''}`.trim() || 'Patient'}
                <span className="text-sm font-normal text-gray-500">(ID: {patient.patientId || patient.userID})</span>
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                  {age} Years
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">{gender.toLowerCase() === 'female' ? 'female' : 'male'}</span>
                  {gender}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  {phone}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
            <button
              onClick={() => navigate(`/doctor/patient-profile/${patientId}`)}
              className="flex flex-1 md:flex-none items-center justify-center gap-2 rounded-lg px-4 py-2 bg-[#f0f2f5] text-[#111418] text-sm font-bold hover:bg-gray-200 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              View History
            </button>
            <button
              onClick={() => navigate(`/doctor/patient-profile/${patientId}`)}
              className="flex flex-1 md:flex-none items-center justify-center gap-2 rounded-lg px-4 py-2 bg-[#f0f2f5] text-[#111418] text-sm font-bold hover:bg-gray-200 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Info
            </button>
          </div>
        </div>

        {/* Form Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Clinical Narrative (Wider) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* SOAP Notes Section */}
            <section className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm overflow-hidden">
              <div className="border-b border-[#dbdfe6] px-6 py-4 bg-gray-50/50">
                <h3 className="text-lg font-bold text-[#111418] flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">clinical_notes</span>
                  Clinical Notes
                </h3>
              </div>
              <div className="p-6 flex flex-col gap-6">
                {/* Chief Complaint */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#111418] text-sm font-bold leading-normal flex justify-between">
                    Chief Complaint <span className="text-red-500 font-normal">*Required</span>
                  </label>
                  <textarea
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    className="flex w-full resize-none rounded-lg text-[#111418] border border-[#dbdfe6] bg-white focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px] p-3 text-base placeholder:text-gray-400 transition-shadow"
                    placeholder="Describe the primary reason for the visit..."
                  />
                </div>

                {/* HPI */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#111418] text-sm font-bold leading-normal">History of Present Illness</label>
                  <textarea
                    value={historyOfPresentIllness}
                    onChange={(e) => setHistoryOfPresentIllness(e.target.value)}
                    className="flex w-full resize-none rounded-lg text-[#111418] border border-[#dbdfe6] bg-white focus:border-primary focus:ring-1 focus:ring-primary min-h-[120px] p-3 text-base placeholder:text-gray-400 transition-shadow"
                    placeholder="Detailed history including onset, duration, and associated symptoms..."
                  />
                </div>

                {/* Physical Exam */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#111418] text-sm font-bold leading-normal">Physical Examination</label>
                  <textarea
                    value={physicalExamination}
                    onChange={(e) => setPhysicalExamination(e.target.value)}
                    className="flex w-full resize-none rounded-lg text-[#111418] border border-[#dbdfe6] bg-white focus:border-primary focus:ring-1 focus:ring-primary min-h-[120px] p-3 text-base placeholder:text-gray-400 transition-shadow"
                    placeholder="Record physical findings (Vital signs, HEENT, Respiratory, etc.)..."
                  />
                </div>

                {/* Plan/Treatment */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#111418] text-sm font-bold leading-normal">Plan & Instructions</label>
                  <textarea
                    value={planInstructions}
                    onChange={(e) => setPlanInstructions(e.target.value)}
                    className="flex w-full resize-none rounded-lg text-[#111418] border border-[#dbdfe6] bg-white focus:border-primary focus:ring-1 focus:ring-primary min-h-[120px] p-3 text-base placeholder:text-gray-400 transition-shadow"
                    placeholder="Outline the treatment plan and patient instructions..."
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Structured Data (Narrower) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Assessment / Diagnosis */}
            <section className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
              <div className="border-b border-[#dbdfe6] px-5 py-3 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-base font-bold text-[#111418] flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">stethoscope</span>
                  Assessment / Diagnosis
                </h3>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[20px]">search</span>
                  <input
                    type="text"
                    value={diagnosisSearch}
                    onChange={(e) => setDiagnosisSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddDiagnosis()}
                    className="w-full rounded-lg border border-[#dbdfe6] pl-10 pr-3 py-2 text-sm bg-white text-[#111418] placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Search ICD-10 or add diagnosis..."
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedDiagnoses.map((diagnosis, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                    >
                      {diagnosis.code ? `${diagnosis.name} (${diagnosis.code})` : diagnosis.name}
                      <button
                        onClick={() => handleRemoveDiagnosis(index)}
                        className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                      >
                        <span className="material-symbols-outlined text-[16px] font-bold">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Prescriptions */}
            <section className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm flex-1">
              <div className="border-b border-[#dbdfe6] px-5 py-3 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-base font-bold text-[#111418] flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">pill</span>
                  Prescriptions
                </h3>
                <button
                  onClick={handleAddPrescription}
                  className="text-primary hover:text-blue-700 text-sm font-bold flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Med
                </button>
              </div>
              <div className="p-0">
                {/* Added Prescription Items */}
                {prescriptions.map((prescription, index) => (
                  <div
                    key={index}
                    className="p-4 border-b border-[#dbdfe6] hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-[#111418]">{prescription.name}</h4>
                      <button
                        onClick={() => handleRemovePrescription(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Dosage</span>
                        <span className="text-[#111418]">{prescription.dosage}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Freq</span>
                        <span className="text-[#111418]">{prescription.frequency}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Duration</span>
                        <span className="text-[#111418]">{prescription.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add New Form Area */}
                <div className="p-4 bg-gray-50/50">
                  <div className="grid grid-cols-1 gap-3">
                    <input
                      type="text"
                      value={newPrescription.name}
                      onChange={(e) => setNewPrescription({ ...newPrescription, name: e.target.value })}
                      className="w-full rounded-md border border-[#dbdfe6] px-3 py-2 text-sm bg-white text-[#111418] placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Medication Name"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newPrescription.dosage}
                        onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                        className="w-full rounded-md border border-[#dbdfe6] px-3 py-2 text-sm bg-white text-[#111418] placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="Dosage"
                      />
                      <input
                        type="text"
                        value={newPrescription.frequency}
                        onChange={(e) => setNewPrescription({ ...newPrescription, frequency: e.target.value })}
                        className="w-full rounded-md border border-[#dbdfe6] px-3 py-2 text-sm bg-white text-[#111418] placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="Freq"
                      />
                      <input
                        type="text"
                        value={newPrescription.duration}
                        onChange={(e) => setNewPrescription({ ...newPrescription, duration: e.target.value })}
                        className="w-full rounded-md border border-[#dbdfe6] px-3 py-2 text-sm bg-white text-[#111418] placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="Duration"
                      />
                    </div>
                    <button
                      onClick={handleAddPrescription}
                      className="w-full rounded-md border border-dashed border-primary/40 bg-primary/5 text-primary py-2 text-sm font-bold hover:bg-primary/10 transition-colors"
                    >
                      Confirm Medication
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Follow-up */}
            <section className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
              <div className="border-b border-[#dbdfe6] px-5 py-3 bg-gray-50/50">
                <h3 className="text-base font-bold text-[#111418] flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">event_upcoming</span>
                  Follow-up
                </h3>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full rounded-lg border border-[#dbdfe6] px-3 py-2 text-sm bg-white text-[#111418] focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">Time (Optional)</label>
                    <input
                      type="time"
                      value={followUpTime}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                      className="w-full rounded-lg border border-[#dbdfe6] px-3 py-2 text-sm bg-white text-[#111418] focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Reason / Notes</label>
                  <textarea
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    className="w-full rounded-lg border border-[#dbdfe6] px-3 py-2 text-sm bg-white text-[#111418] placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary resize-none h-20"
                    placeholder="e.g. Re-evaluate chest sounds"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewEncounter;
