// src/pages/patient/ScheduleAppointment.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Loading from '@/components/common/Loading';
import AppointmentForm from '@/components/forms/AppointmentForm';
import doctorService from '@/services/doctorService';
import type { Doctor } from '@/models/Doctor';

const ScheduleAppointment: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const data = await doctorService.getDoctors();
        setDoctors(data.filter(d => d.isActive));
        if (data.length > 0) {
          setSelectedDoctorId(data[0].doctorId);
        }
      } catch (error) {
        console.error('Error loading doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  const handleSuccess = () => {
    navigate('/patient/appointments');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Schedule Appointment
          </h1>
          <Button variant="secondary" onClick={() => navigate('/patient/appointments')}>
            Back
          </Button>
        </div>

        <Card>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Doctor</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            >
              {doctors.map((doctor) => (
                <option key={doctor.doctorId} value={doctor.doctorId}>
                  {doctor.professionalInfo?.title} {doctor.professionalInfo?.firstName}{' '}
                  {doctor.professionalInfo?.lastName} - {doctor.professionalInfo?.specialization}
                </option>
              ))}
            </select>
          </div>

          {selectedDoctorId && (
            <AppointmentForm
              patientId={user?.userId || ''}
              doctorId={selectedDoctorId}
              onSuccess={handleSuccess}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default ScheduleAppointment;


