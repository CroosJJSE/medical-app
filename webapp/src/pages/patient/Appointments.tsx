// src/pages/patient/Appointments.tsx
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

  useEffect(() => {
    const loadAppointments = async () => {
      if (!user?.userId) return;
      
      try {
        const data = await appointmentService.getAppointmentsByPatient(user.userId);
        setAppointments(data.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime()));
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [user]);

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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Appointments</h1>
          <Button onClick={() => navigate('/patient/schedule-appointment')}>
            Schedule New Appointment
          </Button>
        </div>

        {/* Filter */}
        <Card>
          <div className="flex gap-4">
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
            <Button
              variant={filter === AppointmentStatus.CANCELLED ? 'primary' : 'secondary'}
              onClick={() => setFilter(AppointmentStatus.CANCELLED)}
            >
              Cancelled
            </Button>
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
                        Type: {apt.type} | Status: {apt.status}
                      </p>
                      {apt.reason && (
                        <p className="text-sm text-gray-500 mt-2">Reason: {apt.reason}</p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-sm ${
                        apt.status === AppointmentStatus.COMPLETED
                          ? 'bg-green-100 text-green-800'
                          : apt.status === AppointmentStatus.CANCELLED
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No appointments found</p>
              <Button onClick={() => navigate('/patient/schedule-appointment')}>
                Schedule Your First Appointment
              </Button>
            </div>
          )}
        </Card>

        <Button onClick={() => navigate('/patient/dashboard')} variant="secondary">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Appointments;


