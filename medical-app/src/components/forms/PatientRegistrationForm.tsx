// src/components/forms/PatientRegistrationForm.tsx
import React, { useState } from 'react';
import { Patient } from '@/models/Patient';
import { Gender, BloodType, MaritalStatus } from '@/enums';
import patientService from '@/services/patientService';
import Button from '../common/Button';
import Input from '../common/Input';

interface PatientFormProps {
  userId: string;
  onSuccess?: () => void;
}

const PatientRegistrationForm: React.FC<PatientFormProps> = ({ userId, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<Partial<Patient>>({});

  const handleChange = (section: string, field: string, value: any) => {
    setPatientData((prev) => ({
      ...prev,
      [section]: { ...(prev[section as keyof Patient] as any) || {}, [field]: value },
    }));
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await patientService.createPatient(userId, patientData as Patient);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    // Step 0: Personal Info
    <div key="personal">
      <Input label="First Name" value={patientData.personalInfo?.firstName || ''} onChange={(value) => handleChange('personalInfo', 'firstName', value)} required />
      <Input label="Last Name" value={patientData.personalInfo?.lastName || ''} onChange={(value) => handleChange('personalInfo', 'lastName', value)} required />
      <Input label="Date of Birth" type="date" value={patientData.personalInfo?.dateOfBirth ? new Date(patientData.personalInfo.dateOfBirth).toISOString().split('T')[0] : ''} onChange={(value) => handleChange('personalInfo', 'dateOfBirth', value ? new Date(value) : undefined)} required />
      <Input label="Gender" type="select" value={patientData.personalInfo?.gender || ''} onChange={(value) => handleChange('personalInfo', 'gender', value)} options={Object.values(Gender)} required />
      <Input label="Blood Type" type="select" value={patientData.personalInfo?.bloodType || ''} onChange={(value) => handleChange('personalInfo', 'bloodType', value)} options={Object.values(BloodType)} />
      <Input label="Marital Status" type="select" value={patientData.personalInfo?.maritalStatus || ''} onChange={(value) => handleChange('personalInfo', 'maritalStatus', value)} options={Object.values(MaritalStatus)} />
    </div>,

    // Step 1: Contact Info
    <div key="contact">
      <Input label="Primary Phone" value={patientData.contactInfo?.primaryPhone || ''} onChange={(value) => handleChange('contactInfo', 'primaryPhone', value)} required />
      <Input label="Secondary Phone" value={patientData.contactInfo?.secondaryPhone || ''} onChange={(value) => handleChange('contactInfo', 'secondaryPhone', value)} />
      <Input label="Email" value={patientData.contactInfo?.email || ''} onChange={(value) => handleChange('contactInfo', 'email', value)} />
      <Input label="Address" value={patientData.contactInfo?.address || ''} onChange={(value) => handleChange('contactInfo', 'address', value)} />
    </div>,

    // Step 2: Emergency Contact
    <div key="emergency">
      <Input label="Name" value={patientData.emergencyContact?.name || ''} onChange={(value) => handleChange('emergencyContact', 'name', value)} />
      <Input label="Phone" value={patientData.emergencyContact?.phone || ''} onChange={(value) => handleChange('emergencyContact', 'phone', value)} />
      <Input label="Relation" value={patientData.emergencyContact?.relationship || ''} onChange={(value) => handleChange('emergencyContact', 'relationship', value)} />
    </div>,

    // Step 3: Medical Info
    <div key="medical">
      <Input label="Allergies" value={patientData.medicalInfo?.allergies?.join(', ') || ''} onChange={(value) => handleChange('medicalInfo', 'allergies', value.split(',').map((s: string) => s.trim()))} />
      <Input label="Current Medications" value={patientData.medicalInfo?.currentMedications?.join(', ') || ''} onChange={(value) => handleChange('medicalInfo', 'currentMedications', value.split(',').map((s: string) => s.trim()))} />
      <Input label="Medical History" value={patientData.medicalInfo?.medicalHistory?.join(', ') || ''} onChange={(value) => handleChange('medicalInfo', 'medicalHistory', value.split(',').map((s: string) => s.trim()))} />
    </div>,

    // Step 4: Insurance / Pharmacy
    <div key="insurance">
      <Input label="Insurance Info" value={patientData.insuranceInfo?.provider || ''} onChange={(value) => handleChange('insuranceInfo', 'provider', value)} />
      <Input label="Pharmacy Info" value={patientData.pharmacyInfo?.pharmacyName || ''} onChange={(value) => handleChange('pharmacyInfo', 'pharmacyName', value)} />
    </div>,

    // Step 5: Guardian Info
    <div key="guardian">
      <Input label="Guardian Name" value={patientData.guardianInfo?.name || ''} onChange={(value) => handleChange('guardianInfo', 'name', value)} />
      <Input label="Guardian Phone" value={patientData.guardianInfo?.phone || ''} onChange={(value) => handleChange('guardianInfo', 'phone', value)} />
      <Input label="Guardian Relation" value={patientData.guardianInfo?.relationship || ''} onChange={(value) => handleChange('guardianInfo', 'relationship', value)} />
    </div>,
  ];

  return (
    <form className="space-y-4">
      {steps[step]}
      {error && <p className="text-red-500">{error}</p>}
      <div className="flex space-x-2">
        {step > 0 && <Button onClick={prevStep}>Previous</Button>}
        {step < steps.length - 1 ? (
          <Button onClick={nextStep}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </Button>
        )}
      </div>
    </form>
  );
};

export default PatientRegistrationForm;
