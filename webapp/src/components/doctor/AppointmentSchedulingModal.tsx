// src/components/doctor/AppointmentSchedulingModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import appointmentService from '@/services/appointmentService';
import patientService from '@/services/patientService';
import doctorService from '@/services/doctorService';
import auditService from '@/services/auditService';
import { useAuth } from '@/hooks/useAuth';
import type { Appointment } from '@/models/Appointment';
import type { Patient } from '@/models/Patient';
import { AppointmentStatus, AppointmentType } from '@/enums';
import { AuditAction, AuditCategory } from '@/models/AuditLog';

interface AppointmentSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedTime: string;
  doctorId: string;
  weekAppointments: Appointment[];
}

const AppointmentSchedulingModal: React.FC<AppointmentSchedulingModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  doctorId,
  weekAppointments,
}) => {
  const { user } = useAuth();
  const duration = 15; // Fixed to 15 minutes
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [pendingPatients, setPendingPatients] = useState<Patient[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionMethod, setSelectionMethod] = useState<'pending' | 'invite'>('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<any>(null);

  // Check if a slot is busy
  const isSlotBusy = (date: Date, time: string): boolean => {
    if (!doctor?.busySlots || doctor.busySlots.length === 0) return false;
    const dateStr = date.toISOString().split('T')[0];
    return doctor.busySlots.some(slot => slot.date === dateStr && slot.time === time);
  };

  // Get pending appointments for the selected date
  // Only show appointments created by patients (not by the doctor)
  const pendingForDate = useMemo(() => {
    const dateStr = selectedDate.toDateString();
    return weekAppointments.filter((apt) => {
      const aptDate = new Date(apt.dateTime).toDateString();
      // Only show SCHEDULED appointments created by patients (not by the doctor)
      return aptDate === dateStr && 
             apt.status === AppointmentStatus.SCHEDULED && 
             apt.createdBy !== doctorId;
    });
  }, [weekAppointments, selectedDate, doctorId]);

  useEffect(() => {
    if (isOpen) {
      loadPatients();
      // Load doctor data to check blocked days
      doctorService.getDoctor(doctorId).then(setDoctor).catch(console.error);
    } else {
      // Reset state when modal closes
      setSelectedPatient(null);
      setSearchQuery('');
      setSelectionMethod('pending');
      setError(null);
    }
  }, [isOpen, doctorId, pendingForDate]);

  const loadPatients = async () => {
    try {
      // Load all patients assigned to doctor
      const patients = await patientService.getPatientsByDoctor(doctorId);
      setAllPatients(patients);

      // Load patient data for pending appointments
      const pendingPatientsData = await Promise.all(
        pendingForDate.map(async (apt) => {
          try {
            return await patientService.getPatient(apt.patientId);
          } catch {
            return null;
          }
        })
      );
      const filteredPending = pendingPatientsData.filter((p): p is Patient => p !== null);
      setPendingPatients(filteredPending);
      
      // If there's only one pending request, pre-select it
      if (filteredPending.length === 1 && !selectedPatient) {
        setSelectedPatient(filteredPending[0]);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const getEndTime = (): string => {
    const [hour, minute] = selectedTime.split(':').map(Number);
    const endDate = new Date(selectedDate);
    endDate.setHours(hour, minute + 15, 0, 0); // Always 15 minutes
    return endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatTime = (time: string): string => {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return allPatients.filter((patient) => {
      const name = `${patient.personalInfo?.firstName || ''} ${patient.personalInfo?.lastName || ''}`.toLowerCase();
      const patientId = patient.userID?.toLowerCase() || '';
      const phone = patient.contactInfo?.primaryPhone?.toLowerCase() || '';
      return name.includes(query) || patientId.includes(query) || phone.includes(query);
    });
  }, [searchQuery, allPatients]);

  const handleSchedule = async () => {
    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [hour, minute] = selectedTime.split(':').map(Number);
      const appointmentDateTime = new Date(selectedDate);
      appointmentDateTime.setHours(hour, minute, 0, 0);

      // Check if this is updating a pending appointment
      const pendingAppt = pendingForDate.find((apt) => apt.patientId === selectedPatient.userID);
      
      if (pendingAppt) {
        // Update existing pending appointment
        await appointmentService.updateAppointment(pendingAppt.appointmentId, {
          dateTime: appointmentDateTime,
          duration,
          status: AppointmentStatus.CONFIRMED,
        });

        // Log audit trail
        const changes = [];
        if (pendingAppt.status !== AppointmentStatus.CONFIRMED) {
          changes.push({ field: 'status', oldValue: pendingAppt.status, newValue: AppointmentStatus.CONFIRMED });
        }
        if (pendingAppt.dateTime.getTime() !== appointmentDateTime.getTime()) {
          changes.push({ field: 'dateTime', oldValue: pendingAppt.dateTime.toISOString(), newValue: appointmentDateTime.toISOString() });
        }
        if (pendingAppt.duration !== 15) {
          changes.push({ field: 'duration', oldValue: pendingAppt.duration || 30, newValue: 15 });
        }
        
        if (changes.length > 0) {
          auditService.logAction(
            AuditAction.APPOINTMENT_UPDATED,
            AuditCategory.APPOINTMENTS,
            'appointment',
            user,
            {
              targetId: pendingAppt.appointmentId,
              description: `Confirmed and scheduled appointment with ${selectedPatient.displayName}`,
              changes,
              metadata: {
                patientId: selectedPatient.userID,
                patientName: selectedPatient.displayName,
              },
            }
          ).catch(err => console.error('Error logging audit:', err));
        }
      } else {
        // Check if slot is busy
        if (isSlotBusy(selectedDate, selectedTime)) {
          setError('This time slot is marked as busy. Please free it first or choose another time.');
          setLoading(false);
          return;
        }

        // Check if day is blocked
        if (doctor?.blockedDays && doctor.blockedDays.length > 0) {
          const dateStr = selectedDate.toISOString().split('T')[0];
          if (doctor.blockedDays.includes(dateStr)) {
            setError('This day is blocked. Please choose another date.');
            setLoading(false);
            return;
          }
        }

        // Check availability for new appointment
        const isAvailable = await appointmentService.checkAvailability(doctorId, appointmentDateTime, 15);
        if (!isAvailable) {
          setError('This time slot conflicts with an existing appointment or the day is blocked');
          setLoading(false);
          return;
        }

        // Create new appointment
        // When doctor invites a patient (not from pending), status should be SCHEDULED
        // Only when updating a pending appointment should it be CONFIRMED
        const appointmentStatus = AppointmentStatus.SCHEDULED;
        
        const newAppointment = await appointmentService.createAppointment({
          patientId: selectedPatient.userID,
          doctorId,
          userId: doctorId, // Doctor creating the appointment
          dateTime: appointmentDateTime,
          duration: 15, // Fixed to 15 minutes
          type: AppointmentType.CONSULTATION,
          status: appointmentStatus,
          reason: 'Doctor scheduled appointment',
          createdBy: doctorId,
        });

        // Log audit trail
        auditService.logAction(
          AuditAction.APPOINTMENT_CREATED,
          AuditCategory.APPOINTMENTS,
          'appointment',
          user,
          {
            targetId: newAppointment.appointmentId,
            targetDisplayName: `Appointment with ${selectedPatient.displayName}`,
            description: `Scheduled appointment with ${selectedPatient.displayName} on ${formatDate(selectedDate)} at ${formatTime(selectedTime)}`,
            metadata: {
              patientId: selectedPatient.userID,
              patientName: selectedPatient.displayName,
              dateTime: appointmentDateTime.toISOString(),
              duration: 15,
              type: AppointmentType.CONSULTATION,
              status: appointmentStatus,
            },
          }
        ).catch(err => console.error('Error logging audit:', err));
      }

      onClose();
    } catch (err: any) {
      console.error('Error scheduling appointment:', err);
      setError(err.message || 'Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 bg-[#111418]/60 backdrop-blur-sm transition-all"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full h-full md:h-auto md:max-h-[90vh] md:max-w-[600px] bg-white md:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
        {/* Modal Header */}
        <div className="flex justify-between items-start p-6 border-b border-slate-200 bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Schedule Appointment</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span>{formatDate(selectedDate)}</span>
              <span className="mx-1">•</span>
              <span className="font-semibold text-primary">
                {formatTime(selectedTime)} - {getEndTime()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 modal-scroll">
          {/* Patient Selection Section - Only show if slot is not busy */}
          {!isSlotBusy(selectedDate, selectedTime) && (
            <section>
              <label className="block text-sm font-bold text-slate-700 mb-4">Patient Selection</label>
              <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
              <button
                onClick={() => setSelectionMethod('pending')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  selectionMethod === 'pending'
                    ? 'bg-white text-primary shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pending Requests ({pendingForDate.length})
              </button>
              <button
                onClick={() => setSelectionMethod('invite')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  selectionMethod === 'invite'
                    ? 'bg-white text-primary shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Invite Patient
              </button>
              <button
                onClick={async () => {
                  if (!doctor) return;
                  const dateStr = selectedDate.toISOString().split('T')[0];
                  
                  try {
                    const currentBusySlots = doctor.busySlots || [];
                    const newBusySlots = [...currentBusySlots, { date: dateStr, time: selectedTime }];
                    
                    await doctorService.updateDoctor(doctorId, {
                      busySlots: newBusySlots,
                    });
                    
                    // Reload doctor data
                    const updatedDoctor = await doctorService.getDoctor(doctorId);
                    if (updatedDoctor) {
                      setDoctor(updatedDoctor);
                    }
                    
                    // Close modal after marking as busy
                    onClose();
                  } catch (error) {
                    console.error('Error marking slot as busy:', error);
                    setError('Failed to mark slot as busy. Please try again.');
                  }
                }}
                className="flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 bg-red-600 text-white hover:bg-red-700 font-bold"
              >
                <span className="material-symbols-outlined text-[18px]">block</span>
                Mark as Busy
              </button>
            </div>

            {selectionMethod === 'pending' ? (
              <div className="space-y-3">
                {pendingPatients.length > 0 ? (
                  pendingPatients.map((patient) => {
                    const appointment = pendingForDate.find((apt) => apt.patientId === patient.userID);
                    return (
                      <div
                        key={patient.userID}
                        onClick={() => setSelectedPatient(patient)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedPatient?.userID === patient.userID
                            ? 'border-primary bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {patient.photoURL ? (
                            <div
                              className="size-10 rounded-full bg-slate-200 bg-cover"
                              style={{ backgroundImage: `url("${patient.photoURL}")` }}
                            ></div>
                          ) : (
                            <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                              {patient.displayName?.charAt(0) || 'P'}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900">{patient.displayName}</p>
                            <p className="text-xs text-slate-500">ID: {patient.userID}</p>
                            {appointment?.reason && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-1">{appointment.reason}</p>
                            )}
                          </div>
                          {selectedPatient?.userID === patient.userID && (
                            <span className="material-symbols-outlined text-primary">check_circle</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No pending requests for this date
                  </p>
                )}
              </div>
            ) : (
              <div className="relative">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400">search</span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-3 border border-primary ring-1 ring-primary/20 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-shadow shadow-sm"
                    placeholder="Search by name, ID, or phone number..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery.length >= 2 && filteredPatients.length > 0 && (
                    <div className="absolute mt-1 w-full bg-white rounded-lg shadow-xl border border-slate-200 z-20 overflow-hidden">
                      <ul className="max-h-60 overflow-y-auto py-1">
                        {filteredPatients.map((patient) => (
                          <li
                            key={patient.userID}
                            onClick={() => {
                              setSelectedPatient(patient);
                              setSearchQuery('');
                            }}
                            className={`px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors ${
                              selectedPatient?.userID === patient.userID ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {patient.photoURL ? (
                                  <div
                                    className="size-10 rounded-full bg-slate-200 bg-cover flex-shrink-0"
                                    style={{ backgroundImage: `url("${patient.photoURL}")` }}
                                  ></div>
                                ) : (
                                  <div className="size-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                    {patient.displayName?.charAt(0) || 'P'}
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{patient.displayName}</p>
                                  <p className="text-xs text-slate-500">
                                    ID: {patient.userID} • {patient.contactInfo?.primaryPhone || 'No phone'}
                                  </p>
                                </div>
                              </div>
                              {selectedPatient?.userID === patient.userID && (
                                <span className="material-symbols-outlined text-primary">check_circle</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {selectedPatient && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-3">
                    {selectedPatient.photoURL ? (
                      <div
                        className="size-12 rounded-full bg-slate-200 bg-cover"
                        style={{ backgroundImage: `url("${selectedPatient.photoURL}")` }}
                      ></div>
                    ) : (
                      <div className="size-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                        {selectedPatient.displayName?.charAt(0) || 'P'}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{selectedPatient.displayName}</p>
                      <p className="text-xs text-slate-500">ID: {selectedPatient.userID}</p>
                    </div>
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                )}
                <p className="mt-2 text-xs text-slate-500">Search effectively by typing at least 2 characters.</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </section>
          )}

          {/* Busy Slot Message */}
          {isSlotBusy(selectedDate, selectedTime) && (
            <section>
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-red-600 text-2xl">block</span>
                  <h4 className="text-sm font-bold text-red-900">This time slot is marked as busy</h4>
                </div>
                <p className="text-sm text-red-700">
                  No appointments can be scheduled on this slot. Click "Free Slot" below to make it available again.
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-bold text-sm hover:bg-white transition-colors"
          >
            Cancel
          </button>
          {isSlotBusy(selectedDate, selectedTime) ? (
            <button
              onClick={async () => {
                if (!doctor) return;
                const dateStr = selectedDate.toISOString().split('T')[0];
                
                try {
                  const currentBusySlots = doctor.busySlots || [];
                  const newBusySlots = currentBusySlots.filter(
                    slot => !(slot.date === dateStr && slot.time === selectedTime)
                  );
                  
                  await doctorService.updateDoctor(doctorId, {
                    busySlots: newBusySlots,
                  });
                  
                  // Reload doctor data
                  const updatedDoctor = await doctorService.getDoctor(doctorId);
                  if (updatedDoctor) {
                    setDoctor(updatedDoctor);
                  }
                  
                  onClose();
                } catch (error) {
                  console.error('Error freeing busy slot:', error);
                  setError('Failed to free busy slot. Please try again.');
                }
              }}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-bold text-sm hover:bg-green-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  Freeing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Free Slot
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSchedule}
              disabled={!selectedPatient || loading}
              className="px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-blue-600 shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  Scheduling...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  Schedule
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentSchedulingModal;

