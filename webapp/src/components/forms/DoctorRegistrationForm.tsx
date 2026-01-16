// src/components/forms/DoctorRegistrationForm.tsx
import React, { useState } from 'react';
import { Doctor } from '@/models/Doctor';
import doctorService from '@/services/doctorService';
import { DayOfWeek } from '@/enums';
import Button from '../common/Button';
import Input from '../common/Input';

interface DoctorFormProps {
  userId: string;
  onSuccess?: () => void;
}

const DoctorRegistrationForm: React.FC<DoctorFormProps> = ({ userId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctorData, setDoctorData] = useState<Partial<Doctor>>({
    professionalInfo: {} as any,
    contactInfo: {} as any,
    practiceInfo: {} as any,
    availability: { workingDays: [], workingHours: { start: '', end: '' }, timeSlots: [], timeZone: '' } as any,
  });

  const handleChange = (section: string, field: string, value: any) => {
    setDoctorData((prev) => ({
      ...prev,
      [section]: { ...(prev[section as keyof Doctor] as any) || {}, [field]: value },
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await doctorService.createDoctor(userId, doctorData as Doctor);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to register doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4">
      <h2>Professional Info</h2>
      <Input label="First Name" value={doctorData.professionalInfo?.firstName || ''} onChange={(value) => handleChange('professionalInfo', 'firstName', value)} required />
      <Input label="Last Name" value={doctorData.professionalInfo?.lastName || ''} onChange={(value) => handleChange('professionalInfo', 'lastName', value)} required />
      <Input label="Title" value={doctorData.professionalInfo?.title || ''} onChange={(value) => handleChange('professionalInfo', 'title', value)} />
      <Input label="Specialization" value={doctorData.professionalInfo?.specialization || ''} onChange={(value) => handleChange('professionalInfo', 'specialization', value)} />
      <Input label="Qualifications (comma separated)" value={doctorData.professionalInfo?.qualifications?.join(', ') || ''} onChange={(value) => handleChange('professionalInfo', 'qualifications', value.split(',').map((s) => s.trim()))} />
      <Input label="License Number" value={doctorData.professionalInfo?.licenseNumber || ''} onChange={(value) => handleChange('professionalInfo', 'licenseNumber', value)} />

      <h2>Practice Info</h2>
      <Input label="Clinic Name" value={doctorData.practiceInfo?.clinicName || ''} onChange={(value) => handleChange('practiceInfo', 'clinicName', value)} />
      <Input label="Clinic Address" value={doctorData.practiceInfo?.clinicAddress || ''} onChange={(value) => handleChange('practiceInfo', 'clinicAddress', value)} />
      <Input label="Consultation Fee" type="number" value={String(doctorData.practiceInfo?.consultationFee || '')} onChange={(value) => handleChange('practiceInfo', 'consultationFee', value ? Number(value) : undefined)} />
      <Input label="Currency" value={doctorData.practiceInfo?.currency || 'USD'} onChange={(value) => handleChange('practiceInfo', 'currency', value)} />

      <h2>Availability</h2>
      <Input label="Working Days (select multiple comma separated)" value={doctorData.availability?.workingDays?.join(', ') || ''} onChange={(value) => handleChange('availability', 'workingDays', value.split(',').map((s) => s.trim()))} />
      <Input label="Working Hours Start (HH:mm)" value={doctorData.availability?.workingHours?.start || ''} onChange={(value) => handleChange('availability', 'workingHours', { ...doctorData.availability?.workingHours, start: value } as any)} />
      <Input label="Working Hours End (HH:mm)" value={doctorData.availability?.workingHours?.end || ''} onChange={(value) => handleChange('availability', 'workingHours', { ...doctorData.availability?.workingHours, end: value } as any)} />
      <Input label="Time Slots (comma separated minutes)" value={doctorData.availability?.timeSlots?.join(', ') || ''} onChange={(value) => handleChange('availability', 'timeSlots', value.split(',').map((s) => s.trim()).map(s => Number(s)).filter(n => !isNaN(n)))} />
      <Input label="Time Zone" value={doctorData.availability?.timeZone || ''} onChange={(value) => handleChange('availability', 'timeZone', value)} />

      {error && <p className="text-red-500">{error}</p>}
      <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</Button>
    </form>
  );
};

export default DoctorRegistrationForm;
