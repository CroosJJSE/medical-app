// src/pages/patient/ScheduleAppointment.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import Calendar from '@/components/common/Calendar';
import patientService from '@/services/patientService';
import doctorService from '@/services/doctorService';
import appointmentService from '@/services/appointmentService';
import auditService from '@/services/auditService';
import { AppointmentStatus, AppointmentType } from '@/enums';
import { AuditAction, AuditCategory } from '@/models/AuditLog';
import type { Patient } from '@/models/Patient';
import type { Doctor } from '@/models/Doctor';

const ScheduleAppointment: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<Date[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<Date | null>(null);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      console.log('[SCHEDULE_APPOINTMENT] Loading data', { userId: user?.userID });
      
      if (!user?.userID) {
        setLoading(false);
        return;
      }

      try {
        // Get patient data
        const patientData = await patientService.getPatient(user.userID);
        console.log('[SCHEDULE_APPOINTMENT] Patient data loaded', { patientId: patientData?.userID });
        
        if (!patientData) {
          setError('Patient profile not found');
          setLoading(false);
          return;
        }
        setPatient(patientData);

        // Get assigned doctor
        if (patientData.assignedDoctorId) {
          const doctorData = await doctorService.getDoctor(patientData.assignedDoctorId);
          console.log('[SCHEDULE_APPOINTMENT] Doctor data loaded', { doctorId: doctorData?.userID });
          
          if (doctorData) {
            setDoctor(doctorData);
          } else {
            setError('Assigned doctor not found. Please contact admin to assign a doctor.');
          }
        } else {
          setError('No doctor assigned. Please contact admin to assign a doctor.');
        }
      } catch (err: any) {
        console.error('[SCHEDULE_APPOINTMENT] Error loading data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Load available time slots when date is selected
  useEffect(() => {
    const loadTimeSlots = async () => {
      if (!selectedDate || !doctor?.userID) {
        setAvailableTimeSlots([]);
        setSelectedTimeSlot(null);
        return;
      }

      console.log('[SCHEDULE_APPOINTMENT] Loading time slots', { 
        date: selectedDate.toISOString(), 
        doctorId: doctor.userID 
      });

      setLoadingTimeSlots(true);
      setSelectedTimeSlot(null);
      setError(null);

      try {
        const slots = await appointmentService.getAvailableTimeSlots(doctor.userID, selectedDate);
        console.log('[SCHEDULE_APPOINTMENT] Available time slots loaded', { count: slots.length });
        setAvailableTimeSlots(slots);
      } catch (err: any) {
        console.error('[SCHEDULE_APPOINTMENT] Error loading time slots:', err);
        setError(err.message || 'Failed to load available time slots');
        setAvailableTimeSlots([]);
      } finally {
        setLoadingTimeSlots(false);
      }
    };

    loadTimeSlots();
  }, [selectedDate, doctor]);

  const handleDateSelect = (date: Date) => {
    console.log('[SCHEDULE_APPOINTMENT] Date selected', { date: date.toISOString() });
    setError(null);
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleTimeSelect = (timeSlot: Date) => {
    console.log('[SCHEDULE_APPOINTMENT] Time slot selected', { timeSlot: timeSlot.toISOString() });
    setSelectedTimeSlot(timeSlot);
  };

  const handleRequestAppointment = async () => {
    console.log('[SCHEDULE_APPOINTMENT] Request appointment called', {
      selectedDate: selectedDate?.toISOString(),
      selectedTimeSlot: selectedTimeSlot?.toISOString(),
    });

    if (!patient) {
      setError('Patient data not loaded. Please refresh the page.');
      return;
    }

    if (!doctor) {
      setError('Doctor data not loaded. Please refresh the page.');
      return;
    }

    if (!selectedDate) {
      setError('Please select a date');
      return;
    }

    if (!selectedTimeSlot) {
      setError('Please select a time slot');
      return;
    }

    if (!user?.userID) {
      setError('User not authenticated');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Check availability for selected date and time
      const isAvailable = await appointmentService.checkAvailability(
        doctor.userID,
        selectedTimeSlot,
        30 // Default duration
      );

      console.log('[SCHEDULE_APPOINTMENT] Availability check result', { isAvailable });

      if (!isAvailable) {
        setError('This time slot is no longer available. Please select another time.');
        setSubmitting(false);
        return;
      }

      // Create appointment request with PENDING status
      const appointment = await appointmentService.createAppointment({
        patientId: patient.userID,
        doctorId: doctor.userID,
        userId: user.userID,
        dateTime: selectedTimeSlot,
        duration: 30,
        type: AppointmentType.CONSULTATION,
        reason: 'Appointment request',
        createdBy: user.userID,
      });

      console.log('[SCHEDULE_APPOINTMENT] Appointment created', { 
        appointmentId: appointment.appointmentId,
        status: appointment.status,
      });

      // Log audit trail
      try {
        await auditService.logAction(
          AuditAction.APPOINTMENT_CREATED,
          AuditCategory.APPOINTMENTS,
          'appointment',
          user,
          {
            targetId: appointment.appointmentId,
            targetDisplayName: `Appointment with ${doctor.displayName}`,
            description: `Requested appointment with ${doctor.displayName} on ${formatDateTime(selectedTimeSlot)}`,
            metadata: {
              doctorId: appointment.doctorId,
              doctorName: doctor.displayName,
              dateTime: appointment.dateTime.toISOString(),
              type: appointment.type,
              reason: appointment.reason,
              status: appointment.status,
              duration: appointment.duration,
            }
          }
        );
        console.log('[SCHEDULE_APPOINTMENT] Audit log created');
      } catch (auditErr) {
        console.error('[SCHEDULE_APPOINTMENT] Error logging audit trail:', auditErr);
        // Don't block navigation if audit logging fails
      }

      // Success - navigate to appointments page
      console.log('[SCHEDULE_APPOINTMENT] Navigating to appointments page');
      navigate('/patient/appointments');
    } catch (err: any) {
      console.error('[SCHEDULE_APPOINTMENT] Error creating appointment:', err);
      setError(err.message || 'Failed to request appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f8]">
        <Loading size={48} message="Loading..." />
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="min-h-screen bg-[#f5f7f8] p-4">
        <div className="max-w-md mx-auto pt-20">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => navigate('/patient/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f8] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#f5f7f8]/95 backdrop-blur-md border-b border-gray-200 transition-colors">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/patient/appointments')}
            className="flex items-center justify-center p-2 -ml-2 text-gray-900 hover:bg-black/5 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
          </button>
          <h1 className="text-lg font-bold leading-tight tracking-tight absolute left-1/2 -translate-x-1/2">
            Schedule Appointment
          </h1>
          <div className="w-10"></div> {/* Spacer to balance back button */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full max-w-md mx-auto pb-24 overflow-y-auto">
        {/* Section: Doctor Info */}
        <div className="pt-6 px-4">
          {/* Selected Doctor Card */}
          {doctor && (
            <div className="relative overflow-hidden rounded-2xl bg-white border-2 border-primary/20 shadow-sm transition-all">
              <div className="absolute top-0 right-0 bg-primary/10 text-primary px-3 py-1 rounded-bl-xl text-xs font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] fill-1">verified</span>
                Your Doctor
              </div>
              <div className="p-4 flex gap-4 items-center">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 ring-2 ring-primary/20">
                    {doctor.photoURL ? (
                      <img
                        className="w-full h-full object-cover"
                        src={doctor.photoURL}
                        alt={`Portrait of ${doctor.displayName}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-xl font-bold">
                        {doctor.displayName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {doctor.displayName}
                  </h3>
                  <p className="text-sm text-primary font-medium mb-0.5">
                    {doctor.professionalInfo?.specialization || 'General Practitioner'}
                  </p>
                  {doctor.practiceInfo?.clinicAddress && (
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {doctor.practiceInfo.clinicAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-6"></div>

        {/* Section: Date Selection */}
        <div className="px-4">
          <h2 className="text-[#111418] text-lg font-bold leading-tight mb-3">
            Select a Date
          </h2>

          {/* Calendar Widget */}
          <Calendar
            selectedDates={selectedDate ? [selectedDate] : []}
            onDateSelect={handleDateSelect}
            minDate={new Date()}
            maxSelections={1}
          />
        </div>

        {/* Section: Time Selection */}
        {selectedDate && (
          <div className="px-4 mt-6">
            <h2 className="text-[#111418] text-lg font-bold leading-tight mb-3">
              Select a Time
            </h2>

            {loadingTimeSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loading size={32} message="Loading available times..." />
              </div>
            ) : availableTimeSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {availableTimeSlots.map((slot, index) => {
                  const isSelected = selectedTimeSlot?.getTime() === slot.getTime();
                  return (
                    <button
                      key={index}
                      onClick={() => handleTimeSelect(slot)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-primary/50'
                      }`}
                    >
                      {formatTime(slot)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  No available time slots for this date. Please select another date.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="px-4 mt-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer Action */}
      <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 pb-8 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleRequestAppointment}
            disabled={!selectedDate || !selectedTimeSlot || submitting}
            className="w-full bg-primary hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>{submitting ? 'Requesting...' : 'Request Appointment'}</span>
            {!submitting && (
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ScheduleAppointment;
