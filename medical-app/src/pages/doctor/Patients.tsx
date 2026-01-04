// src/pages/doctor/Patients.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import Input from '@/components/common/Input';
import patientService from '@/services/patientService';
import type { Patient } from '@/models/Patient';

const Patients: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatients = async () => {
      if (!user?.userId) return;
      
      try {
        const data = await patientService.getPatientsByDoctor(user.userId);
        setPatients(data);
        setFilteredPatients(data);
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [user]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredPatients(patients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = patients.filter(
      (patient) =>
        patient.personalInfo?.firstName?.toLowerCase().includes(query) ||
        patient.personalInfo?.lastName?.toLowerCase().includes(query) ||
        patient.patientId.toLowerCase().includes(query) ||
        patient.contactInfo?.email?.toLowerCase().includes(query)
    );
    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading patients..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Patients</h1>
          <Button variant="secondary" onClick={() => navigate('/doctor/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {/* Search */}
        <Card>
          <Input
            placeholder="Search by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Card>

        {/* Patients List */}
        <Card title={`Patients (${filteredPatients.length})`}>
          {filteredPatients.length > 0 ? (
            <div className="space-y-4">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.patientId}
                  className="border rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => navigate(`/doctor/patient-profile/${patient.patientId}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">
                        {patient.personalInfo?.firstName} {patient.personalInfo?.lastName}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Patient ID: {patient.patientId}
                      </p>
                      <p className="text-sm text-gray-500">
                        {patient.contactInfo?.email} | {patient.contactInfo?.primaryPhone}
                      </p>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/doctor/patient-profile/${patient.patientId}`);
                      }}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery ? 'No patients found matching your search' : 'No patients assigned yet'}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Patients;

