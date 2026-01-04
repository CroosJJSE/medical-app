// src/pages/admin/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import * as userService from '@/services/userService';
import patientService from '@/services/patientService';
import doctorService from '@/services/doctorService';
import appointmentService from '@/services/appointmentService';
import { UserStatus, UserRole } from '@/enums';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    pendingApprovals: 0,
  });
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get all users with pending status
        // Note: This is a simplified version - you may need to adjust based on your userService implementation
        const pending = []; // TODO: Get pending users from userService
        setPendingUsers(pending.slice(0, 5));

        // Get counts
        const patients = await patientService.getPatientsByDoctor(''); // TODO: Get all patients
        const doctors = await doctorService.getDoctors();
        
        setStats({
          totalPatients: patients.length,
          totalDoctors: doctors.length,
          totalAppointments: 0, // TODO: Get all appointments count
          pendingApprovals: pending.length,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Admin Dashboard</h1>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Patients</p>
            <p className="text-3xl font-bold">{stats.totalPatients}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Doctors</p>
            <p className="text-3xl font-bold">{stats.totalDoctors}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 dark:text-gray-400">Appointments (This Month)</p>
            <p className="text-3xl font-bold">{stats.totalAppointments}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approvals</p>
            <p className="text-3xl font-bold text-orange-600">{stats.pendingApprovals}</p>
          </Card>
        </div>

        {/* Pending Approvals */}
        <Card title="Pending Approvals">
          {pendingUsers.length > 0 ? (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div key={user.userId} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{user.displayName || user.email}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Role: {user.role} | Email: {user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        Registered: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <Button onClick={() => navigate(`/admin/approvals?userId=${user.userId}`)}>
                      Review
                    </Button>
                  </div>
                </div>
              ))}
              <Button onClick={() => navigate('/admin/approvals')} variant="secondary" className="w-full">
                View All Pending Approvals
              </Button>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No pending approvals</p>
          )}
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button onClick={() => navigate('/admin/approvals')} className="h-20">
              User Approvals
            </Button>
            <Button onClick={() => navigate('/admin/patients')} className="h-20">
              All Patients
            </Button>
            <Button onClick={() => navigate('/admin/doctors')} className="h-20">
              All Doctors
            </Button>
            <Button onClick={() => navigate('/admin/reports')} className="h-20" variant="secondary">
              Reports
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

