// src/pages/doctor/Appointments.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/common/Loading';
import appointmentService from '@/services/appointmentService';
import doctorService from '@/services/doctorService';
import patientService from '@/services/patientService';
import type { Appointment } from '@/models/Appointment';
import type { Doctor } from '@/models/Doctor';
import type { Patient } from '@/models/Patient';
import { AppointmentStatus, DayOfWeek } from '@/enums';
import { AuditAction, AuditCategory } from '@/models/AuditLog';
import auditService from '@/services/auditService';
import AppointmentSchedulingModal from '@/components/doctor/AppointmentSchedulingModal';
import DoctorHeader from '@/components/layout/DoctorHeader';

interface AppointmentWithPatient extends Appointment {
  patient?: Patient | null;
}

const Appointments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [allAppointments, setAllAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState<{ date: Date; time: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blockDayModal, setBlockDayModal] = useState<{ isOpen: boolean; date: Date | null }>({ isOpen: false, date: null });

  // Get start and end of current week (Monday to Sunday)
  const getWeekRange = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user?.userID) {
        setLoading(false);
        return;
      }

      try {
        // Load doctor data
        const doctorData = await doctorService.getDoctor(user.userID);
        setDoctor(doctorData);

        // Load ALL appointments (for pending requests section)
        const allAppts = await appointmentService.getAppointmentsByDoctor(user.userID);
        
        // Fetch patient data for all appointments
        const allAppointmentsWithPatients = await Promise.all(
          allAppts.map(async (apt) => {
            try {
              const patient = await patientService.getPatient(apt.patientId);
              return { ...apt, patient };
            } catch {
              return { ...apt, patient: null };
            }
          })
        );

        setAllAppointments(allAppointmentsWithPatients);

        // Filter appointments for current week
        const { start, end } = getWeekRange(currentWeek);
        const weekAppointments = allAppointmentsWithPatients.filter(apt => {
          const aptDate = new Date(apt.dateTime);
          return aptDate >= start && aptDate <= end;
        });

        setAppointments(weekAppointments);
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, currentWeek]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const { start: weekStart, end: weekEnd } = getWeekRange(currentWeek);

  // Generate week days (Monday to Sunday)
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const start = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }, [weekStart]);

  // Generate time slots based on doctor's working hours
  const timeSlots = useMemo(() => {
    if (!doctor?.availability) {
      // Default: 8 AM to 6 PM, 15-minute intervals
      const slots: string[] = [];
      for (let hour = 8; hour < 18; hour++) {
        for (let min = 0; min < 60; min += 15) {
          const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
          slots.push(time);
        }
      }
      return slots;
    }

    const { start, end } = doctor.availability.workingHours;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const slots: string[] = [];

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const time = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
      slots.push(time);
      currentMin += 15;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }

    return slots;
  }, [doctor]);

  // Check if a day is a working day
  const isWorkingDay = (date: Date): boolean => {
    if (!doctor?.availability?.workingDays) return true;
    const dayNames: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    const dayOfWeek = dayNames[date.getDay()];
    return doctor.availability.workingDays.includes(dayOfWeek);
  };

  // Check if a day is blocked
  const isDayBlocked = (date: Date): boolean => {
    if (!doctor?.blockedDays || doctor.blockedDays.length === 0) return false;
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    return doctor.blockedDays.includes(dateStr);
  };

  // Check if a time slot is busy
  const isSlotBusy = (date: Date, time: string): boolean => {
    if (!doctor?.busySlots || doctor.busySlots.length === 0) return false;
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    return doctor.busySlots.some(slot => slot.date === dateStr && slot.time === time);
  };

  // Format date to YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Handle blocking/unblocking a day
  const handleBlockDay = async (date: Date, block: boolean) => {
    if (!user?.userID || !doctor) return;

    try {
      const dateStr = formatDateString(date);
      const currentBlockedDays = doctor.blockedDays || [];
      
      let newBlockedDays: string[];
      if (block) {
        // Add to blocked days if not already blocked
        if (!currentBlockedDays.includes(dateStr)) {
          newBlockedDays = [...currentBlockedDays, dateStr];
        } else {
          return; // Already blocked
        }
      } else {
        // Remove from blocked days
        newBlockedDays = currentBlockedDays.filter(d => d !== dateStr);
      }

      // Update doctor's blockedDays
      await doctorService.updateDoctor(user.userID, {
        blockedDays: newBlockedDays,
      });

      // Reload doctor data
      const updatedDoctor = await doctorService.getDoctor(user.userID);
      if (updatedDoctor) {
        setDoctor(updatedDoctor);
      }

      setBlockDayModal({ isOpen: false, date: null });
    } catch (error) {
      console.error('Error blocking/unblocking day:', error);
      alert('Failed to update blocked day. Please try again.');
    }
  };

  // Get appointment starting at a specific date and time slot
  const getAppointmentAt = (date: Date, time: string): AppointmentWithPatient | null => {
    const [hour, minute] = time.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hour, minute, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 15);

    return appointments.find((apt) => {
      const aptDate = new Date(apt.dateTime);
      // Normalize to minute precision for comparison
      aptDate.setSeconds(0, 0);
      slotStart.setSeconds(0, 0);
      
      // Check if appointment starts in this exact slot
      return aptDate.getTime() === slotStart.getTime();
    }) || null;
  };

  // Check if a time slot is occupied by an appointment (either starts here or is part of a multi-slot appointment)
  const isSlotOccupied = (date: Date, time: string): boolean => {
    const [hour, minute] = time.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hour, minute, 0, 0);
    slotStart.setSeconds(0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 15);

    return appointments.some((apt) => {
      const aptDate = new Date(apt.dateTime);
      aptDate.setSeconds(0, 0);
      
      const aptDuration = apt.duration || 30;
      const aptEnd = new Date(aptDate);
      aptEnd.setMinutes(aptEnd.getMinutes() + aptDuration);

      // Check if this slot overlaps with the appointment
      // Slot overlaps if: slotStart < aptEnd && slotEnd > aptDate
      return slotStart.getTime() < aptEnd.getTime() && slotEnd.getTime() > aptDate.getTime();
    });
  };

  // Get all appointments for a specific day
  const getAppointmentsForDay = (date: Date): AppointmentWithPatient[] => {
    const dateStr = date.toDateString();
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.dateTime).toDateString();
      return aptDate === dateStr;
    });
  };

  // Get time slot index for an appointment
  const getTimeSlotIndex = (dateTime: Date): number => {
    const [startHour, startMin] = timeSlots[0].split(':').map(Number);
    const startTime = new Date(dateTime);
    startTime.setHours(startHour, startMin, 0, 0);
    
    const diffMs = dateTime.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return Math.floor(diffMins / 15);
  };

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showAmendModal, setShowAmendModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [amendReason, setAmendReason] = useState('');
  const [amendDate, setAmendDate] = useState<Date | null>(null);
  const [amendTimeSlots, setAmendTimeSlots] = useState<Date[]>([]);
  const [amendSelectedTime, setAmendSelectedTime] = useState<Date | null>(null);

  // Get pending appointments (PENDING or AMENDED status)
  // Only show appointments created by patients (not by the doctor)
  // Use allAppointments to include pending requests from any week
  const pendingAppointments = useMemo(() => {
    return allAppointments
      .filter((apt) => {
        // Show PENDING or AMENDED appointments that were created by patients (not by the doctor)
        return (
          (apt.status === AppointmentStatus.PENDING || apt.status === AppointmentStatus.AMENDED) &&
          apt.createdBy !== user?.userID
        );
      })
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }, [allAppointments, user]);

  const formatWeekRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = weekStart.toLocaleDateString('en-US', options);
    const endStr = weekEnd.toLocaleDateString('en-US', options);
    const year = weekStart.getFullYear();
    return `${startStr} - ${endStr}, ${year}`;
  };

  const formatTime = (time: string): string => {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-500 text-yellow-600 dark:text-yellow-400';
      case AppointmentStatus.ACCEPTED:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-500 text-blue-600 dark:text-blue-400';
      case AppointmentStatus.AMENDED:
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-400 dark:border-orange-500 text-orange-600 dark:text-orange-400';
      case AppointmentStatus.CONFIRMED:
        return 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-500 text-green-600 dark:text-green-400';
      case AppointmentStatus.COMPLETED:
        return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400';
      case AppointmentStatus.CANCELLED:
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      default:
        return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400';
    }
  };

  const handleAcceptAppointment = async (appointmentId: string) => {
    console.log('[DOCTOR_APPOINTMENTS] handleAcceptAppointment called', { appointmentId });
    if (!user?.userID) return;
    
    setProcessingId(appointmentId);
    try {
      const appointment = await appointmentService.acceptAppointment(appointmentId, user.userID);
      console.log('[DOCTOR_APPOINTMENTS] Appointment accepted', { 
        appointmentId, 
        newStatus: appointment.status 
      });

      // Log audit trail
      const apt = allAppointments.find(apt => apt.appointmentId === appointmentId);
      if (apt) {
        await auditService.logAction(
          AuditAction.APPOINTMENT_UPDATED,
          AuditCategory.APPOINTMENTS,
          'appointment',
          user,
          {
            targetId: appointmentId,
            targetDisplayName: `Appointment with ${apt.patient?.displayName || 'Patient'}`,
            description: `Doctor accepted appointment`,
            changes: [
              { field: 'status', oldValue: apt.status, newValue: appointment.status }
            ],
            metadata: {
              doctorId: user.userID,
              patientId: apt.patientId,
              dateTime: apt.dateTime.toISOString(),
            },
          }
        ).catch(err => console.error('[DOCTOR_APPOINTMENTS] Error logging audit:', err));
      }

      await handleModalClose();
    } catch (error: any) {
      console.error('[DOCTOR_APPOINTMENTS] Error accepting appointment:', error);
      alert(error.message || 'Failed to accept appointment. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectAppointment = async (appointmentId: string) => {
    console.log('[DOCTOR_APPOINTMENTS] handleRejectAppointment called', { 
      appointmentId, 
      reason: rejectReason 
    });
    if (!user?.userID || !rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setProcessingId(appointmentId);
    try {
      await appointmentService.rejectAppointment(appointmentId, user.userID, rejectReason.trim());
      console.log('[DOCTOR_APPOINTMENTS] Appointment rejected');

      // Log audit trail
      const apt = allAppointments.find(apt => apt.appointmentId === appointmentId);
      if (apt) {
        await auditService.logAction(
          AuditAction.APPOINTMENT_CANCELLED,
          AuditCategory.APPOINTMENTS,
          'appointment',
          user,
          {
            targetId: appointmentId,
            targetDisplayName: `Appointment with ${apt.patient?.displayName || 'Patient'}`,
            description: `Doctor rejected appointment`,
            changes: [
              { field: 'status', oldValue: apt.status, newValue: AppointmentStatus.CANCELLED }
            ],
            metadata: {
              doctorId: user.userID,
              patientId: apt.patientId,
              dateTime: apt.dateTime.toISOString(),
              rejectionReason: rejectReason,
            },
          }
        ).catch(err => console.error('[DOCTOR_APPOINTMENTS] Error logging audit:', err));
      }

      setShowRejectModal(null);
      setRejectReason('');
      await handleModalClose();
    } catch (error: any) {
      console.error('[DOCTOR_APPOINTMENTS] Error rejecting appointment:', error);
      alert(error.message || 'Failed to reject appointment. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAmendAppointment = async (appointmentId: string) => {
    console.log('[DOCTOR_APPOINTMENTS] handleAmendAppointment called', { 
      appointmentId, 
      newDate: amendDate?.toISOString(),
      newTime: amendSelectedTime?.toISOString(),
      reason: amendReason 
    });
    if (!user?.userID || !amendSelectedTime || !amendReason.trim()) {
      alert('Please select a new date/time and provide a reason');
      return;
    }
    
    setProcessingId(appointmentId);
    try {
      const appointment = await appointmentService.amendAppointment(
        appointmentId,
        user.userID,
        amendSelectedTime,
        amendReason.trim()
      );
      console.log('[DOCTOR_APPOINTMENTS] Appointment amended', { 
        appointmentId, 
        newStatus: appointment.status 
      });

      // Log audit trail
      const apt = allAppointments.find(apt => apt.appointmentId === appointmentId);
      if (apt) {
        await auditService.logAction(
          AuditAction.APPOINTMENT_UPDATED,
          AuditCategory.APPOINTMENTS,
          'appointment',
          user,
          {
            targetId: appointmentId,
            targetDisplayName: `Appointment with ${apt.patient?.displayName || 'Patient'}`,
            description: `Doctor requested appointment amendment`,
            changes: [
              { field: 'status', oldValue: apt.status, newValue: appointment.status },
              { field: 'dateTime', oldValue: apt.dateTime.toISOString(), newValue: amendSelectedTime.toISOString() }
            ],
            metadata: {
              doctorId: user.userID,
              patientId: apt.patientId,
              originalDateTime: apt.dateTime.toISOString(),
              newDateTime: amendSelectedTime.toISOString(),
              amendmentReason: amendReason,
            },
          }
        ).catch(err => console.error('[DOCTOR_APPOINTMENTS] Error logging audit:', err));
      }

      setShowAmendModal(null);
      setAmendReason('');
      setAmendDate(null);
      setAmendSelectedTime(null);
      setAmendTimeSlots([]);
      await handleModalClose();
    } catch (error: any) {
      console.error('[DOCTOR_APPOINTMENTS] Error amending appointment:', error);
      alert(error.message || 'Failed to amend appointment. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // Load time slots when amend date is selected
  useEffect(() => {
    const loadAmendTimeSlots = async () => {
      if (!amendDate || !showAmendModal || !user?.userID) {
        setAmendTimeSlots([]);
        setAmendSelectedTime(null);
        return;
      }

      try {
        const slots = await appointmentService.getAvailableTimeSlots(user.userID, amendDate);
        console.log('[DOCTOR_APPOINTMENTS] Loaded amend time slots', { count: slots.length });
        setAmendTimeSlots(slots);
      } catch (error) {
        console.error('[DOCTOR_APPOINTMENTS] Error loading amend time slots:', error);
        setAmendTimeSlots([]);
      }
    };

    loadAmendTimeSlots();
  }, [amendDate, showAmendModal, user]);

  const handleCellClick = (date: Date, time: string) => {
    const appointment = getAppointmentAt(date, time);
    if (appointment) {
      // For confirmed or accepted appointments, navigate to new encounter
      if (appointment.status === AppointmentStatus.CONFIRMED || appointment.status === AppointmentStatus.ACCEPTED) {
        navigate(`/doctor/new-encounter?appointmentId=${appointment.appointmentId}`);
      } else {
        // For other statuses, navigate to patient profile
        navigate(`/doctor/patient-profile/${appointment.patientId}`);
      }
    } else if (isWorkingDay(date) && !isDayBlocked(date)) {
      // Open scheduling modal (can be used to schedule or free busy slots)
      setSelectedCell({ date, time });
      setIsModalOpen(true);
    }
  };

  const handleModalClose = async () => {
    setIsModalOpen(false);
    setSelectedCell(null);
    // Reload doctor data and all appointments
    if (!user?.userID) return;
    
    try {
      // Reload doctor data (to get updated busySlots and blockedDays)
      const doctorData = await doctorService.getDoctor(user.userID);
      setDoctor(doctorData);

      // Reload all appointments
      const allAppts = await appointmentService.getAppointmentsByDoctor(user.userID);
      const allAppointmentsWithPatients = await Promise.all(
        allAppts.map(async (apt) => {
          try {
            const patient = await patientService.getPatient(apt.patientId);
            return { ...apt, patient };
          } catch {
            return { ...apt, patient: null };
          }
        })
      );

      setAllAppointments(allAppointmentsWithPatients);

      // Filter appointments for current week
      const { start, end } = getWeekRange(currentWeek);
      const weekAppointments = allAppointmentsWithPatients.filter(apt => {
        const aptDate = new Date(apt.dateTime);
        return aptDate >= start && aptDate <= end;
      });

      setAppointments(weekAppointments);
    } catch (error) {
      console.error('Error reloading appointments:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f8]">
        <Loading size={48} message="Loading appointments..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f8] flex flex-col">
      <style>{`
        .modal-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .modal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .modal-scroll::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}</style>
      {/* Header */}
      <DoctorHeader />

      {/* Main Content */}
      <div className="flex flex-1 justify-center py-6 px-4 lg:px-8">
        <div className="flex flex-col w-full max-w-[1400px] gap-6">
          {/* Week Navigation Header */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-[72px] z-40">
            <h1 className="text-2xl font-black tracking-tight text-[#111418]">Appointments</h1>
            <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1">
              <button
                onClick={() => navigateWeek('prev')}
                className="size-8 flex items-center justify-center rounded hover:bg-white hover:shadow-sm text-slate-500 hover:text-primary transition-all"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="px-4 text-sm font-bold text-[#111418] flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">calendar_today</span>
                {formatWeekRange()}
              </div>
              <button
                onClick={() => navigateWeek('next')}
                className="size-8 flex items-center justify-center rounded hover:bg-white hover:shadow-sm text-slate-500 hover:text-primary transition-all"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium">
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                Filter
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50">
              <div className="p-3 border-r border-slate-200 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Time</span>
              </div>
              {weekDays.map((day, idx) => {
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const dayName = dayNames[day.getDay()];
                const isWorking = isWorkingDay(day);
                const isToday = day.toDateString() === new Date().toDateString();
                const isBlocked = isDayBlocked(day);
                
                return (
                  <div
                    key={idx}
                    className={`p-3 border-r border-slate-200 text-center min-w-[120px] relative ${
                      isBlocked ? 'bg-red-50/50' : !isWorking ? 'bg-slate-50/50' : isToday ? 'bg-blue-50/50' : ''
                    } ${idx === 6 ? 'border-r-0' : ''}`}
                  >
                    <button
                      onClick={() => setBlockDayModal({ isOpen: true, date: day })}
                      className="absolute top-1 right-1 size-6 flex items-center justify-center rounded hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
                      title={isBlocked ? 'Unblock this day' : 'Block this day'}
                    >
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <span className={`block text-xs font-medium uppercase ${
                      isBlocked ? 'text-red-600 font-bold' : 
                      isWorking && isToday ? 'text-primary font-bold' : 'text-slate-500'
                    }`}>
                      {dayName}
                    </span>
                    <span className={`block text-lg font-bold ${
                      isBlocked ? 'text-red-600' : 
                      isWorking && isToday ? 'text-primary' : 'text-[#111418]'
                    }`}>
                      {day.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Time Slots Grid */}
            <div className="overflow-y-auto flex-1 relative">
              <div className="flex relative min-w-[900px]">
                {/* Time Column - Fixed, separate from appointment grid */}
                <div className="flex-shrink-0 border-r border-slate-200" style={{ width: '80px' }}>
                  <div className="grid" style={{ gridAutoRows: '64px' }}>
                    {timeSlots.map((time, timeIdx) => (
                      <div key={timeIdx} className="border-b border-slate-100 p-2 text-right h-16 flex items-center justify-end">
                        <span className="text-xs text-slate-400 font-medium">
                          {formatTime(time)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Days Grid - 7 columns for the days */}
                <div className="flex-1 grid grid-cols-7 relative" style={{ gridAutoRows: '64px' }}>
                  {timeSlots.map((time, timeIdx) => (
                    <React.Fragment key={timeIdx}>
                      {/* Day Cells */}
                      {weekDays.map((day, dayIdx) => {
                        const appointment = getAppointmentAt(day, time);
                        const isWorking = isWorkingDay(day);
                        const isBlocked = isDayBlocked(day);
                        const isBusy = isSlotBusy(day, time);
                        const isOutsideHours = !isWorking || isBlocked;
                        // Check if slot is occupied by any appointment (but not the one starting here)
                        const isOccupied = !appointment && isSlotOccupied(day, time);

                      if (isOutsideHours) {
                        return (
                          <div
                            key={`${timeIdx}-${dayIdx}`}
                            className={`border-r border-b border-slate-100 h-16 ${
                              isBlocked ? 'bg-red-50/40' : 'bg-slate-50/40'
                            }`}
                          ></div>
                        );
                      }

                      if (isBusy && !appointment) {
                        // Show busy slot - can be clicked to free it
                        return (
                          <div
                            key={`${timeIdx}-${dayIdx}`}
                            className={`border-r border-b border-slate-100 h-16 relative group/busy ${
                              dayIdx === 6 ? 'border-r-0' : ''
                            }`}
                          >
                            <div
                              className="w-full h-full bg-red-100 border-2 border-red-300 rounded flex items-center justify-center cursor-pointer hover:bg-red-200 transition-colors"
                              onClick={() => {
                                setSelectedCell({ date: day, time });
                                setIsModalOpen(true);
                              }}
                            >
                              <div className="text-center">
                                <span className="material-symbols-outlined text-red-600 text-lg">block</span>
                                <p className="text-[10px] font-bold text-red-700 mt-0.5">Busy</p>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (appointment) {
                        const statusColor = getStatusColor(appointment.status);
                        const duration = 15; // Fixed to 15 minutes
                        const aptStart = new Date(appointment.dateTime);
                        const aptEnd = new Date(aptStart);
                        aptEnd.setMinutes(aptEnd.getMinutes() + duration);
                        const timeRange = `${aptStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${aptEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

                        return (
                          <div
                            key={`${timeIdx}-${dayIdx}`}
                            className={`border-r border-b border-slate-100 relative p-1 group/appt h-16 ${
                              dayIdx === 6 ? 'border-r-0' : ''
                            }`}
                          >
                            <div
                              className={`w-full h-full rounded border-l-4 flex flex-col justify-center px-2 cursor-pointer transition-colors ${statusColor}`}
                              onClick={() => handleCellClick(day, time)}
                            >
                              <span className="text-xs font-bold truncate">
                                {appointment.patient?.displayName || `Patient ${appointment.patientId}`}
                              </span>
                              <span className="text-[10px] font-medium">
                                {appointment.status === AppointmentStatus.PENDING && 'Pending'}
                                {appointment.status === AppointmentStatus.ACCEPTED && 'Accepted'}
                                {appointment.status === AppointmentStatus.AMENDED && 'Amended'}
                                {appointment.status === AppointmentStatus.CONFIRMED && 'Confirmed'}
                                {appointment.status === AppointmentStatus.COMPLETED && 'Completed'}
                                {appointment.status === AppointmentStatus.CANCELLED && 'Cancelled'}
                              </span>
                            </div>
                            {/* Appointment Details Tooltip */}
                            <div className="absolute left-full top-0 ml-2 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 opacity-0 invisible group-hover/appt:opacity-100 group-hover/appt:visible transition-all duration-200 pointer-events-auto hover:opacity-100 hover:visible">
                              <div className="flex items-start gap-3 mb-3">
                                {appointment.patient?.photoURL ? (
                                  <div
                                    className="size-10 rounded-full bg-slate-200 bg-cover"
                                    style={{ backgroundImage: `url("${appointment.patient.photoURL}")` }}
                                  ></div>
                                ) : (
                                  <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                                    {appointment.patient?.displayName?.charAt(0) || 'P'}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h4 className="text-sm font-bold text-slate-900">
                                    {appointment.patient?.displayName || `Patient ${appointment.patientId}`}
                                  </h4>
                                  <p className="text-xs text-slate-500">
                                    ID: {appointment.patientId}
                                    {appointment.patient?.personalInfo?.dateOfBirth && (
                                      <> • {Math.floor((new Date().getTime() - new Date(appointment.patient.personalInfo.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yrs</>
                                    )}
                                  </p>
                                </div>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                                  appointment.status === AppointmentStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
                                  appointment.status === AppointmentStatus.ACCEPTED ? 'bg-blue-100 text-blue-700' :
                                  appointment.status === AppointmentStatus.AMENDED ? 'bg-orange-100 text-orange-700' :
                                  appointment.status === AppointmentStatus.CONFIRMED ? 'bg-green-100 text-green-700' :
                                  appointment.status === AppointmentStatus.COMPLETED ? 'bg-slate-100 text-slate-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {appointment.status}
                                </span>
                              </div>
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                                  {timeRange} ({duration} min)
                                </div>
                                {appointment.type && (
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <span className="material-symbols-outlined text-[14px]">stethoscope</span>
                                    {appointment.type}
                                  </div>
                                )}
                                {appointment.reason && (
                                  <p className="text-xs text-slate-500 italic">"{appointment.reason}"</p>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {(appointment.status === AppointmentStatus.ACCEPTED || appointment.status === AppointmentStatus.CONFIRMED) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/doctor/new-encounter?appointmentId=${appointment.appointmentId}`);
                                    }}
                                    className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded hover:bg-blue-600 transition-colors"
                                  >
                                    Start Encounter
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/doctor/patient-profile/${appointment.patientId}`);
                                  }}
                                  className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded hover:bg-slate-50 transition-colors"
                                >
                                  View Profile
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (isOccupied) {
                        // Slot is occupied by a multi-slot appointment that started earlier
                        // Render empty cell to maintain grid structure
                        return (
                          <div
                            key={`${timeIdx}-${dayIdx}`}
                            className={`border-r border-b border-slate-100 h-16 ${
                              dayIdx === 6 ? 'border-r-0' : ''
                            }`}
                          ></div>
                        );
                      }

                      return (
                        <div
                          key={`${timeIdx}-${dayIdx}`}
                          className={`border-r border-b border-slate-100 h-16 relative group ${
                            dayIdx === 6 ? 'border-r-0' : ''
                          }`}
                        >
                          <button
                            onClick={() => handleCellClick(day, time)}
                            className="absolute inset-0 m-auto size-6 rounded-full bg-primary text-white items-center justify-center hidden group-hover:flex shadow-sm z-10"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                          </button>
                        </div>
                      );
                    })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pending Requests Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#111418] flex items-center gap-2">
                Pending Requests
                {pendingAppointments.length > 0 && (
                  <span className="inline-flex items-center justify-center size-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                    {pendingAppointments.length}
                  </span>
                )}
              </h2>
            </div>
            <div className="overflow-x-auto pb-4">
              {pendingAppointments.length > 0 ? (
                <div className="flex gap-4 min-w-max">
                  {pendingAppointments.map((apt) => {
                    const timeAgo = getTimeAgo(apt.createdAt);
                    return (
                <div
                  key={apt.appointmentId}
                        className="w-80 bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer relative"
                      >
                        <div className="absolute top-4 right-4 text-xs text-slate-400">{timeAgo}</div>
                        <div className="flex items-center gap-3 mb-3">
                          {apt.patient?.photoURL ? (
                            <div
                              className="size-12 rounded-full bg-slate-200 bg-cover"
                              style={{ backgroundImage: `url("${apt.patient.photoURL}")` }}
                            ></div>
                          ) : (
                            <div className="size-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                              {apt.patient?.displayName?.charAt(0) || 'P'}
                            </div>
                          )}
                    <div>
                            <h3 className="font-bold text-[#111418] group-hover:text-primary transition-colors">
                              {apt.patient?.displayName || `Patient ${apt.patientId}`}
                            </h3>
                            <p className="text-xs text-slate-500">ID: {apt.patientId}</p>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="material-symbols-outlined text-[16px] text-primary">event</span>
                            Req: {new Date(apt.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {new Date(apt.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </div>
                      {apt.reason && (
                            <p className="text-sm text-slate-500 line-clamp-2">{apt.reason}</p>
                      )}
                    </div>
                        <div className="flex gap-2 mt-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptAppointment(apt.appointmentId);
                            }}
                            disabled={processingId === apt.appointmentId}
                            className="flex-1 py-1.5 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {processingId === apt.appointmentId ? (
                              <>
                                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                Processing...
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                Accept
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowRejectModal(apt.appointmentId);
                            }}
                            disabled={processingId === apt.appointmentId}
                            className="flex-1 py-1.5 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                            Reject
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAmendModal(apt.appointmentId);
                              setAmendDate(apt.dateTime);
                            }}
                            disabled={processingId === apt.appointmentId}
                            className="flex-1 py-1.5 bg-orange-600 text-white text-sm font-bold rounded hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Amend
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                  <p>No pending appointment requests</p>
                </div>
                      )}
                    </div>
                  </div>
                </div>
      </div>

      {/* Scheduling Modal */}
      {isModalOpen && selectedCell && (
        <AppointmentSchedulingModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          selectedDate={selectedCell.date}
          selectedTime={selectedCell.time}
          doctorId={user?.userID || ''}
          weekAppointments={appointments}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Reject Appointment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this appointment:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 min-h-[100px]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectAppointment(showRejectModal)}
                disabled={!rejectReason.trim() || processingId === showRejectModal}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {processingId === showRejectModal ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Amend Modal */}
      {showAmendModal && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full my-8">
            <h3 className="text-lg font-bold mb-4">Amend Appointment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a new date and time, and provide a reason:
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">New Date</label>
              <input
                type="date"
                value={amendDate ? amendDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const newDate = e.target.value ? new Date(e.target.value) : null;
                  setAmendDate(newDate);
                  setAmendSelectedTime(null);
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>

            {amendDate && amendTimeSlots.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">New Time</label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {amendTimeSlots.map((slot, index) => {
                    const isSelected = amendSelectedTime?.getTime() === slot.getTime();
                    const timeStr = `${slot.getHours().toString().padStart(2, '0')}:${slot.getMinutes().toString().padStart(2, '0')}`;
                    return (
                      <button
                        key={index}
                        onClick={() => setAmendSelectedTime(slot)}
                        className={`p-2 rounded-lg border-2 text-sm ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-bold'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-primary/50'
                        }`}
                      >
                        {formatTime(timeStr)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Reason for Amendment</label>
              <textarea
                value={amendReason}
                onChange={(e) => setAmendReason(e.target.value)}
                placeholder="Enter reason..."
                className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px]"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAmendModal(null);
                  setAmendReason('');
                  setAmendDate(null);
                  setAmendSelectedTime(null);
                  setAmendTimeSlots([]);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAmendAppointment(showAmendModal)}
                disabled={!amendSelectedTime || !amendReason.trim() || processingId === showAmendModal}
                className="flex-1 py-2.5 px-4 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 disabled:opacity-50"
              >
                {processingId === showAmendModal ? 'Amending...' : 'Amend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Day Modal */}
      {blockDayModal.isOpen && blockDayModal.date && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#111418]/60 backdrop-blur-sm transition-all"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBlockDayModal({ isOpen: false, date: null });
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600 text-2xl">block</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#111418]">
                  {isDayBlocked(blockDayModal.date) ? 'Unblock Day' : 'Block Day'}
                </h3>
                <p className="text-sm text-slate-500">
                  {blockDayModal.date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <p className="text-slate-600 mb-6">
              {isDayBlocked(blockDayModal.date) 
                ? 'Are you sure you want to unblock this day? Patients and doctors will be able to schedule appointments on this day.'
                : 'Are you sure you want to block this day? Patients and doctors will not be able to schedule any appointments on this entire day.'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setBlockDayModal({ isOpen: false, date: null })}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBlockDay(blockDayModal.date!, !isDayBlocked(blockDayModal.date))}
                className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-white transition-colors ${
                  isDayBlocked(blockDayModal.date)
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isDayBlocked(blockDayModal.date) ? 'Unblock Day' : 'Block Day'}
              </button>
            </div>
          </div>
        </div>
          )}
    </div>
  );
};

const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export default Appointments;
