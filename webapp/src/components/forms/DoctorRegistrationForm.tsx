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
      <Input label="First Name" value={doctorData.professionalInfo?.firstName || ''} onChange={(e) => handleChange('professionalInfo', 'firstName', e.target.value)} required />
      <Input label="Last Name" value={doctorData.professionalInfo?.lastName || ''} onChange={(e) => handleChange('professionalInfo', 'lastName', e.target.value)} required />
      <Input label="Title" value={doctorData.professionalInfo?.title || ''} onChange={(e) => handleChange('professionalInfo', 'title', e.target.value)} />
      <Input label="Specialization" value={doctorData.professionalInfo?.specialization || ''} onChange={(e) => handleChange('professionalInfo', 'specialization', e.target.value)} />
      <Input label="Qualifications (comma separated)" value={doctorData.professionalInfo?.qualifications?.join(', ') || ''} onChange={(e) => handleChange('professionalInfo', 'qualifications', e.target.value.split(',').map((s) => s.trim()))} />
      <Input label="License Number" value={doctorData.professionalInfo?.licenseNumber || ''} onChange={(e) => handleChange('professionalInfo', 'licenseNumber', e.target.value)} />
      <Input label="License Expiry" type="date" value={doctorData.professionalInfo?.licenseExpiry || ''} onChange={(e) => handleChange('professionalInfo', 'licenseExpiry', e.target.value)} />

      <h2>Practice Info</h2>
      <Input label="Clinic Name" value={doctorData.practiceInfo?.clinicName || ''} onChange={(e) => handleChange('practiceInfo', 'clinicName', e.target.value)} />
      <Input label="Clinic Address" value={doctorData.practiceInfo?.clinicAddress || ''} onChange={(e) => handleChange('practiceInfo', 'clinicAddress', e.target.value)} />
      <Input label="Consultation Fee" type="number" value={doctorData.practiceInfo?.consultationFee || ''} onChange={(e) => handleChange('practiceInfo', 'consultationFee', e.target.value)} />
      <Input label="Currency" value={doctorData.practiceInfo?.currency || 'USD'} onChange={(e) => handleChange('practiceInfo', 'currency', e.target.value)} />

      <h2>Availability</h2>
      <Input label="Working Days (select multiple comma separated)" value={doctorData.availability?.workingDays?.join(', ') || ''} onChange={(e) => handleChange('availability', 'workingDays', e.target.value.split(',').map((s) => s.trim()))} />
      <Input label="Working Hours" value={doctorData.availability?.workingHours || ''} onChange={(e) => handleChange('availability', 'workingHours', e.target.value)} />
      <Input label="Time Slots (comma separated)" value={doctorData.availability?.timeSlots?.join(', ') || ''} onChange={(e) => handleChange('availability', 'timeSlots', e.target.value.split(',').map((s) => s.trim()))} />
      <Input label="Time Zone" value={doctorData.availability?.timeZone || ''} onChange={(e) => handleChange('availability', 'timeZone', e.target.value)} />

      {error && <p className="text-red-500">{error}</p>}
      <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</Button>
    </form>
  );
};

export default DoctorRegistrationForm;
