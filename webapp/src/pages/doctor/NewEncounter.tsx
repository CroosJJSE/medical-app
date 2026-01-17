// src/pages/doctor/NewEncounter.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEncounterData } from '@/hooks/useEncounterData';
import DoctorHeader from '@/components/layout/DoctorHeader';
import Loading from '@/components/common/Loading';
import AutocompleteInput from '@/components/common/AutocompleteInput';
import patientService from '@/services/patientService';
import encounterService from '@/services/encounterService';
import appointmentService from '@/services/appointmentService';
import { generatePrescriptionPdf } from '@/services/prescriptionPdfService';
import { uploadPrescriptionPdf } from '@/services/storageService';
import { createEncounterNotification } from '@/services/notificationService';
import { getDoctor } from '@/services/doctorService';
import type { Patient } from '@/models/Patient';
import type { Appointment } from '@/models/Appointment';
import type { Encounter } from '@/models/Encounter';
import type { Disease } from '@/models/Disease';
import type { Medication } from '@/models/Medication';
import type { Doctor } from '@/models/Doctor';
import { EncounterType, AppointmentType, AppointmentStatus, NotificationType, DayOfWeek } from '@/enums';

interface Diagnosis {
  code: string;
  name: string;
}

interface Prescription {
  medicationId?: string;
  name: string;
  dosage: string;
  frequency: string;
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
  const [actualPatientId, setActualPatientId] = useState<string | null>(patientId);

  // Encounter data (diseases and medications) with caching
  const {
    diseases,
    medications,
    metadata,
    loading: dataLoading,
    error: dataError,
    searchDiseases: searchDiseasesFn,
    searchMedications: searchMedicationsFn,
    refresh: refreshEncounterData,
  } = useEncounterData(true);

  // Force refresh on mount if cache has old structure (without dosageOptions or wrong medication count)
  useEffect(() => {
    if (dataLoading || medications.length === 0 || !metadata) return;
    
    // Check if cache has old medication structure (without dosageOptions)
    const sampleMed = medications[0];
    const hasOldStructure = sampleMed?.prescriptionInfo && 
      !sampleMed.prescriptionInfo.dosageOptions;
    
    // Check if medication count doesn't match (old cache had 698, new has 409)
    const hasWrongCount = metadata.medicationCount !== medications.length;
    
    if ((hasOldStructure || hasWrongCount) && !dataLoading) {
      refreshEncounterData();
    }
  }, [medications, metadata, dataLoading, refreshEncounterData]);

  // Form state
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState('');
  const [physicalExamination, setPhysicalExamination] = useState('');
  const [planInstructions, setPlanInstructions] = useState('');

  // Diagnosis state
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<Diagnosis[]>([]);

  // Prescription state
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [newPrescription, setNewPrescription] = useState<Prescription>({
    name: '',
    dosage: '',
    frequency: '',
  });
  const [medicationSearch, setMedicationSearch] = useState('');
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [dosageDropdownOpen, setDosageDropdownOpen] = useState(false);

  // Frequency options (not stored in DB, can be customized in UI)
  const frequencyOptions = [
    'once daily',
    'twice daily',
    'thrice daily',
    'four times daily',
    'once weekly',
    'twice weekly',
    'as needed',
    'every 4 hours',
    'every 6 hours',
    'every 8 hours',
    'every 12 hours',
  ];

  // Encounter date and time state
  const [encounterDate, setEncounterDate] = useState('');
  const [encounterTime, setEncounterTime] = useState('');

  // Follow-up state
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<Doctor | null>(null);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.userID) {
        setLoading(false);
        return;
      }

      try {
        let resolvedPatientId = patientId;

        // If appointmentId is provided but patientId is not, load appointment first to get patientId
        if (appointmentId && !patientId) {
          try {
            const appointmentData = await appointmentService.getAppointment(appointmentId);
            setAppointment(appointmentData);
            resolvedPatientId = appointmentData.patientId;
            setActualPatientId(resolvedPatientId);
            
            // Set encounter date and time from appointment
            if (appointmentData.dateTime) {
              const appointmentDate = new Date(appointmentData.dateTime);
              const dateStr = appointmentDate.toISOString().split('T')[0]; // YYYY-MM-DD
              const timeStr = appointmentDate.toTimeString().split(' ')[0].substring(0, 5); // HH:mm
              setEncounterDate(dateStr);
              setEncounterTime(timeStr);
            }
          } catch (error) {
            console.error('Error loading appointment:', error);
            alert('Failed to load appointment. Please try again.');
            navigate('/doctor/appointments');
            return;
          }
        } else if (appointmentId && patientId) {
          // Both appointmentId and patientId are provided
          setActualPatientId(patientId);
          try {
            const appointmentData = await appointmentService.getAppointment(appointmentId);
            setAppointment(appointmentData);
            
            // Set encounter date and time from appointment
            if (appointmentData.dateTime) {
              const appointmentDate = new Date(appointmentData.dateTime);
              const dateStr = appointmentDate.toISOString().split('T')[0]; // YYYY-MM-DD
              const timeStr = appointmentDate.toTimeString().split(' ')[0].substring(0, 5); // HH:mm
              setEncounterDate(dateStr);
              setEncounterTime(timeStr);
            }
          } catch (error) {
            console.error('Error loading appointment:', error);
            // Continue without appointment data
          }
        } else {
          // No appointment - use system time and set patientId
          setActualPatientId(patientId);
          const now = new Date();
          setEncounterDate(now.toISOString().split('T')[0]);
          setEncounterTime(now.toTimeString().split(' ')[0].substring(0, 5));
        }

        // Load patient data if we have a patientId
        if (resolvedPatientId) {
          try {
            const patientData = await patientService.getPatient(resolvedPatientId);
            setPatient(patientData);
          } catch (error) {
            console.error('Error loading patient:', error);
            alert('Failed to load patient data. Please try again.');
            navigate('/doctor/patients');
            return;
          }
        } else {
          // No patientId available
          alert('Patient information is required. Please try again.');
          navigate('/doctor/patients');
          return;
        }

        // Encounter data (diseases and medications) is loaded via useEncounterData hook
      } catch (error) {
        console.error('Error loading data:', error);
        // On error, still set system time
        const now = new Date();
        setEncounterDate(now.toISOString().split('T')[0]);
        setEncounterTime(now.toTimeString().split(' ')[0].substring(0, 5));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, patientId, appointmentId, navigate]);

  // Load doctor info on mount
  useEffect(() => {
    const loadDoctorInfo = async () => {
      if (!user?.userID) return;
      try {
        const doctor = await getDoctor(user.userID);
        setDoctorInfo(doctor);
      } catch (error) {
        console.error('Error loading doctor info:', error);
      }
    };
    loadDoctorInfo();
  }, [user]);

  // Calculate available time slots when follow-up date changes
  useEffect(() => {
    const calculateAvailableTimeSlots = async () => {
      if (!followUpDate || !doctorInfo || !user?.userID) {
        setAvailableTimeSlots([]);
        setShowTimeSlots(false);
        return;
      }

      setLoadingTimeSlots(true);
      try {
        const selectedDate = new Date(followUpDate);
        const dayOfWeek = selectedDate.getDay();
        const dayNames: DayOfWeek[] = [
          DayOfWeek.SUNDAY,
          DayOfWeek.MONDAY,
          DayOfWeek.TUESDAY,
          DayOfWeek.WEDNESDAY,
          DayOfWeek.THURSDAY,
          DayOfWeek.FRIDAY,
          DayOfWeek.SATURDAY,
        ];
        const currentDay = dayNames[dayOfWeek];

        // Check if it's a working day
        if (!doctorInfo.availability?.workingDays?.includes(currentDay)) {
          setAvailableTimeSlots([]);
          setLoadingTimeSlots(false);
          return;
        }

        // Check if day is blocked
        const dateStr = followUpDate; // YYYY-MM-DD format
        if (doctorInfo.blockedDays?.includes(dateStr)) {
          setAvailableTimeSlots([]);
          setLoadingTimeSlots(false);
          return;
        }

        // Get working hours
        const workingHours = doctorInfo.availability?.workingHours;
        if (!workingHours) {
          setAvailableTimeSlots([]);
          setLoadingTimeSlots(false);
          return;
        }

        const [startHour, startMin] = workingHours.start.split(':').map(Number);
        const [endHour, endMin] = workingHours.end.split(':').map(Number);

        // Generate all possible time slots (15-minute intervals)
        const allSlots: string[] = [];
        let currentHour = startHour;
        let currentMin = startMin;

        while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
          const time = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
          allSlots.push(time);
          currentMin += 15;
          if (currentMin >= 60) {
            currentMin = 0;
            currentHour++;
          }
        }

        // Get existing appointments for this date
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAppointments = await appointmentService.getAppointmentsByDoctor(user.userID);
        // Filter appointments for the selected date
        const appointmentsForDate = existingAppointments.filter(apt => {
          const aptDate = new Date(apt.dateTime);
          return aptDate >= startOfDay && aptDate <= endOfDay;
        });

        // Get busy slots
        const busySlots = doctorInfo.busySlots || [];
        const busySlotsForDate = busySlots
          .filter(slot => slot.date === dateStr)
          .map(slot => slot.time);

        // Get occupied time slots from existing appointments
        const occupiedSlots = new Set<string>();
        appointmentsForDate.forEach(apt => {
          if (apt.status !== AppointmentStatus.CANCELLED) {
            const aptDate = new Date(apt.dateTime);
            const aptTime = `${aptDate.getHours().toString().padStart(2, '0')}:${aptDate.getMinutes().toString().padStart(2, '0')}`;
            occupiedSlots.add(aptTime);
            
            // Also mark slots occupied by appointment duration (default 30 minutes)
            const duration = apt.duration || 30;
            const [aptHour, aptMin] = aptTime.split(':').map(Number);
            let slotHour = aptHour;
            let slotMin = aptMin;
            for (let i = 0; i < duration; i += 15) {
              const slotTime = `${slotHour.toString().padStart(2, '0')}:${slotMin.toString().padStart(2, '0')}`;
              occupiedSlots.add(slotTime);
              slotMin += 15;
              if (slotMin >= 60) {
                slotMin = 0;
                slotHour++;
              }
            }
          }
        });

        // Filter out occupied and busy slots
        const availableSlots = allSlots.filter(slot => {
          return !occupiedSlots.has(slot) && !busySlotsForDate.includes(slot);
        });

        setAvailableTimeSlots(availableSlots);
      } catch (error) {
        console.error('Error calculating available time slots:', error);
        setAvailableTimeSlots([]);
      } finally {
        setLoadingTimeSlots(false);
      }
    };

    calculateAvailableTimeSlots();
  }, [followUpDate, doctorInfo, user]);

  // Search results for diagnosis
  const diagnosisSearchResults = useMemo(() => {
    if (!diagnosisSearch.trim()) return [];
    return searchDiseasesFn(diagnosisSearch, 10);
  }, [diagnosisSearch, searchDiseasesFn]);

  // Search results for medications
  const medicationSearchResults = useMemo(() => {
    if (!medicationSearch.trim()) return [];
    return searchMedicationsFn(medicationSearch, 10);
  }, [medicationSearch, searchMedicationsFn]);

  // Handle diagnosis selection
  const handleSelectDiagnosis = (disease: Disease) => {
    const newDiagnosis: Diagnosis = {
      code: disease.icd10Code || '',
      name: disease.name,
    };
    // Check if already selected
    if (!selectedDiagnoses.some(d => d.name === newDiagnosis.name)) {
      setSelectedDiagnoses([...selectedDiagnoses, newDiagnosis]);
    }
    setDiagnosisSearch('');
  };

  // Handle medication selection
  const handleSelectMedication = (medication: Medication) => {
    setSelectedMedication(medication);
    const firstDosage = medication.prescriptionInfo?.dosageOptions?.[0] || '';
    setNewPrescription({
      ...newPrescription,
      name: medication.name,
      medicationId: medication.medicationId,
      dosage: firstDosage,
      frequency: frequencyOptions[0],
    });
    setMedicationSearch('');
  };

  // Get dosage options from selected medication or find by name
  const dosageOptions = useMemo(() => {
    // If medication is selected, use its dosage options
    if (selectedMedication?.prescriptionInfo?.dosageOptions) {
      return selectedMedication.prescriptionInfo.dosageOptions.filter(d => d && d.trim());
    }
    
    // If medication name is typed, try to find matching medication
    if (newPrescription.name && medications.length > 0) {
      const foundMed = medications.find(m => 
        m.name.toLowerCase() === newPrescription.name.toLowerCase()
      );
      if (foundMed?.prescriptionInfo?.dosageOptions) {
        return foundMed.prescriptionInfo.dosageOptions.filter(d => d && d.trim());
      }
    }
    
    return [];
  }, [selectedMedication, newPrescription.name, medications]);

  const handleRemoveDiagnosis = (index: number) => {
    setSelectedDiagnoses(selectedDiagnoses.filter((_, i) => i !== index));
  };

  const handleAddPrescription = () => {
    if (newPrescription.name && newPrescription.dosage && newPrescription.frequency) {
      setPrescriptions([...prescriptions, { ...newPrescription }]);
      setNewPrescription({ name: '', dosage: '', frequency: '' });
      setSelectedMedication(null);
    }
  };

  const handleRemovePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!user?.userID || !actualPatientId || !chiefComplaint.trim()) {
      alert('Please fill in at least the Chief Complaint field');
      return;
    }

    setSaving(true);
    try {
      // Use selected encounter date and time, or fallback to current time
      const encounterDateTime = encounterDate && encounterTime 
        ? new Date(`${encounterDate}T${encounterTime}`)
        : new Date();

      const encounterData: Omit<Encounter, 'encounterId' | 'createdAt' | 'updatedAt' | 'isDraft'> = {
        patientId: actualPatientId,
        doctorId: user.userID,
        ...(appointmentId && { appointmentId }),
        encounterDate: encounterDateTime,
        encounterType: EncounterType.FOLLOW_UP,
        subjective: {
          chiefComplaint,
          ...(historyOfPresentIllness && { historyOfPresentingComplaint: historyOfPresentIllness }),
        },
        objective: {
          ...(physicalExamination && { physicalExamination }),
        },
        assessment: {
          icd10Codes: selectedDiagnoses.map(d => d.code || d.name),
          differentialDiagnosis: selectedDiagnoses.map(d => d.name),
        },
        plan: {
          ...(planInstructions && { treatmentPlan: planInstructions }),
          medications: prescriptions.map(p => `${p.name}${p.dosage ? ` ${p.dosage}` : ''}${p.frequency ? ` ${p.frequency}` : ''}`),
          // Follow-up is optional for drafts
          ...(followUpDate && followUpTime && {
            followUp: {
              date: new Date(`${followUpDate}T${followUpTime}`),
              time: followUpTime,
              ...(followUpNotes && { notes: followUpNotes }),
            },
          }),
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
    if (!user?.userID || !actualPatientId || !chiefComplaint.trim()) {
      alert('Please fill in at least the Chief Complaint field');
      return;
    }

    // Validate follow-up date and time are required
    if (!followUpDate || !followUpTime) {
      alert('Follow-up date and time are required');
      return;
    }

    setSaving(true);
    try {
      // Use selected encounter date and time, or fallback to current time
      const encounterDateTime = encounterDate && encounterTime 
        ? new Date(`${encounterDate}T${encounterTime}`)
        : new Date();

      // Create follow-up appointment if date and time are provided
      let followUpAppointmentId: string | undefined;
      if (followUpDate && followUpTime) {
        try {
          // Combine date and time into a Date object
          const followUpDateTime = new Date(`${followUpDate}T${followUpTime}`);
          
          // Validate the date is in the future
          if (followUpDateTime <= encounterDateTime) {
            alert('Follow-up date and time must be after the encounter date and time');
            setSaving(false);
            return;
          }

          // Create appointment for follow-up
          const followUpAppointment = await appointmentService.createAppointment({
            patientId: actualPatientId,
            doctorId: user.userID,
            userId: user.userID, // Doctor is creating the appointment
            dateTime: followUpDateTime,
            type: AppointmentType.FOLLOW_UP,
            reason: followUpNotes || 'Follow-up appointment',
            status: AppointmentStatus.CONFIRMED, // Doctor-created appointments are auto-confirmed
            duration: 30, // Default 30 minutes
            createdBy: user.userID, // Doctor created this appointment
          });
          
          followUpAppointmentId = followUpAppointment.appointmentId;
        } catch (appointmentError: any) {
          console.error('Error creating follow-up appointment:', appointmentError);
          alert('Failed to create follow-up appointment: ' + (appointmentError.message || 'Unknown error'));
          setSaving(false);
          return;
        }
      }

      const encounterData: Omit<Encounter, 'encounterId' | 'createdAt' | 'updatedAt' | 'isDraft' | 'prescriptionPdfUrl'> = {
        patientId: actualPatientId,
        doctorId: user.userID,
        ...(appointmentId && { appointmentId }),
        encounterDate: encounterDateTime,
        encounterType: EncounterType.FOLLOW_UP,
        subjective: {
          chiefComplaint,
          ...(historyOfPresentIllness && { historyOfPresentingComplaint: historyOfPresentIllness }),
        },
        objective: {
          ...(physicalExamination && { physicalExamination }),
        },
        assessment: {
          icd10Codes: selectedDiagnoses.map(d => d.code || d.name),
          differentialDiagnosis: selectedDiagnoses.map(d => d.name),
        },
        plan: {
          ...(planInstructions && { treatmentPlan: planInstructions }),
          medications: prescriptions.map(p => `${p.name}${p.dosage ? ` ${p.dosage}` : ''}${p.frequency ? ` ${p.frequency}` : ''}`),
          ...(followUpDate && followUpTime && {
            followUp: {
              date: new Date(`${followUpDate}T${followUpTime}`),
              time: followUpTime,
              ...(followUpNotes && { notes: followUpNotes }),
              ...(followUpAppointmentId && { appointmentId: followUpAppointmentId }),
            },
          }),
        },
        createdBy: user.userID,
      };

      // Create encounter first
      const createdEncounter = await encounterService.createEncounter(encounterData);
      
      // Generate and upload prescription PDF
      let pdfUrl: string | undefined;
      try {
        if (!patient || !user?.userID) {
          throw new Error('Patient or doctor information missing');
        }
        
        const doctor = await getDoctor(user.userID);
        if (!doctor) {
          throw new Error('Doctor not found');
        }
        
        // Generate PDF
        const pdfBlob = await generatePrescriptionPdf(createdEncounter, patient, doctor);
        
        // Upload to Firebase Storage
        pdfUrl = await uploadPrescriptionPdf(pdfBlob, createdEncounter.encounterId);
        
        // Update encounter with PDF URL
        await encounterService.updateEncounter(createdEncounter.encounterId, {
          prescriptionPdfUrl: pdfUrl,
        });
        
        // Update local encounter object
        createdEncounter.prescriptionPdfUrl = pdfUrl;
      } catch (pdfError: any) {
        console.error('Error generating/uploading PDF:', pdfError);
        // Don't fail the encounter creation if PDF fails
        alert('Encounter finalized, but PDF generation failed: ' + (pdfError.message || 'Unknown error'));
      }
      
      // Send notification to patient with PDF download link
      try {
        const doctor = await getDoctor(user.userID);
        const doctorName = doctor?.professionalInfo
          ? `${doctor.professionalInfo.title || 'Dr.'} ${doctor.professionalInfo.firstName} ${doctor.professionalInfo.lastName}`
          : doctor?.displayName || 'Your doctor';
        
        const patientName = patient?.personalInfo
          ? `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`
          : patient?.displayName || 'Patient';
        
        await createEncounterNotification(
          actualPatientId, // Patient's userID
          NotificationType.ENCOUNTER_CREATED,
          createdEncounter.encounterId,
          {
            doctorName,
            patientName,
            encounterDate: new Date(createdEncounter.encounterDate),
            prescriptionPdfUrl: pdfUrl, // Include PDF URL in metadata
          }
        );
      } catch (notificationError: any) {
        console.error('Error sending notification:', notificationError);
        // Don't fail if notification fails
      }
      
      alert('Encounter finalized successfully' + 
        (followUpAppointmentId ? ' and follow-up appointment scheduled' : '') +
        (pdfUrl ? ' and prescription PDF generated' : ''));
      
      // Navigate back
      if (actualPatientId) {
        navigate(`/doctor/patient-profile/${actualPatientId}`);
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
                <span className="text-sm font-normal text-gray-500">(ID: {patient.userID})</span>
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
              onClick={() => actualPatientId && navigate(`/doctor/patient-profile/${actualPatientId}`)}
              className="flex flex-1 md:flex-none items-center justify-center gap-2 rounded-lg px-4 py-2 bg-[#f0f2f5] text-[#111418] text-sm font-bold hover:bg-gray-200 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              View History
            </button>
            <button
              onClick={() => actualPatientId && navigate(`/doctor/patient-profile/${actualPatientId}`)}
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
                {/* Encounter Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[#111418] text-sm font-bold leading-normal">
                      Encounter Date <span className="text-red-500 font-normal">*Required</span>
                    </label>
                    <input
                      type="date"
                      value={encounterDate}
                      onChange={(e) => setEncounterDate(e.target.value)}
                      className="flex w-full rounded-lg text-[#111418] border border-[#dbdfe6] bg-white focus:border-primary focus:ring-1 focus:ring-primary p-3 text-base transition-shadow"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[#111418] text-sm font-bold leading-normal">
                      Encounter Time <span className="text-red-500 font-normal">*Required</span>
                    </label>
                    <input
                      type="time"
                      value={encounterTime}
                      onChange={(e) => setEncounterTime(e.target.value)}
                      className="flex w-full rounded-lg text-[#111418] border border-[#dbdfe6] bg-white focus:border-primary focus:ring-1 focus:ring-primary p-3 text-base transition-shadow"
                      required
                    />
                  </div>
                </div>

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
                {dataLoading ? (
                  <div className="text-sm text-gray-500 text-center py-2">
                    Loading diseases...
                  </div>
                ) : dataError ? (
                  <div className="text-sm text-red-500 text-center py-2">
                    Error loading diseases. Using cached data if available.
                  </div>
                ) : (
                  <AutocompleteInput<Disease>
                    value={diagnosisSearch}
                    onChange={setDiagnosisSearch}
                    onSelect={handleSelectDiagnosis}
                    searchResults={diagnosisSearchResults}
                    getItemLabel={(disease) => disease.name}
                    getItemKey={(disease, index) => disease.diseaseId || `disease-${index}`}
                    placeholder="Search ICD-10 or diagnosis name..."
                    icon="search"
                    maxResults={10}
                    emptyMessage="No diseases found"
                    renderItem={(disease) => (
                      <div className="flex flex-col">
                        <span className="font-medium">{disease.name}</span>
                        {disease.icd10Code && (
                          <span className="text-xs text-gray-500">ICD-10: {disease.icd10Code}</span>
                        )}
                        {disease.symptoms && disease.symptoms.length > 0 && (
                          <span className="text-xs text-gray-400 mt-1">
                            Symptoms: {disease.symptoms.slice(0, 3).join(', ')}
                            {disease.symptoms.length > 3 && '...'}
                          </span>
                        )}
                      </div>
                    )}
                  />
                )}
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
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Dosage</span>
                        <span className="text-[#111418]">{prescription.dosage}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Frequency</span>
                        <span className="text-[#111418]">{prescription.frequency}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add New Form Area */}
                <div className="p-4 bg-gray-50/50">
                  <div className="grid grid-cols-1 gap-3">
                    {dataLoading ? (
                      <div className="text-sm text-gray-500 text-center py-2">
                        Loading medications...
                      </div>
                    ) : dataError ? (
                      <div className="text-sm text-red-500 text-center py-2">
                        Error loading medications. Using cached data if available.
                      </div>
                    ) : (
                      <AutocompleteInput<Medication>
                        value={medicationSearch}
                        onChange={setMedicationSearch}
                        onSelect={handleSelectMedication}
                        searchResults={medicationSearchResults}
                        getItemLabel={(med) => med.name}
                        getItemKey={(med, index) => med.medicationId || `med-${index}`}
                        placeholder="Search medication name..."
                        icon="search"
                        maxResults={10}
                        emptyMessage="No medications found"
                        renderItem={(med) => (
                          <div className="flex flex-col">
                            <span className="font-medium">{med.name}</span>
                            {med.genericName && med.genericName !== med.name && (
                              <span className="text-xs text-gray-500">Generic: {med.genericName}</span>
                            )}
                            {med.strength && (
                              <span className="text-xs text-gray-400 mt-1">
                                {med.form} • {med.strength}
                              </span>
                            )}
                          </div>
                        )}
                      />
                    )}
                    <input
                      type="text"
                      value={newPrescription.name}
                      onChange={(e) => {
                        setNewPrescription({ ...newPrescription, name: e.target.value, medicationId: undefined });
                        setSelectedMedication(null); // Clear selection if manually typing
                      }}
                      className="w-full rounded-md border border-[#dbdfe6] px-3 py-2 text-sm bg-white text-[#111418] placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Medication Name (auto-filled when selected above, or type manually)"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      {/* Dosage with dropdown and typing */}
                      <div className="flex flex-col gap-1 relative">
                        <label className="text-xs text-gray-500 uppercase font-semibold">Dosage</label>
                        <div className="relative">
                          <input
                            type="text"
                            list="dosage-options"
                            value={newPrescription.dosage}
                            onChange={(e) => {
                              setNewPrescription({ ...newPrescription, dosage: e.target.value });
                              setDosageDropdownOpen(true);
                            }}
                            onFocus={() => setDosageDropdownOpen(true)}
                            onBlur={() => {
                              // Delay closing to allow click on dropdown item
                              setTimeout(() => setDosageDropdownOpen(false), 200);
                            }}
                            className="w-full rounded-md border border-[#dbdfe6] px-3 py-2 pr-8 text-sm bg-white text-[#111418] placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder={dosageOptions.length > 0 ? "Select from dropdown or type..." : "Dosage"}
                            autoComplete="off"
                          />
                          {dosageOptions.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setDosageDropdownOpen(!dosageDropdownOpen)}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                              <svg
                                className={`w-4 h-4 transition-transform ${dosageDropdownOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                          {/* Custom dropdown list */}
                          {dosageDropdownOpen && dosageOptions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-[#dbdfe6] rounded-md shadow-lg max-h-48 overflow-auto">
                              {dosageOptions.map((dosage, idx) => {
                                // Clean up any extra quotes in dosage options
                                const cleanDosage = dosage.trim().replace(/^["']|["']$/g, '');
                                const isSelected = newPrescription.dosage === cleanDosage;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setNewPrescription({ ...newPrescription, dosage: cleanDosage });
                                      setDosageDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-primary/10 transition-colors ${
                                      isSelected ? 'bg-primary/20 font-medium' : 'text-[#111418]'
                                    }`}
                                  >
                                    {cleanDosage}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <datalist id="dosage-options">
                          {dosageOptions.map((dosage, idx) => {
                            // Clean up any extra quotes in dosage options
                            const cleanDosage = dosage.trim().replace(/^["']|["']$/g, '');
                            return <option key={idx} value={cleanDosage} />;
                          })}
                        </datalist>
                        {dosageOptions.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            <span>{dosageOptions.length} option{dosageOptions.length !== 1 ? 's' : ''} available</span>
                            <span className="ml-2 text-gray-400">• Click dropdown arrow or type</span>
                          </div>
                        )}
                      </div>
                      {/* Frequency dropdown */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 uppercase font-semibold">Frequency</label>
                        <select
                          value={newPrescription.frequency}
                          onChange={(e) => setNewPrescription({ ...newPrescription, frequency: e.target.value })}
                          className="w-full rounded-md border border-[#dbdfe6] px-3 py-2 text-sm bg-white text-[#111418] focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                          {frequencyOptions.map((freq, idx) => (
                            <option key={idx} value={freq}>
                              {freq}
                            </option>
                          ))}
                        </select>
                      </div>
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
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full rounded-lg border border-[#dbdfe6] px-3 py-2 text-sm bg-white text-[#111418] focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Time <span className="text-red-500">*</span>
                      </label>
                      {followUpDate && (
                        <button
                          type="button"
                          onClick={() => setShowTimeSlots(!showTimeSlots)}
                          disabled={loadingTimeSlots || availableTimeSlots.length === 0}
                          className="text-xs text-primary hover:text-blue-600 font-medium disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {loadingTimeSlots ? (
                            <>
                              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                              Loading...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">schedule</span>
                              {showTimeSlots ? 'Hide' : 'Show'} Available Times ({availableTimeSlots.length})
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <input
                      type="time"
                      required
                      value={followUpTime}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                      className="w-full rounded-lg border border-[#dbdfe6] px-3 py-2 text-sm bg-white text-[#111418] focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    {showTimeSlots && followUpDate && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                        {availableTimeSlots.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2">
                            {availableTimeSlots.map((time) => (
                              <button
                                key={time}
                                type="button"
                                onClick={() => {
                                  setFollowUpTime(time);
                                  setShowTimeSlots(false);
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                  followUpTime === time
                                    ? 'bg-primary text-white'
                                    : 'bg-white text-gray-700 hover:bg-primary/10 border border-gray-300'
                                }`}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 text-center py-2">
                            No available time slots for this date
                          </p>
                        )}
                      </div>
                    )}
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
