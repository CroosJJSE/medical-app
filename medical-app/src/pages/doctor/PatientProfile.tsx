// src/pages/doctor/PatientProfile.tsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatient } from '@/hooks/usePatient';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import encounterService from '@/services/encounterService';
import * as testResultService from '@/services/testResultService';
import * as timelineService from '@/services/timelineService';
import type { Encounter } from '@/models/Encounter';
import type { TestResult } from '@/models/TestResult';
import type { Timeline } from '@/models/Timeline';

const PatientProfile: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { patient, loading } = usePatient(patientId || '', user?.userId);
  const [activeTab, setActiveTab] = useState<'timeline' | 'summary' | 'profile'>('timeline');
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [timeline, setTimeline] = useState<Timeline | null>(null);

  React.useEffect(() => {
    if (!patientId) return;

    const loadData = async () => {
      try {
        const [encs, tests, timelineData] = await Promise.all([
          encounterService.getEncountersByPatient(patientId),
          testResultService.getTestResultsByPatient(patientId),
          timelineService.getTimeline(patientId),
        ]);
        setEncounters(encs);
        setTestResults(tests);
        setTimeline(timelineData);
      } catch (error) {
        console.error('Error loading patient data:', error);
      }
    };

    loadData();
  }, [patientId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading patient profile..." />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <p className="text-red-500">Patient not found</p>
          <Button onClick={() => navigate('/doctor/patients')} className="mt-4">
            Back to Patients
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {patient.personalInfo?.firstName} {patient.personalInfo?.lastName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Patient ID: {patient.patientId}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/doctor/new-encounter?patientId=${patientId}`)}
            >
              New Encounter
            </Button>
            <Button variant="secondary" onClick={() => navigate('/doctor/patients')}>
              Back
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'timeline'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'summary'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'profile'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Profile
          </button>
        </div>

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <Card title="Timeline">
            {timeline && timeline.events.length > 0 ? (
              <div className="space-y-4">
                {timeline.events
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .map((event) => (
                    <div key={event.eventId} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                      {event.description && (
                        <p className="text-gray-700 dark:text-gray-300 mt-1">{event.description}</p>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No timeline events</p>
            )}
          </Card>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Diseases">
              <p className="text-gray-600 dark:text-gray-400">
                {patient.medicalInfo?.medicalHistory?.length || 0} conditions recorded
              </p>
            </Card>
            <Card title="Recent Vitals">
              <p className="text-gray-600 dark:text-gray-400">
                {encounters.length > 0 ? 'Available in encounters' : 'No vitals recorded'}
              </p>
            </Card>
            <Card title="Allergies">
              <p className="text-gray-600 dark:text-gray-400">
                {patient.medicalInfo?.allergies?.length || 0} allergies recorded
              </p>
            </Card>
            <Card title="Medications">
              <p className="text-gray-600 dark:text-gray-400">
                {patient.medicalInfo?.currentMedications?.length || 0} current medications
              </p>
            </Card>
            <Card title="Encounters">
              <p className="text-gray-600 dark:text-gray-400">
                {encounters.length} total encounters
              </p>
            </Card>
            <Card title="Test Results">
              <p className="text-gray-600 dark:text-gray-400">
                {testResults.length} test results uploaded
              </p>
            </Card>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <Card title="Personal Information">
              <div className="space-y-2">
                <p><strong>Name:</strong> {patient.personalInfo?.firstName} {patient.personalInfo?.lastName}</p>
                <p><strong>Date of Birth:</strong> {patient.personalInfo?.dateOfBirth ? new Date(patient.personalInfo.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Gender:</strong> {patient.personalInfo?.gender || 'N/A'}</p>
                <p><strong>Blood Type:</strong> {patient.personalInfo?.bloodType || 'N/A'}</p>
              </div>
            </Card>
            <Card title="Contact Information">
              <div className="space-y-2">
                <p><strong>Email:</strong> {patient.contactInfo?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {patient.contactInfo?.primaryPhone || 'N/A'}</p>
              </div>
            </Card>
            <Card title="Medical Information">
              <div className="space-y-2">
                <p><strong>Allergies:</strong> {patient.medicalInfo?.allergies?.length || 0}</p>
                <p><strong>Current Medications:</strong> {patient.medicalInfo?.currentMedications?.length || 0}</p>
                <p><strong>Medical History:</strong> {patient.medicalInfo?.medicalHistory?.length || 0}</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientProfile;

