// src/pages/patient/Profile.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePatient } from '@/hooks/usePatient';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import Input from '@/components/common/Input';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { patient, loading, updatePatient } = usePatient(user?.userId || '', user?.userId);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  React.useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.personalInfo?.firstName || '',
        lastName: patient.personalInfo?.lastName || '',
        email: patient.contactInfo?.email || '',
        primaryPhone: patient.contactInfo?.primaryPhone || '',
      });
    }
  }, [patient]);

  const handleSave = async () => {
    try {
      await updatePatient({
        personalInfo: {
          ...patient?.personalInfo,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        contactInfo: {
          ...patient?.contactInfo,
          email: formData.email,
          primaryPhone: formData.primaryPhone,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading profile..." />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <p className="text-red-500">Patient profile not found</p>
          <Button onClick={() => navigate('/patient/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Profile</h1>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </div>

        <Card title="Personal Information">
          {isEditing ? (
            <div className="space-y-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Phone"
                value={formData.primaryPhone}
                onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
              />
              <div className="flex gap-4">
                <Button onClick={handleSave}>Save Changes</Button>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p><strong>Patient ID:</strong> {patient.patientId}</p>
              <p><strong>Name:</strong> {patient.personalInfo?.firstName} {patient.personalInfo?.lastName}</p>
              <p><strong>Date of Birth:</strong> {patient.personalInfo?.dateOfBirth ? new Date(patient.personalInfo.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Gender:</strong> {patient.personalInfo?.gender || 'N/A'}</p>
              <p><strong>Blood Type:</strong> {patient.personalInfo?.bloodType || 'N/A'}</p>
              <p><strong>Email:</strong> {patient.contactInfo?.email || 'N/A'}</p>
              <p><strong>Phone:</strong> {patient.contactInfo?.primaryPhone || 'N/A'}</p>
            </div>
          )}
        </Card>

        <Card title="Medical Information">
          <div className="space-y-2">
            <p><strong>Allergies:</strong> {patient.medicalInfo?.allergies?.length || 0} recorded</p>
            <p><strong>Current Medications:</strong> {patient.medicalInfo?.currentMedications?.length || 0}</p>
            <p><strong>Medical History:</strong> {patient.medicalInfo?.medicalHistory?.length || 0} conditions</p>
          </div>
        </Card>

        <Button onClick={() => navigate('/patient/dashboard')} variant="secondary">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Profile;

