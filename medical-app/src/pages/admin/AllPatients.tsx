// src/pages/admin/AllPatients.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import Input from '@/components/common/Input';
import patientService from '@/services/patientService';
import type { Patient } from '@/models/Patient';

const AllPatients: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        // TODO: Implement getAllPatients in patientService
        const data: Patient[] = []; // Placeholder
        setPatients(data);
        setFilteredPatients(data);
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">All Patients</h1>
          <Button variant="secondary" onClick={() => navigate('/admin/dashboard')}>
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
                    <tr key={patient.patientId} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-2">{patient.patientId}</td>
                      <td className="p-2">
                        {patient.personalInfo?.firstName} {patient.personalInfo?.lastName}
                      </td>
                      <td className="p-2">{patient.contactInfo?.email || 'N/A'}</td>
                      <td className="p-2">{patient.contactInfo?.primaryPhone || 'N/A'}</td>
                      <td className="p-2">{patient.assignedDoctorId || 'Unassigned'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          patient.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {patient.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-2">
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/admin/patient/${patient.patientId}`)}
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

