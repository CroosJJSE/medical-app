// src/pages/patient/Appointments.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/common/Loading';
import BottomNavigation from '@/components/layout/BottomNavigation';
import appointmentService from '@/services/appointmentService';
import { getDoctor } from '@/services/doctorService';
import auditService from '@/services/auditService';
import type { Appointment } from '@/models/Appointment';
import type { Doctor } from '@/models/Doctor';
import { AppointmentStatus } from '@/enums';
import { AuditAction, AuditCategory } from '@/models/AuditLog';

interface AppointmentWithDoctor extends Appointment {
  doctor?: Doctor | null;
}

type FilterType = 'upcoming' | 'past' | 'all';

const Appointments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.userID || user?.userId || '';
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Convert Firestore Timestamp or Date to Date object
  const toDate = (date: any): Date => {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    if (date && typeof date.toDate === 'function') {
      return date.toDate();
    }
    if (typeof date === 'string' || typeof date === 'number') {
      return new Date(date);
    }
    return new Date();
  };

  const loadAppointments = useCallback(async () => {
    if (!userId) return;

    try {
      const data = await appointmentService.getAppointmentsByPatient(userId);
      
      // Convert dates and fetch doctor info
      const appointmentsWithDoctors = await Promise.all(
        data.map(async (apt) => {
          const appointmentDate = toDate(apt.dateTime);
          let doctor: Doctor | null = null;
          
          try {
            doctor = await getDoctor(apt.doctorId);
          } catch (error) {
            console.error(`Error fetching doctor ${apt.doctorId}:`, error);
          }

          return {
            ...apt,
            dateTime: appointmentDate,
            doctor,
          };
        })
      );

      // Sort by date (most recent first for past, upcoming first for future)
      appointmentsWithDoctors.sort((a, b) => {
        const timeA = a.dateTime.getTime();
        const timeB = b.dateTime.getTime();
        const now = Date.now();
        
        // If both are in the past or both are in the future, sort by date
        if ((timeA < now && timeB < now) || (timeA >= now && timeB >= now)) {
          return timeB - timeA; // Most recent first
        }
        // Future appointments come before past
        return timeB - timeA;
      });

      setAppointments(appointmentsWithDoctors);
    } catch (error) {
      console.error('[PATIENT_APPOINTMENTS] Error loading appointments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    if (!user) return;
    
    setConfirmingId(appointmentId);
    try {
      // Update appointment status to CONFIRMED
      await appointmentService.updateAppointment(appointmentId, {
        status: AppointmentStatus.CONFIRMED,
      });

      // Log audit trail
      const appointment = appointments.find(apt => apt.appointmentId === appointmentId);
      if (appointment) {
        await auditService.logAction(
          AuditAction.APPOINTMENT_UPDATED,
          AuditCategory.APPOINTMENTS,
          'appointment',
          user,
          {
            targetId: appointmentId,
            targetDisplayName: `Appointment with ${appointment.doctor?.displayName || 'Doctor'}`,
            description: `Patient confirmed appointment scheduled by doctor`,
            changes: [
              { field: 'status', oldValue: AppointmentStatus.SCHEDULED, newValue: AppointmentStatus.CONFIRMED }
            ],
            metadata: {
              patientId: user.userID,
              doctorId: appointment.doctorId,
              dateTime: appointment.dateTime.toISOString(),
            },
          }
        ).catch(err => console.error('Error logging audit:', err));
      }

      // Reload appointments to reflect the change
      await loadAppointments();
    } catch (error) {
      console.error('Error confirming appointment:', error);
      alert('Failed to confirm appointment. Please try again.');
    } finally {
      setConfirmingId(null);
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for comparison
    const aptDate = new Date(apt.dateTime);
    aptDate.setHours(0, 0, 0, 0);
    const isPast = aptDate < now || apt.dateTime < new Date();
    const isUpcoming = apt.dateTime >= new Date();

    if (filter === 'upcoming') {
      return (
        isUpcoming &&
        apt.status !== AppointmentStatus.COMPLETED &&
        apt.status !== AppointmentStatus.CANCELLED &&
        apt.status !== AppointmentStatus.NO_SHOW
      );
    }
    if (filter === 'past') {
      return (
        isPast ||
        apt.status === AppointmentStatus.COMPLETED ||
        apt.status === AppointmentStatus.CANCELLED ||
        apt.status === AppointmentStatus.NO_SHOW
      );
    }
    return true; // 'all'
  });

  // Group appointments by date
  const groupByDate = (appts: AppointmentWithDoctor[]) => {
    const groups: { [key: string]: AppointmentWithDoctor[] } = {};
    
    appts.forEach((apt) => {
      const date = apt.dateTime;
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let dateKey: string;
      const dateStr = date.toDateString();
      const todayStr = today.toDateString();
      const tomorrowStr = tomorrow.toDateString();
      
      if (dateStr === todayStr) {
        dateKey = 'Today';
      } else if (dateStr === tomorrowStr) {
        dateKey = 'Tomorrow';
      } else {
        dateKey = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        });
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(apt);
    });
    
    return groups;
  };

  const groupedAppointments = groupByDate(filteredAppointments);
  const dateKeys = Object.keys(groupedAppointments).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Tomorrow') return -1;
    if (b === 'Tomorrow') return 1;
    return new Date(groupedAppointments[b][0].dateTime).getTime() - 
           new Date(groupedAppointments[a][0].dateTime).getTime();
  });

  // Format time
  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  // Get status badge styling
  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'bg-green-50 text-green-700 border-green-100';
      case AppointmentStatus.SCHEDULED:
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case AppointmentStatus.COMPLETED:
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case AppointmentStatus.CANCELLED:
        return 'bg-red-50 text-red-700 border-red-100';
      case AppointmentStatus.NO_SHOW:
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  // Get status label
  const getStatusLabel = (status: AppointmentStatus): string => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'Confirmed';
      case AppointmentStatus.SCHEDULED:
        return 'Scheduled';
      case AppointmentStatus.COMPLETED:
        return 'Completed';
      case AppointmentStatus.CANCELLED:
        return 'Cancelled';
      case AppointmentStatus.NO_SHOW:
        return 'No Show';
      default:
        return status;
    }
  };

  // Get location text
  const getLocation = (apt: AppointmentWithDoctor): string => {
    // Check if notes indicate online/telemedicine
    if (apt.notes?.toLowerCase().includes('online') || 
        apt.notes?.toLowerCase().includes('telemedicine') ||
        apt.notes?.toLowerCase().includes('video')) {
      return 'Online Consultation';
    }
    return apt.doctor?.practiceInfo?.clinicAddress || 
           apt.doctor?.practiceInfo?.clinicName || 
           'Main Clinic';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading appointments..." />
      </div>
    );
  }

  const doctorName = (apt: AppointmentWithDoctor): string => {
    if (apt.doctor?.professionalInfo) {
      const { firstName, lastName, title } = apt.doctor.professionalInfo;
      const prefix = title || 'Dr.';
      return `${prefix} ${firstName} ${lastName}`.trim();
    }
    return apt.doctor?.displayName || 'Doctor';
  };

  const doctorSpecialization = (apt: AppointmentWithDoctor): string => {
    return apt.doctor?.professionalInfo?.specialization || 'General Practitioner';
  };

  return (
    <div className="relative min-h-screen w-full max-w-md mx-auto bg-[#f9fafb] shadow-2xl overflow-hidden flex flex-col pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-5 py-4 border-b border-[#e5e7eb]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-[#1f2937]">Appointments</h1>
          <div className="flex items-center gap-3">
            {/* Search Icon Button */}
            <button className="flex items-center justify-center size-10 rounded-full text-[#4b5563] hover:bg-gray-100 transition-colors">
              <span className="material-symbols-outlined">search</span>
            </button>
            {/* User Avatar */}
            <button
              onClick={() => navigate('/patient/profile')}
              className="size-10 rounded-full bg-gray-200 bg-center bg-cover border-2 border-white shadow-sm overflow-hidden"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="User profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Segmented Control / Filters */}
      <div className="px-5 py-3 bg-[#f9fafb] sticky top-[73px] z-10">
        <div className="flex p-1 bg-gray-200/50 rounded-xl">
          <label className="flex-1 cursor-pointer">
            <input
              checked={filter === 'upcoming'}
              onChange={() => setFilter('upcoming')}
              className="peer sr-only"
              name="filter"
              type="radio"
              value="upcoming"
            />
            <div
              className={`flex items-center justify-center py-2 px-3 text-sm font-semibold rounded-lg transition-all ${
                filter === 'upcoming'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-[#4b5563]'
              }`}
            >
              Upcoming
            </div>
          </label>
          <label className="flex-1 cursor-pointer">
            <input
              checked={filter === 'past'}
              onChange={() => setFilter('past')}
              className="peer sr-only"
              name="filter"
              type="radio"
              value="past"
            />
            <div
              className={`flex items-center justify-center py-2 px-3 text-sm font-semibold rounded-lg transition-all ${
                filter === 'past'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-[#4b5563]'
              }`}
            >
              Past
            </div>
          </label>
          <label className="flex-1 cursor-pointer">
            <input
              checked={filter === 'all'}
              onChange={() => setFilter('all')}
              className="peer sr-only"
              name="filter"
              type="radio"
              value="all"
            />
            <div
              className={`flex items-center justify-center py-2 px-3 text-sm font-semibold rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-[#4b5563]'
              }`}
            >
              All
            </div>
          </label>
        </div>
      </div>

      {/* Content List */}
      <main className="flex-1 overflow-y-auto px-5 pb-24 pt-2">
        {/* Pull to refresh indicator */}
        {refreshing && (
          <div className="flex justify-center py-2">
            <span className="material-symbols-outlined animate-spin text-primary">
              progress_activity
            </span>
          </div>
        )}

        {filteredAppointments.length > 0 ? (
          <div className="flex flex-col gap-4">
            {dateKeys.map((dateKey) => (
              <div key={dateKey}>
                {/* Date Header */}
                <h3 className="text-sm font-bold text-[#4b5563] uppercase tracking-wider mt-2 mb-1">
                  {dateKey}
                </h3>

                {/* Appointment Cards */}
                {groupedAppointments[dateKey].map((apt) => {
                  const isPast = apt.dateTime < new Date();
                  return (
                    <div
                      key={apt.appointmentId}
                      onClick={() => {
                        // Navigate to appointment details if you have that page
                        // navigate(`/patient/appointments/${apt.appointmentId}`);
                      }}
                      className={`group relative bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#e5e7eb] active:scale-[0.98] transition-all cursor-pointer ${
                        isPast ? 'opacity-70' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-4">
                          <div className="relative">
                            {apt.doctor?.photoURL ? (
                              <div
                                className="size-14 rounded-full bg-gray-100 bg-center bg-cover"
                                style={{
                                  backgroundImage: `url("${apt.doctor.photoURL}")`,
                                }}
                              />
                            ) : (
                              <div className="size-14 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-gray-400 text-2xl">
                                  person
                                </span>
                              </div>
                            )}
                            {apt.status === AppointmentStatus.CONFIRMED && (
                              <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-white size-4 rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-[#1f2937] leading-tight">
                              {doctorName(apt)}
                            </h3>
                            <p className="text-[#4b5563] text-sm font-medium">
                              {doctorSpecialization(apt)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                            apt.status
                          )}`}
                        >
                          {getStatusLabel(apt.status)}
                        </span>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-[#4b5563]">
                          <div className="flex items-center justify-center size-8 rounded-full bg-blue-50 text-primary shrink-0">
                            <span className="material-symbols-outlined text-[18px]">
                              calendar_clock
                            </span>
                          </div>
                          <span className="text-sm font-semibold">
                            {dateKey === 'Today' || dateKey === 'Tomorrow'
                              ? dateKey
                              : apt.dateTime.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                            , {formatTime(apt.dateTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[#4b5563]">
                          <div className="flex items-center justify-center size-8 rounded-full bg-gray-50 text-gray-400 shrink-0">
                            <span className="material-symbols-outlined text-[18px]">
                              {getLocation(apt).toLowerCase().includes('online')
                                ? 'videocam'
                                : 'location_on'}
                            </span>
                          </div>
                          <span className="text-sm truncate">{getLocation(apt)}</span>
                        </div>
                      </div>

                      {/* Confirm Button for Scheduled Appointments created by doctor (invitations) */}
                      {apt.status === AppointmentStatus.SCHEDULED && !isPast && apt.createdBy !== user?.userID && (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmAppointment(apt.appointmentId);
                            }}
                            disabled={confirmingId === apt.appointmentId}
                            className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {confirmingId === apt.appointmentId ? (
                              <>
                                <span className="material-symbols-outlined animate-spin text-[18px]">
                                  progress_activity
                                </span>
                                Confirming...
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                Confirm Appointment
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      <div className="absolute right-4 bottom-4 text-gray-300">
                        <span className="material-symbols-outlined">chevron_right</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="bg-blue-50 p-6 rounded-full mb-4">
              <span className="material-symbols-outlined text-4xl text-primary">event_busy</span>
            </div>
            <h3 className="text-lg font-bold text-[#1f2937] mb-2">
              {filter === 'upcoming'
                ? 'No upcoming appointments'
                : filter === 'past'
                ? 'No past appointments'
                : 'No appointments'}
            </h3>
            <p className="text-[#4b5563] text-sm max-w-[250px] mx-auto mb-6">
              {filter === 'upcoming'
                ? "You don't have any appointments scheduled at the moment."
                : filter === 'past'
                ? "You don't have any past appointments."
                : "You don't have any appointments."}
            </p>
            {filter === 'past' && (
              <button
                onClick={() => setFilter('upcoming')}
                className="px-6 py-2.5 rounded-xl bg-gray-100 text-[#1f2937] font-bold text-sm hover:bg-gray-200 transition-colors"
              >
                View Upcoming
              </button>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="absolute bottom-24 right-6 z-30">
        <button
          onClick={() => navigate('/patient/schedule-appointment')}
          aria-label="Schedule Appointment"
          className="flex items-center justify-center size-14 rounded-full bg-primary text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[32px]">add</span>
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Appointments;
