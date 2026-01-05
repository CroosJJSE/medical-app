// src/pages/doctor/NewEncounter.tsx
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import EncounterForm from '@/components/forms/EncounterForm';
import { useAuth } from '@/hooks/useAuth';

const NewEncounter: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const patientId = searchParams.get('patientId');

  const handleSuccess = () => {
    if (patientId) {
      navigate(`/doctor/patient-profile/${patientId}`);
    } else {
      navigate('/doctor/dashboard');
    }
  };

  if (!user?.userId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">New Clinical Encounter</h1>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>

        <Card>
          <EncounterForm
            patientId={patientId || ''}
            doctorId={user.userId}
            appointmentId={appointmentId || undefined}
            onSuccess={handleSuccess}
          />
        </Card>
      </div>
    </div>
  );
};

export default NewEncounter;

