// src/pages/patient/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/common/Loading';
import BottomNavigation from '@/components/layout/BottomNavigation';
import appointmentService from '@/services/appointmentService';
import * as testResultService from '@/services/testResultService';
import type { Appointment } from '@/models/Appointment';
import type { TestResult } from '@/models/TestResult';
import { AppointmentStatus } from '@/enums';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentTestResults, setRecentTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const userId = user?.userID || user?.userId;
      if (!userId) return;
      
      try {
        // Get upcoming appointments
        const appointments = await appointmentService.getAppointmentsByPatient(userId);
        const upcoming = appointments
          .filter(apt => apt.status === AppointmentStatus.SCHEDULED || apt.status === AppointmentStatus.CONFIRMED)
          .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
          .slice(0, 5);
        setUpcomingAppointments(upcoming);

        // Get recent test results
        const testResults = await testResultService.getTestResultsByPatient(userId);
        setRecentTestResults(testResults.slice(0, 3));
      } catch (error) {
        console.error('[PATIENT_DASHBOARD] Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading dashboard..." />
      </div>
    );
  }

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  // Get next appointment info
  const nextAppointment = upcomingAppointments[0];
  const pendingTestResults = recentTestResults.filter(
    (result) => !result.reviewedBy || !result.reviewedAt
  );

  // Get user's first name for greeting
  const firstName = user?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="relative flex flex-col min-h-screen w-full max-w-md mx-auto bg-white shadow-2xl pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-white/95 backdrop-blur-sm px-5 py-3 border-b border-gray-200 transition-all">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined filled text-xl">medical_services</span>
          </div>
          <h1 className="text-[#1f2937] text-xl font-extrabold tracking-tight leading-tight">
            CareSync
          </h1>
        </div>
        <button
          onClick={() => navigate('/patient/profile')}
          className="relative flex items-center justify-center rounded-full overflow-hidden w-10 h-10 border-2 border-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {user?.photoURL ? (
            <img
              alt={`Profile photo of ${user.displayName}`}
              className="w-full h-full object-cover"
              src={user.photoURL}
            />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold">
              {firstName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white transform translate-x-px -translate-y-px"></span>
        </button>
      </header>

      {/* Greeting Section */}
      <div className="px-5 pt-6 pb-2">
        <p className="text-[#4b5563] text-sm font-medium mb-0.5">
          {formatDate(new Date())}
        </p>
        <h2 className="text-[#1f2937] text-3xl font-bold leading-tight tracking-tight">
          {getGreeting()}, <br />
          <span className="text-primary">{firstName}.</span>
        </h2>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-4 px-5 py-4">
        {/* Upcoming Appointments Card */}
        <div
          onClick={() => navigate('/patient/appointments')}
          className="flex flex-col justify-between p-4 rounded-xl bg-[#f9fafb] hover:bg-gray-100 transition-colors group cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined filled">calendar_clock</span>
            </div>
            {nextAppointment && (
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
                Soon
              </span>
            )}
          </div>
          <div>
            <p className="text-2xl font-bold text-[#1f2937] mb-0.5">
              {upcomingAppointments.length}
            </p>
            <p className="text-sm font-medium text-[#4b5563]">Upcoming</p>
            {nextAppointment && (
              <p className="text-xs text-[#4b5563] mt-1">
                Next: {formatTime(nextAppointment.dateTime)}
              </p>
            )}
          </div>
        </div>

        {/* Test Results Pending Card */}
        <div
          onClick={() => navigate('/patient/test-results')}
          className="flex flex-col justify-between p-4 rounded-xl bg-[#f9fafb] hover:bg-gray-100 transition-colors group cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-orange-500 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined filled">biotech</span>
            </div>
            {pendingTestResults.length > 0 && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
            )}
          </div>
          <div>
            <p className="text-2xl font-bold text-[#1f2937] mb-0.5">
              {pendingTestResults.length}
            </p>
            <p className="text-sm font-medium text-[#4b5563]">Results Pending</p>
            {pendingTestResults.length > 0 && (
              <p className="text-xs text-[#4b5563] mt-1">
                {pendingTestResults[0].fileInfo?.fileName || 'Blood Work'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-[#1f2937] leading-tight">
            Quick Actions
          </h3>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => navigate('/patient/schedule-appointment')}
            className="flex flex-col items-center justify-center min-w-[100px] gap-2 p-3 rounded-xl bg-primary text-white shadow-lg shadow-primary/30 active:scale-95 transition-transform flex-1"
          >
            <span className="material-symbols-outlined">calendar_add_on</span>
            <span className="text-xs font-bold text-center leading-tight">
              Schedule<br />Appointment
            </span>
          </button>
          <button
            onClick={() => navigate('/patient/test-results')}
            className="flex flex-col items-center justify-center min-w-[100px] gap-2 p-3 rounded-xl bg-[#f9fafb] text-[#1f2937] active:scale-95 transition-transform border border-[#e5e7eb] hover:border-gray-300 flex-1"
          >
            <span className="material-symbols-outlined text-primary">upload_file</span>
            <span className="text-xs font-bold text-center leading-tight">
              Upload<br />Test Results
            </span>
          </button>
          <button
            onClick={() => navigate('/patient/timeline')}
            className="flex flex-col items-center justify-center min-w-[100px] gap-2 p-3 rounded-xl bg-[#f9fafb] text-[#1f2937] active:scale-95 transition-transform border border-[#e5e7eb] hover:border-gray-300 flex-1"
          >
            <span className="material-symbols-outlined text-primary">history</span>
            <span className="text-xs font-bold text-center leading-tight">
              View<br />Timeline
            </span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="flex flex-col px-5 pt-2 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#1f2937] leading-tight">
            Recent Activity
          </h3>
          <button
            onClick={() => navigate('/patient/timeline')}
            className="text-sm font-semibold text-primary hover:text-blue-600 transition-colors"
          >
            View All
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.slice(0, 3).map((apt) => (
              <div
                key={apt.appointmentId}
                onClick={() => navigate('/patient/appointments')}
                className="flex items-center p-3 rounded-xl border border-[#e5e7eb] bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="relative flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                  <span className="material-symbols-outlined text-xl">edit_calendar</span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1f2937] truncate">
                    Appointment {apt.status === AppointmentStatus.CONFIRMED ? 'Confirmed' : 'Scheduled'}
                  </p>
                  <p className="text-xs text-[#4b5563] truncate">
                    {formatDate(apt.dateTime)} at {formatTime(apt.dateTime)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-xs font-medium text-[#4b5563]">
                    {(() => {
                      const now = new Date();
                      const aptDate = apt.dateTime;
                      const diffMs = aptDate.getTime() - now.getTime();
                      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      if (diffDays === 0) return 'Today';
                      if (diffDays === 1) return 'Tomorrow';
                      if (diffDays < 7) return `${diffDays}d ago`;
                      return formatDate(aptDate);
                    })()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-[#4b5563]">
              <p className="text-sm">No recent appointments</p>
            </div>
          )}

          {recentTestResults.length > 0 &&
            recentTestResults.slice(0, 2).map((result) => (
              <div
                key={result.testResultId}
                onClick={() => navigate('/patient/test-results')}
                className="flex items-center p-3 rounded-xl border border-[#e5e7eb] bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="relative flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-purple-100 text-purple-600">
                  <span className="material-symbols-outlined text-xl">visibility</span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1f2937] truncate">
                    Viewed Test Results
                  </p>
                  <p className="text-xs text-[#4b5563] truncate">
                    {result.fileInfo?.fileName || 'Test Result'}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-xs font-medium text-[#4b5563]">
                    {(() => {
                      const now = new Date();
                      const uploadDate = result.fileInfo?.uploadDate || new Date();
                      const diffMs = now.getTime() - uploadDate.getTime();
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                      if (diffHours < 1) return 'Just now';
                      if (diffHours < 24) return `${diffHours}h ago`;
                      const diffDays = Math.floor(diffHours / 24);
                      if (diffDays === 1) return '1d ago';
                      return `${diffDays}d ago`;
                    })()}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Dashboard;

