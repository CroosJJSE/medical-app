// src/pages/doctor/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import appointmentService from '@/services/appointmentService';
import patientService from '@/services/patientService';
import encounterService from '@/services/encounterService';
import type { Appointment } from '@/models/Appointment';
import type { Patient } from '@/models/Patient';
import { AppointmentStatus } from '@/enums';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingFollowUps: 0,
    pendingTestResults: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.userId) return;
      
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's appointments
        const appointments = await appointmentService.getAppointmentsByDoctor(user.userId, today, tomorrow);
        const todayApts = appointments.filter(apt => 
          apt.status === AppointmentStatus.SCHEDULED || apt.status === AppointmentStatus.CONFIRMED
        );
        setTodayAppointments(todayApts);

        // Get patients
        const patients = await patientService.getPatientsByDoctor(user.userId);
        setRecentPatients(patients.slice(0, 5));
        setStats({
          totalPatients: patients.length,
          todayAppointments: todayApts.length,
          pendingFollowUps: 0, // TODO: Calculate from encounters
          pendingTestResults: 0, // TODO: Calculate from test results
        });
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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Doctor Dashboard</h1>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Patients</p>
            <p className="text-3xl font-bold">{stats.totalPatients}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 dark:text-gray-400">Today's Appointments</p>
            <p className="text-3xl font-bold">{stats.todayAppointments}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Follow-ups</p>
            <p className="text-3xl font-bold">{stats.pendingFollowUps}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Test Results</p>
            <p className="text-3xl font-bold">{stats.pendingTestResults}</p>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card title="Today's Schedule">
          {todayAppointments.length > 0 ? (
            <div className="space-y-4">
              {todayAppointments.map((apt) => (
                <div
                  key={apt.appointmentId}
                  className="border rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => navigate(`/doctor/patient-profile/${apt.patientId}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {new Date(apt.dateTime).toLocaleTimeString()} - {apt.type}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">Patient ID: {apt.patientId}</p>
                      {apt.reason && (
                        <p className="text-sm text-gray-500 mt-1">Reason: {apt.reason}</p>
                      )}
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/doctor/new-encounter?appointmentId=${apt.appointmentId}`);
                      }}
                    >
                      Start Encounter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No appointments scheduled for today</p>
          )}
        </Card>

        {/* Recent Patients */}
        <Card title="Recent Patients">
          {recentPatients.length > 0 ? (
            <div className="space-y-2">
              {recentPatients.map((patient) => (
                <div
                  key={patient.patientId}
                  className="border rounded p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => navigate(`/doctor/patient-profile/${patient.patientId}`)}
                >
                  <p className="font-semibold">
                    {patient.personalInfo?.firstName} {patient.personalInfo?.lastName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ID: {patient.patientId}
                  </p>
                </div>
              ))}
              <Button
                onClick={() => navigate('/doctor/patients')}
                variant="secondary"
                className="w-full mt-4"
              >
                View All Patients
              </Button>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No patients assigned yet</p>
          )}
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={() => navigate('/doctor/patients')} className="h-20">
              View Patients
            </Button>
            <Button onClick={() => navigate('/doctor/appointments')} className="h-20">
              View Appointments
            </Button>
            <Button onClick={() => navigate('/doctor/test-results-review')} className="h-20">
              Review Test Results
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;


