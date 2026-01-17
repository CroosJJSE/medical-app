// src/pages/doctor/PatientProfile.tsx
import DoctorHeader from '@/components/layout/DoctorHeader';
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
import { convertToDate, formatDateLong, formatDateShort } from '@/utils/formatters';
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
    <div className="min-h-screen bg-[#f5f7f8] flex flex-col">
      <DoctorHeader />
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {patient.personalInfo?.firstName} {patient.personalInfo?.lastName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Patient ID: {patient.userID}</p>
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
          <div className="space-y-6">
            {/* Encounters Section */}
            {encounters.length > 0 && (
              <Card title="Encounters">
                <div className="space-y-4">
                  {encounters
                    .sort((a, b) => {
                      const dateA = convertToDate(a.encounterDate) || new Date(0);
                      const dateB = convertToDate(b.encounterDate) || new Date(0);
                      return dateB.getTime() - dateA.getTime();
                    })
                    .map((encounter) => {
                      const encounterDate = convertToDate(encounter.encounterDate);
                      const createdDate = convertToDate(encounter.createdAt);
                      
                      return (
                        <div key={encounter.encounterId} className="border-l-4 border-purple-500 pl-4 py-3 bg-white rounded-r-lg shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-purple-600 text-lg">medical_services</span>
                                <p className="font-semibold text-gray-900">
                                  Encounter - {encounterDate ? formatDateLong(encounterDate) : 'Date not available'}
                                </p>
                              </div>
                              {encounter.subjective?.chiefComplaint && (
                                <p className="text-sm text-gray-700 mb-1">
                                  <span className="font-medium">Chief Complaint:</span> {encounter.subjective.chiefComplaint}
                                </p>
                              )}
                              {encounter.assessment?.differentialDiagnosis && encounter.assessment.differentialDiagnosis.length > 0 && (
                                <p className="text-sm text-gray-700 mb-1">
                                  <span className="font-medium">Diagnosis:</span> {encounter.assessment.differentialDiagnosis.join(', ')}
                                </p>
                              )}
                              {encounter.plan?.medications && encounter.plan.medications.length > 0 && (
                                <p className="text-sm text-gray-700 mb-1">
                                  <span className="font-medium">Medications:</span> {encounter.plan.medications.length} prescribed
                                </p>
                              )}
                              {createdDate && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {createdDate.toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              )}
                            </div>
                            {encounter.prescriptionPdfUrl && (
                              <a
                                href={encounter.prescriptionPdfUrl}
                                download
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(encounter.prescriptionPdfUrl, '_blank');
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm ml-2"
                                title="Download Prescription PDF"
                              >
                                <span className="material-symbols-outlined text-sm">download</span>
                                <span>PDF</span>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}

            {/* Timeline Events */}
            <Card title="Timeline Events">
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
          </div>
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
    </div>
  );
};

export default PatientProfile;

