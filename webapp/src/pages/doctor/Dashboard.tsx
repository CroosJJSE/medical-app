// src/pages/doctor/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/common/Loading';
import DoctorHeader from '@/components/layout/DoctorHeader';
import appointmentService from '@/services/appointmentService';
import patientService from '@/services/patientService';
import testResultRepo from '@/repositories/testResultRepository';
import type { Appointment } from '@/models/Appointment';
import type { Patient } from '@/models/Patient';
import type { Doctor } from '@/models/Doctor';
import { AppointmentStatus, AppointmentType } from '@/enums';
import { formatDateShort } from '@/utils/formatters';
import doctorService from '@/services/doctorService';

interface AppointmentWithPatient extends Appointment {
  patient?: Patient | null;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [todayAppointments, setTodayAppointments] = useState<AppointmentWithPatient[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingFollowUps: 0,
    pendingTestResults: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const doctorId = user?.userID || user?.userId;
      if (!doctorId) return;
      
      try {
        // Get doctor info
        const doctorData = await doctorService.getDoctor(doctorId);
        setDoctor(doctorData);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's appointments
        const appointments = await appointmentService.getAppointmentsByDoctor(doctorId, today, tomorrow);
        const todayApts = appointments.filter(apt => 
          apt.status === AppointmentStatus.SCHEDULED || apt.status === AppointmentStatus.CONFIRMED
        ).sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

        // Fetch patient data for appointments
        const appointmentsWithPatients = await Promise.all(
          todayApts.map(async (apt) => {
            try {
              const patient = await patientService.getPatient(apt.patientId);
              return { ...apt, patient };
            } catch {
              return { ...apt, patient: null };
            }
          })
        );

        setTodayAppointments(appointmentsWithPatients);

        // Get patients
        const patients = await patientService.getPatientsByDoctor(doctorId);
        // Sort by last visit (most recent first) - using updatedAt as proxy
        const sortedPatients = patients
          .sort((a, b) => {
            const dateA = a.updatedAt?.getTime() || 0;
            const dateB = b.updatedAt?.getTime() || 0;
            return dateB - dateA;
          })
          .slice(0, 4);
        setRecentPatients(sortedPatients);

        // Get pending test results (not confirmed) for this doctor
        const testResults = await testResultRepo.findByDoctor(doctorId);
        const pendingTestResults = testResults.filter(
          tr => !tr.extractedData?.confirmed
        );

        // Calculate pending follow-ups (TODO: implement based on encounters with follow-up dates)
        const pendingFollowUps = 0; // Placeholder

        setStats({
          totalPatients: patients.length,
          todayAppointments: todayApts.length,
          pendingFollowUps,
          pendingTestResults: pendingTestResults.length,
        });
      } catch (error) {
        console.error('[DOCTOR_DASHBOARD] Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getAppointmentTypeBadge = (type: AppointmentType) => {
    const badges = {
      [AppointmentType.CONSULTATION]: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-blue-700/10',
      [AppointmentType.FOLLOW_UP]: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-purple-700/10',
      [AppointmentType.CHECKUP]: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-blue-700/10',
      [AppointmentType.EMERGENCY]: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-red-600/10',
    };
    return badges[type] || badges[AppointmentType.CONSULTATION];
  };

  const getAppointmentTypeLabel = (type: AppointmentType) => {
    const labels = {
      [AppointmentType.CONSULTATION]: 'Consultation',
      [AppointmentType.FOLLOW_UP]: 'Follow-up',
      [AppointmentType.CHECKUP]: 'Check-up',
      [AppointmentType.EMERGENCY]: 'Urgent',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    const badges = {
      [AppointmentStatus.SCHEDULED]: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 ring-yellow-600/20',
      [AppointmentStatus.CONFIRMED]: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-green-600/20',
      [AppointmentStatus.COMPLETED]: 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-gray-500/10',
      [AppointmentStatus.CANCELLED]: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-red-600/20',
      [AppointmentStatus.NO_SHOW]: 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-gray-500/10',
    };
    return badges[status] || badges[AppointmentStatus.SCHEDULED];
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    const labels = {
      [AppointmentStatus.SCHEDULED]: 'Scheduled',
      [AppointmentStatus.CONFIRMED]: 'Confirmed',
      [AppointmentStatus.COMPLETED]: 'Completed',
      [AppointmentStatus.CANCELLED]: 'Cancelled',
      [AppointmentStatus.NO_SHOW]: 'No Show',
    };
    return labels[status] || status;
  };

  const formatAppointmentTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f8]">
        <Loading size={48} message="Loading dashboard..." />
      </div>
    );
  }

  const doctorName = doctor?.professionalInfo
    ? `${doctor.professionalInfo.title || ''} ${doctor.professionalInfo.firstName} ${doctor.professionalInfo.lastName}`.trim()
    : user?.displayName || 'Doctor';

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-[#f5f7f8]">
      {/* Header */}
      <DoctorHeader />

      {/* Main Content */}
      <main className="flex h-full grow flex-col">
        <div className="px-4 md:px-10 lg:px-20 py-8 flex justify-center">
          <div className="flex flex-col max-w-[1200px] flex-1 w-full">
            {/* Stats Section */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#111418] mb-2">
                {getGreeting()}, {doctor?.professionalInfo?.title || ''} {doctor?.professionalInfo?.lastName || user?.displayName?.split(' ')[0] || 'Doctor'}
              </h1>
              <p className="text-[#60708a] mb-6">Here's what's happening in your practice today.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stat 1 - Total Patients */}
                <div className="flex flex-col gap-3 rounded-xl p-5 bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center text-[#3c83f6]">
                      <span className="material-symbols-outlined">group</span>
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                  </div>
                  <div>
                    <p className="text-[#60708a] text-sm font-medium">Total Patients</p>
                    <p className="text-[#111418] text-2xl font-bold mt-1">{stats.totalPatients}</p>
                  </div>
                </div>

                {/* Stat 2 - Today's Appointments */}
                <div className="flex flex-col gap-3 rounded-xl p-5 bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                      <span className="material-symbols-outlined">calendar_month</span>
                    </div>
                    <span className="text-xs font-medium text-[#60708a]">Today</span>
                  </div>
                  <div>
                    <p className="text-[#60708a] text-sm font-medium">Appointments</p>
                    <p className="text-[#111418] text-2xl font-bold mt-1">{stats.todayAppointments}</p>
                  </div>
                </div>

                {/* Stat 3 - Pending Follow-ups */}
                <div className="flex flex-col gap-3 rounded-xl p-5 bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-full bg-orange-50 flex items-center justify-center text-[#f97316]">
                      <span className="material-symbols-outlined">phone_callback</span>
                    </div>
                    {stats.pendingFollowUps > 0 && (
                      <span className="text-xs font-medium text-[#f97316] bg-orange-50 px-2 py-1 rounded-full">Action Needed</span>
                    )}
                  </div>
                  <div>
                    <p className="text-[#60708a] text-sm font-medium">Pending Follow-ups</p>
                    <p className="text-[#111418] text-2xl font-bold mt-1">{stats.pendingFollowUps}</p>
                  </div>
                </div>

                {/* Stat 4 - Pending Test Results */}
                <div className="flex flex-col gap-3 rounded-xl p-5 bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-full bg-red-50 flex items-center justify-center text-[#ef4444]">
                      <span className="material-symbols-outlined">science</span>
                    </div>
                    {stats.pendingTestResults > 0 && (
                      <span className="text-xs font-medium text-[#ef4444] bg-red-50 px-2 py-1 rounded-full">Review</span>
                    )}
                  </div>
                  <div>
                    <p className="text-[#60708a] text-sm font-medium">Test Results</p>
                    <p className="text-[#111418] text-2xl font-bold mt-1">{stats.pendingTestResults}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Section */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[#111418] text-xl font-bold leading-tight">Today's Schedule</h2>
                <button
                  onClick={() => navigate('/doctor/appointments')}
                  className="text-[#3c83f6] text-sm font-bold hover:underline"
                >
                  View Calendar
                </button>
              </div>
              {todayAppointments.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#60708a] uppercase tracking-wider w-[120px]">Time</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#60708a] uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#60708a] uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#60708a] uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-[#60708a] uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {todayAppointments.map((apt) => {
                        const patient = apt.patient;
                        const patientName = patient?.personalInfo
                          ? `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`
                          : 'Unknown Patient';
                        const patientId = patient?.userID || apt.patientId;

                        return (
                          <tr key={apt.appointmentId} className="group hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="text-[#111418] text-sm font-semibold">
                                {formatAppointmentTime(apt.dateTime)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {patient?.photoURL ? (
                                  <div
                                    className="bg-center bg-no-repeat bg-cover rounded-full size-10"
                                    style={{ backgroundImage: `url("${patient.photoURL}")` }}
                                  />
                                ) : (
                                  <div className="bg-gray-300 rounded-full size-10 flex items-center justify-center text-gray-600 font-semibold">
                                    {patientName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="text-[#111418] text-sm font-medium">{patientName}</p>
                                  <p className="text-[#60708a] text-xs">ID: {patientId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getAppointmentTypeBadge(apt.type)}`}>
                                {getAppointmentTypeLabel(apt.type)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadge(apt.status)}`}>
                                <span className="size-1.5 rounded-full bg-current mr-1.5"></span>
                                {getStatusLabel(apt.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {apt.status === AppointmentStatus.CONFIRMED || apt.status === AppointmentStatus.SCHEDULED ? (
                                <button
                                  onClick={() => navigate(`/doctor/new-encounter?appointmentId=${apt.appointmentId}&patientId=${apt.patientId}`)}
                                  className="bg-[#3c83f6] hover:bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
                                >
                                  <span>Start Encounter</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => navigate(`/doctor/patient-profile/${apt.patientId}`)}
                                  className="bg-white border border-gray-300 text-[#111418] hover:bg-gray-50 text-sm font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
                                >
                                  <span>View Patient</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 text-center">
                  <p className="text-[#60708a]">No appointments scheduled for today</p>
                </div>
              )}
            </div>

            {/* Recent Patients Section */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[#111418] text-xl font-bold leading-tight">Recent Patients</h2>
                <button
                  onClick={() => navigate('/doctor/patients')}
                  className="text-[#3c83f6] text-sm font-bold hover:underline"
                >
                  View All Patients
                </button>
              </div>
              {recentPatients.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recentPatients.map((patient) => {
                    const patientName = patient.personalInfo
                      ? `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`
                      : 'Unknown Patient';
                    const lastVisit = patient.updatedAt ? formatDateShort(patient.updatedAt) : 'N/A';

                    return (
                      <div
                        key={patient.userID}
                        className="flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:border-[#3c83f6]/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/doctor/patient-profile/${patient.userID}`)}
                      >
                        {patient.photoURL ? (
                          <div
                            className="bg-center bg-no-repeat bg-cover rounded-full size-16"
                            style={{ backgroundImage: `url("${patient.photoURL}")` }}
                          />
                        ) : (
                          <div className="bg-gray-300 rounded-full size-16 flex items-center justify-center text-gray-600 font-bold text-lg">
                            {patientName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="text-center">
                          <h3 className="text-[#111418] font-bold text-base">{patientName}</h3>
                          <p className="text-[#60708a] text-sm">Last Visit: {lastVisit}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/doctor/patient-profile/${patient.userID}`);
                          }}
                          className="w-full mt-2 text-[#3c83f6] text-sm font-bold py-2 rounded-lg bg-[#3c83f6]/10 hover:bg-[#3c83f6]/20 transition-colors"
                        >
                          Profile
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 text-center">
                  <p className="text-[#60708a]">No patients assigned yet</p>
                </div>
              )}
            </div>

            {/* Quick Actions Section */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={() => navigate('/doctor/appointments')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-[#111418] font-bold text-sm transition-colors"
              >
                <span className="material-symbols-outlined">calendar_month</span>
                View All Appointments
              </button>
              <button
                onClick={() => navigate('/doctor/patients')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-[#111418] font-bold text-sm transition-colors"
              >
                <span className="material-symbols-outlined">group</span>
                View All Patients
              </button>
              <button
                onClick={() => navigate('/doctor/test-results-review')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#3c83f6] hover:bg-blue-600 text-white font-bold text-sm transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined">science</span>
                Review Test Results
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
