// src/pages/patient/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
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
      if (!user?.userId) return;
      
      try {
        // Get upcoming appointments
        const appointments = await appointmentService.getAppointmentsByPatient(user.userId);
        const upcoming = appointments
          .filter(apt => apt.status === AppointmentStatus.SCHEDULED || apt.status === AppointmentStatus.CONFIRMED)
          .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
          .slice(0, 3);
        setUpcomingAppointments(upcoming);

        // Get recent test results
        const testResults = await testResultService.getTestResultsByPatient(user.userId);
        setRecentTestResults(testResults.slice(0, 3));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Patient Dashboard</h1>

        {/* Upcoming Appointments */}
        <Card title="Upcoming Appointments">
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.map((apt) => (
                <div key={apt.appointmentId} className="border-b pb-4 last:border-0">
                  <p className="font-semibold">{new Date(apt.dateTime).toLocaleDateString()}</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {new Date(apt.dateTime).toLocaleTimeString()} - {apt.type}
                  </p>
                </div>
              ))}
              <Button onClick={() => navigate('/patient/appointments')} className="w-full">
                View All Appointments
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No upcoming appointments</p>
              <Button onClick={() => navigate('/patient/schedule-appointment')}>
                Schedule Appointment
              </Button>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={() => navigate('/patient/schedule-appointment')} className="h-20">
              Schedule Appointment
            </Button>
            <Button onClick={() => navigate('/patient/test-results')} className="h-20">
              Upload Test Results
            </Button>
            <Button onClick={() => navigate('/patient/timeline')} className="h-20">
              View Timeline
            </Button>
            <Button onClick={() => navigate('/patient/profile')} className="h-20">
              View Profile
            </Button>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Activity">
          <div className="space-y-4">
            {recentTestResults.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Recent Test Results</h3>
                {recentTestResults.map((result) => (
                  <div key={result.testResultId} className="border-b pb-2">
                      <p className="font-medium">{result.testInfo?.testName || 'Test Result'}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(result.fileInfo.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {recentTestResults.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

