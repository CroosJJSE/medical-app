// src/components/forms/AppointmentForm.tsx
import React, { useState, useEffect } from 'react';
import { Appointment } from '@/models/Appointment';
import { AppointmentType } from '@/enums';
import appointmentService from '@/services/appointmentService';
import { Patient } from '@/models/Patient';
import { Doctor } from '@/models/Doctor';
import Button from '../common/Button';
import Input from '../common/Input';

interface AppointmentFormProps {
  patientId: string;
  doctorId?: string;
  onSuccess?: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ patientId, doctorId, onSuccess }) => {
  const [appointmentData, setAppointmentData] = useState<Partial<Appointment>>({
    patientId,
    doctorId: doctorId || '',
    duration: 30,
    type: AppointmentType.CONSULTATION,
    reason: '',
  });
  const [dateTimeString, setDateTimeString] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);

  const handleChange = (field: string, value: any) => {
    setAppointmentData((prev) => ({ ...prev, [field]: value }));
  };

  const checkAvailability = async () => {
    if (!appointmentData.doctorId || !dateTimeString) return;
    const isAvailable = await appointmentService.checkAvailability(
      appointmentData.doctorId,
      new Date(dateTimeString),
      appointmentData.duration || 30
    );
    setAvailable(isAvailable);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await appointmentService.createAppointment({
        ...appointmentData,
        dateTime: new Date(dateTimeString),
      } as Omit<Appointment, 'appointmentId' | 'createdAt' | 'updatedAt'>);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAvailability();
  }, [appointmentData.doctorId, dateTimeString]);

  return (
    <form className="space-y-4">
      <Input label="Date & Time" type="datetime-local" value={dateTimeString} onChange={(value) => setDateTimeString(value)} />
      <Input label="Duration (minutes)" type="number" value={String(appointmentData.duration || 30)} onChange={(value) => handleChange('duration', Number(value))} />
      <Input label="Type" type="select" value={appointmentData.type || AppointmentType.CONSULTATION} onChange={(value) => handleChange('type', value as AppointmentType)} options={Object.values(AppointmentType)} />
      <Input label="Reason" value={appointmentData.reason || ''} onChange={(value) => handleChange('reason', value)} />

      {available !== null && (
        <p className={`text-sm ${available ? 'text-green-500' : 'text-red-500'}`}>
          {available ? 'Doctor is available' : 'Doctor is not available'}
        </p>
      )}
      {error && <p className="text-red-500">{error}</p>}
      <Button onClick={handleSubmit} disabled={loading || !available}>
        {loading ? 'Booking...' : 'Book Appointment'}
      </Button>
    </form>
  );
};

export default AppointmentForm;
