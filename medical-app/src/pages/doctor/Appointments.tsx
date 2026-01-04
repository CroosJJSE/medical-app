// src/pages/doctor/Appointments.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import appointmentService from '@/services/appointmentService';
import type { Appointment } from '@/models/Appointment';
import { AppointmentStatus } from '@/enums';

const Appointments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AppointmentStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  useEffect(() => {
    const loadAppointments = async () => {
      if (!user?.userId) return;
      
      try {
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        if (dateFilter === 'today') {
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
        } else if (dateFilter === 'week') {
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 7);
        } else if (dateFilter === 'month') {
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 1);
        }

        const data = await appointmentService.getAppointmentsByDoctor(
          user.userId,
          startDate,
          endDate
        );
        setAppointments(data.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()));
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [user, dateFilter]);

  const filteredAppointments = filter === 'all'
    ? appointments
    : appointments.filter(apt => apt.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading appointments..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Appointments</h1>
          <Button variant="secondary" onClick={() => navigate('/doctor/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <div className="flex gap-2">
                <Button
                  variant={dateFilter === 'today' ? 'primary' : 'secondary'}
                  onClick={() => setDateFilter('today')}
                >
                  Today
                </Button>
                <Button
                  variant={dateFilter === 'week' ? 'primary' : 'secondary'}
                  onClick={() => setDateFilter('week')}
                >
                  This Week
                </Button>
                <Button
                  variant={dateFilter === 'month' ? 'primary' : 'secondary'}
                  onClick={() => setDateFilter('month')}
                >
                  This Month
                </Button>
                <Button
                  variant={dateFilter === 'all' ? 'primary' : 'secondary'}
                  onClick={() => setDateFilter('all')}
                >
                  All
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'primary' : 'secondary'}
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === AppointmentStatus.SCHEDULED ? 'primary' : 'secondary'}
                  onClick={() => setFilter(AppointmentStatus.SCHEDULED)}
                >
                  Scheduled
                </Button>
                <Button
                  variant={filter === AppointmentStatus.COMPLETED ? 'primary' : 'secondary'}
                  onClick={() => setFilter(AppointmentStatus.COMPLETED)}
                >
                  Completed
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Appointments List */}
        <Card title={`Appointments (${filteredAppointments.length})`}>
          {filteredAppointments.length > 0 ? (
            <div className="space-y-4">
              {filteredAppointments.map((apt) => (
                <div
                  key={apt.appointmentId}
                  className="border rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">
                        {new Date(apt.dateTime).toLocaleDateString()} at{' '}
                        {new Date(apt.dateTime).toLocaleTimeString()}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Patient ID: {apt.patientId} | Type: {apt.type}
                      </p>
                      {apt.reason && (
                        <p className="text-sm text-gray-500 mt-1">Reason: {apt.reason}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => navigate(`/doctor/patient-profile/${apt.patientId}`)}
                        variant="secondary"
                      >
                        View Patient
                      </Button>
                      {apt.status === AppointmentStatus.SCHEDULED && (
                        <Button
                          onClick={() => navigate(`/doctor/new-encounter?appointmentId=${apt.appointmentId}`)}
                        >
                          Start Encounter
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No appointments found</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Appointments;

