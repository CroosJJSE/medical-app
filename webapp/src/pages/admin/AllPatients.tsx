// src/pages/admin/AllPatients.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import BackToDashboardButton from '@/components/common/BackToDashboardButton';
import Loading from '@/components/common/Loading';
import Input from '@/components/common/Input';
import patientService from '@/services/patientService';
import type { Patient } from '@/models/Patient';
import { UserRole } from '@/enums';

const AllPatients: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        // Get all patients (empty string means all patients for admin)
        const data = await patientService.getPatientsByDoctor('');
        // Filter out admin users - only show actual patients
        const actualPatients = data.filter(p => p.role === UserRole.PATIENT);
        setPatients(actualPatients);
        setFilteredPatients(actualPatients);
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

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
        patient.userID?.toLowerCase().includes(query) ||
        patient.contactInfo?.email?.toLowerCase().includes(query) ||
        patient.contactInfo?.primaryPhone?.toLowerCase().includes(query)
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
    <div className="min-h-screen bg-[#f5f7f8] p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">All Patients</h1>
          <BackToDashboardButton />
        </div>

        {/* Search */}
        <Card>
          <Input
            placeholder="Search by name, ID, email, or phone..."
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
          />
        </Card>

        {/* Patients Table */}
        <Card title={`Patients (${filteredPatients.length})`}>
          {filteredPatients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Patient ID</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Phone</th>
                    <th className="text-left p-2">Assigned Doctor</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.userID} className="border-b hover:bg-gray-50">
                      <td className="p-2">{patient.userID}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {patient.photoURL && (
                            <img
                              src={patient.photoURL}
                              alt={`${patient.personalInfo?.firstName} ${patient.personalInfo?.lastName}`}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <span>
                            {patient.personalInfo?.firstName} {patient.personalInfo?.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="p-2">{patient.contactInfo?.email || 'N/A'}</td>
                      <td className="p-2">{patient.contactInfo?.primaryPhone || 'N/A'}</td>
                      <td className="p-2">{patient.assignedDoctorId || 'Unassigned'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          patient.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : patient.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {patient.status || 'Inactive'}
                        </span>
                      </td>
                      <td className="p-2">
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/admin/patient-profile/${patient.userID}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No patients found</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AllPatients;


