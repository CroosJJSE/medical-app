// src/pages/admin/AllDoctors.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import BackToDashboardButton from '@/components/common/BackToDashboardButton';
import Loading from '@/components/common/Loading';
import Input from '@/components/common/Input';
import doctorService from '@/services/doctorService';
import type { Doctor } from '@/models/Doctor';

const AllDoctors: React.FC = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const data = await doctorService.getDoctors();
        setDoctors(data);
        setFilteredDoctors(data);
      } catch (error) {
        console.error('Error loading doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredDoctors(doctors);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = doctors.filter(
      (doctor) =>
        doctor.professionalInfo?.firstName?.toLowerCase().includes(query) ||
        doctor.professionalInfo?.lastName?.toLowerCase().includes(query) ||
        doctor.userID?.toLowerCase().includes(query) ||
        doctor.professionalInfo?.specialization?.toLowerCase().includes(query) ||
        doctor.contactInfo?.email?.toLowerCase().includes(query)
    );
    setFilteredDoctors(filtered);
  }, [searchQuery, doctors]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading doctors..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f8] p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">All Doctors</h1>
          <BackToDashboardButton />
        </div>

        {/* Search */}
        <Card>
          <Input
            placeholder="Search by name, ID, specialization, or email..."
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
          />
        </Card>

        {/* Doctors Table */}
        <Card title={`Doctors (${filteredDoctors.length})`}>
          {filteredDoctors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Doctor ID</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Specialization</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">License Number</th>
                    <th className="text-left p-2">Patients</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor.userID} className="border-b hover:bg-gray-50">
                      <td className="p-2">{doctor.userID}</td>
                      <td className="p-2">
                        {doctor.professionalInfo?.title} {doctor.professionalInfo?.firstName}{' '}
                        {doctor.professionalInfo?.lastName}
                      </td>
                      <td className="p-2">{doctor.professionalInfo?.specialization || 'N/A'}</td>
                      <td className="p-2">{doctor.contactInfo?.email || 'N/A'}</td>
                      <td className="p-2">{doctor.professionalInfo?.licenseNumber || 'N/A'}</td>
                      <td className="p-2">{doctor.assignedPatients?.length || 0}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          doctor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {doctor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-2">
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/admin/doctor/${doctor.userID}`)}
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
            <p className="text-gray-500 text-center py-8">No doctors found</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AllDoctors;


