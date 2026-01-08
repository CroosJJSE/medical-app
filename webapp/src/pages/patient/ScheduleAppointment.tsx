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
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.userID) {
        setLoading(false);
        return;
      }

      try {
        // Get patient data
        const patientData = await patientService.getPatient(user.userID);
        
        if (!patientData) {
          setError('Patient profile not found');
          setLoading(false);
          return;
        }
        setPatient(patientData);

        // Get assigned doctor
        if (patientData.assignedDoctorId) {
          const doctorData = await doctorService.getDoctor(patientData.assignedDoctorId);
          
          if (doctorData) {
            setDoctor(doctorData);
          } else {
            setError('Assigned doctor not found. Please contact admin to assign a doctor.');
          }
        } else {
          setError('No doctor assigned. Please contact admin to assign a doctor.');
        }
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleDateSelect = (date: Date) => {
    setError(null);
    
    // Normalize date to start of day for consistent comparison
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    
    const dateStr = normalizedDate.toDateString();
    const isSelected = selectedDates.some(d => {
      const normalizedD = new Date(d);
      normalizedD.setHours(0, 0, 0, 0);
      return normalizedD.toDateString() === dateStr;
    });
    
    if (isSelected) {
      // Deselect the date
      setSelectedDates(selectedDates.filter(d => {
        const normalizedD = new Date(d);
        normalizedD.setHours(0, 0, 0, 0);
        return normalizedD.toDateString() !== dateStr;
      }));
    } else {
      // Select the date (max 3)
      if (selectedDates.length < 3) {
        setSelectedDates([...selectedDates, normalizedDate].sort((a, b) => a.getTime() - b.getTime()));
      } else {
        setError('You can select a maximum of 3 dates');
      }
    }
  };

  const handleRequestAppointment = async () => {
    if (!patient) {
      setError('Patient data not loaded. Please refresh the page.');
      return;
    }

    if (!doctor) {
      setError('Doctor data not loaded. Please refresh the page.');
      return;
    }

    if (selectedDates.length === 0) {
      setError('Please select at least one date');
      return;
    }

    if (!user?.userID) {
      setError('User not authenticated');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Check availability for all selected dates
      for (const date of selectedDates) {
        const isAvailable = await appointmentService.checkAvailability(
          doctor.userID,
          date,
          30 // Default duration
        );

        if (!isAvailable) {
          setError(`Doctor is not available on ${formatSelectedDate(date)}. Please choose another date.`);
          setSubmitting(false);
          return;
        }
      }

      // Create appointment requests for all selected dates
      const appointmentPromises = selectedDates.map(date =>
        appointmentService.createAppointment({
          patientId: patient.userID,
          doctorId: doctor.userID,
          userId: user.userID,
          dateTime: date,
          duration: 30,
          type: AppointmentType.CONSULTATION,
          status: AppointmentStatus.SCHEDULED,
          reason: 'Appointment request',
          createdBy: user.userID, // Audit trail: who created the appointment
        })
      );

      const createdAppointments = await Promise.all(appointmentPromises);

      // Log audit trail for each appointment created
      const auditPromises = createdAppointments.map(appointment =>
        auditService.logAction(
          AuditAction.APPOINTMENT_CREATED,
          AuditCategory.APPOINTMENTS,
          'appointment',
          user,
          {
            targetId: appointment.appointmentId,
            targetDisplayName: `Appointment with ${doctor.displayName}`,
            description: `Scheduled appointment with ${doctor.displayName} on ${formatSelectedDate(appointment.dateTime)}`,
            metadata: {
              doctorId: appointment.doctorId,
              doctorName: doctor.displayName,
              dateTime: appointment.dateTime.toISOString(),
              type: appointment.type,
              reason: appointment.reason,
              status: appointment.status,
              duration: appointment.duration,
              selectedDatesCount: selectedDates.length,
            }
          }
        )
      );

      // Log audit trail (don't wait for it to complete)
      Promise.all(auditPromises).catch(err => {
        console.error('Error logging audit trail:', err);
        // Don't block navigation if audit logging fails
      });

      // Success - navigate to appointments page
      navigate('/patient/appointments');
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      setError(err.message || 'Failed to request appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

  const formatSelectedDate = (date: Date): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    // Get day suffix
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';
    
    return `${month} ${day}${suffix}, ${year}`;
  };

  const formatSelectedDates = (dates: Date[]): string => {
    if (dates.length === 0) return '';
    if (dates.length === 1) return formatSelectedDate(dates[0]);
    if (dates.length === 2) {
      return `${formatSelectedDate(dates[0])} and ${formatSelectedDate(dates[1])}`;
    }
    return `${formatSelectedDate(dates[0])}, ${formatSelectedDate(dates[1])}, and ${formatSelectedDate(dates[2])}`;
  };

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
            selectedDates={selectedDates}
            onDateSelect={handleDateSelect}
            minDate={new Date()}
            maxSelections={3}
          />

          {/* Legend / Status */}
          {selectedDates.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">info</span>
              <p className="text-xs text-gray-500 leading-relaxed">
                You have selected <span className="font-bold text-gray-800">
                  {formatSelectedDates(selectedDates)}
                </span>. Time slots will be confirmed by the clinic via email within 2 hours.
                {selectedDates.length < 3 && (
                  <span className="block mt-1">You can select up to {3 - selectedDates.length} more date{3 - selectedDates.length > 1 ? 's' : ''}.</span>
                )}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Action */}
      <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 pb-8 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleRequestAppointment}
            disabled={selectedDates.length === 0 || submitting}
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
