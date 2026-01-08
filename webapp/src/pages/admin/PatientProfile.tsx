// src/pages/admin/PatientProfile.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import BackToDashboardButton from '@/components/common/BackToDashboardButton';
import patientService from '@/services/patientService';
import doctorService from '@/services/doctorService';
import encounterService from '@/services/encounterService';
import * as testResultService from '@/services/testResultService';
import * as timelineService from '@/services/timelineService';
import type { Patient } from '@/models/Patient';
import type { Doctor } from '@/models/Doctor';
import type { Encounter } from '@/models/Encounter';
import type { TestResult } from '@/models/TestResult';
import type { Timeline } from '@/models/Timeline';

const AdminPatientProfile: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'summary' | 'profile'>('timeline');
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [activeDoctors, setActiveDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [assigningDoctor, setAssigningDoctor] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!patientId) return;
      
      setLoading(true);
      try {
        // Load patient
        const patientData = await patientService.getPatient(patientId);
        if (!patientData) {
          setLoading(false);
          return;
        }
        setPatient(patientData);
        setSelectedDoctorId(patientData.assignedDoctorId || '');

        // Load related data
        const [encs, tests, timelineData, doctors] = await Promise.all([
          encounterService.getEncountersByPatient(patientId),
          testResultService.getTestResultsByPatient(patientId),
          timelineService.getTimeline(patientId),
          doctorService.getDoctors(),
        ]);
        
        setEncounters(encs);
        setTestResults(tests);
        setTimeline(timelineData);
        
        // Filter active doctors
        const active = doctors.filter(
          (doc) => doc.status === 'active' && doc.isApproved
        );
        setActiveDoctors(active);

        // Load current assigned doctor info
        if (patientData.assignedDoctorId) {
          const doctor = await doctorService.getDoctor(patientData.assignedDoctorId);
          setCurrentDoctor(doctor);
        }
      } catch (error) {
        console.error('Error loading patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [patientId]);

  const handleAssignDoctor = async () => {
    if (!patientId || !selectedDoctorId || !user) {
      alert('Please select a doctor to assign');
      return;
    }

    setAssigningDoctor(true);
    try {
      const adminUserID = user.userID || user.userId || 'admin';
      await patientService.assignPrimaryDoctor(patientId, selectedDoctorId, adminUserID);
      
      // Reload patient and doctor data
      const updatedPatient = await patientService.getPatient(patientId);
      if (updatedPatient) {
        setPatient(updatedPatient);
        const doctor = await doctorService.getDoctor(selectedDoctorId);
        setCurrentDoctor(doctor);
      }
      
      alert('Doctor assigned successfully!');
    } catch (error: any) {
      console.error('Error assigning doctor:', error);
      alert(`Error assigning doctor: ${error?.message || 'Unknown error'}`);
    } finally {
      setAssigningDoctor(false);
    }
  };

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
          <Button onClick={() => navigate('/admin/patients')} className="mt-4">
            Back to Patients
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f8] p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-gray-500 text-sm font-medium hover:text-gray-700"
          >
            Dashboard
          </button>
          <span className="text-gray-500 text-sm font-medium">/</span>
          <button
            onClick={() => navigate('/admin/patients')}
            className="text-gray-500 text-sm font-medium hover:text-gray-700"
          >
            Patients
          </button>
          <span className="text-gray-500 text-sm font-medium">/</span>
          <span className="text-gray-900 text-sm font-medium">Profile</span>
        </div>

        {/* Header */}
        <div className="flex flex-wrap justify-between gap-3 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {patient.personalInfo?.firstName} {patient.personalInfo?.lastName}
            </h1>
            <p className="text-gray-600 mt-1">Patient ID: {patient.userID}</p>
          </div>
          <BackToDashboardButton />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b bg-white rounded-t-lg px-6">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeTab === 'timeline'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeTab === 'summary'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
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
                      <p className="text-sm text-gray-600">
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                      {event.description && (
                        <p className="text-gray-700 mt-1">{event.description}</p>
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
              <p className="text-gray-600">
                {patient.medicalInfo?.medicalHistory?.length || 0} conditions recorded
              </p>
            </Card>
            <Card title="Recent Vitals">
              <p className="text-gray-600">
                {encounters.length > 0 ? 'Available in encounters' : 'No vitals recorded'}
              </p>
            </Card>
            <Card title="Allergies">
              <p className="text-gray-600">
                {patient.medicalInfo?.allergies?.length || 0} allergies recorded
              </p>
            </Card>
            <Card title="Medications">
              <p className="text-gray-600">
                {patient.medicalInfo?.currentMedications?.length || 0} current medications
              </p>
            </Card>
            <Card title="Encounters">
              <p className="text-gray-600">
                {encounters.length} total encounters
              </p>
            </Card>
            <Card title="Test Results">
              <p className="text-gray-600">
                {testResults.length} test results uploaded
              </p>
            </Card>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Doctor Assignment Section */}
            <Card title="Doctor Assignment">
              <div className="space-y-4">
                {/* Current Doctor */}
                {currentDoctor ? (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Currently Assigned Doctor</p>
                    <p className="font-semibold text-lg text-gray-900">
                      {currentDoctor.displayName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {currentDoctor.professionalInfo?.specialization || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Doctor ID: {currentDoctor.userID}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">No doctor assigned</p>
                  </div>
                )}

                {/* Doctor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentDoctor ? 'Reassign Doctor' : 'Assign Doctor'}
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 text-sm"
                    >
                      <option value="">Select Doctor...</option>
                      {activeDoctors.map((doctor) => (
                        <option key={doctor.userID} value={doctor.userID}>
                          {doctor.displayName} - {doctor.professionalInfo?.specialization || 'N/A'}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={handleAssignDoctor}
                      disabled={!selectedDoctorId || assigningDoctor || selectedDoctorId === patient.assignedDoctorId}
                      className="px-6"
                    >
                      {assigningDoctor ? 'Assigning...' : currentDoctor ? 'Reassign' : 'Assign'}
                    </Button>
                  </div>
                  {activeDoctors.length === 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      No active doctors available.
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Personal Information */}
            <Card title="Personal Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">
                    {patient.personalInfo?.firstName} {patient.personalInfo?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium text-gray-900">
                    {patient.personalInfo?.dateOfBirth 
                      ? new Date(patient.personalInfo.dateOfBirth).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium text-gray-900">
                    {patient.personalInfo?.gender || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Blood Type</p>
                  <p className="font-medium text-gray-900">
                    {patient.personalInfo?.bloodType || 'N/A'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Contact Information */}
            <Card title="Contact Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">
                    {patient.contactInfo?.email || patient.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">
                    {patient.contactInfo?.primaryPhone || 'N/A'}
                  </p>
                </div>
                {patient.contactInfo?.address && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">
                      {patient.contactInfo.address}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Medical Information */}
            <Card title="Medical Information">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Allergies</p>
                  <p className="font-medium text-gray-900">
                    {patient.medicalInfo?.allergies?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Medications</p>
                  <p className="font-medium text-gray-900">
                    {patient.medicalInfo?.currentMedications?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Medical History</p>
                  <p className="font-medium text-gray-900">
                    {patient.medicalInfo?.medicalHistory?.length || 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPatientProfile;


