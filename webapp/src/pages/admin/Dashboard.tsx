// src/pages/admin/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from '@/components/common/Loading';
import AdminHeader from '@/components/layout/AdminHeader';
import patientService from '@/services/patientService';
import doctorService from '@/services/doctorService';
import { getPendingApprovals } from '@/repositories/pendingApprovalRepository';
import type { PendingUserInfo } from '@/repositories/pendingApprovalRepository';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    pendingApprovals: 0,
  });
  const [pendingUsers, setPendingUsers] = useState<PendingUserInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get pending approvals from pending_approval collection
        const pendingData = await getPendingApprovals();
        const allPending = [...pendingData.patients, ...pendingData.doctors];
        setPendingUsers(allPending.slice(0, 5)); // Show first 5

        // Get counts
        const patients = await patientService.getPatientsByDoctor(''); // Get all patients
        const doctors = await doctorService.getDoctors();
        
        setStats({
          totalPatients: patients.length,
          totalDoctors: doctors.length,
          totalAppointments: 0, // TODO: Get all appointments count
          pendingApprovals: allPending.length,
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
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f8]">
        <Loading size={48} message="Loading dashboard..." />
      </div>
    );
  }

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toISOString().split('T')[0];
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-[#f5f7f8] overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <AdminHeader />
        <main className="flex-1 p-6 lg:p-10">
          <div className="layout-content-container flex flex-col max-w-7xl mx-auto w-full gap-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <p className="text-gray-600 text-sm font-medium leading-normal">Total Patients</p>
                <p className="text-gray-900 tracking-tight text-3xl font-bold leading-tight">
                  {stats.totalPatients.toLocaleString()}
                </p>
              </div>
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <p className="text-gray-600 text-sm font-medium leading-normal">Total Doctors</p>
                <p className="text-gray-900 tracking-tight text-3xl font-bold leading-tight">
                  {stats.totalDoctors.toLocaleString()}
                </p>
              </div>
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <p className="text-gray-600 text-sm font-medium leading-normal">Appointments This Month</p>
                <p className="text-gray-900 tracking-tight text-3xl font-bold leading-tight">
                  {stats.totalAppointments.toLocaleString()}
                </p>
              </div>
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-orange-200 bg-white shadow-sm">
                <p className="text-orange-600 text-sm font-medium leading-normal">Pending Approvals</p>
                <p className="text-orange-600 tracking-tight text-3xl font-bold leading-tight">
                  {stats.pendingApprovals.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Pending Approvals Table */}
            <div className="flex flex-col gap-4">
              <h2 className="text-gray-900 text-xl font-bold leading-tight tracking-tight">
                Pending Approvals
              </h2>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  {pendingUsers.length > 0 ? (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Registration Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {pendingUsers.map((user) => (
                          <tr
                            key={user.userID}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                {user.photoURL ? (
                                  <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10"
                                    style={{ backgroundImage: `url(${user.photoURL})` }}
                                    title={user.name}
                                  />
                                ) : (
                                  <div className="bg-gray-300 rounded-full w-10 h-10 flex items-center justify-center text-gray-600 font-semibold">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-sm font-medium text-gray-900">{user.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              #{user.userID}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.registeredAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => navigate(`/admin/approvals?userID=${user.userID}`)}
                                className="h-9 px-4 flex items-center justify-center rounded-lg bg-[#3c83f6] text-white text-sm font-semibold hover:bg-[#3c83f6]/90 transition-colors"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-gray-500">No pending approvals</div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-4">
              <h2 className="text-gray-900 text-xl font-bold leading-tight tracking-tight">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <button
                  onClick={() => navigate('/admin/approvals')}
                  className="flex flex-col items-center justify-center gap-3 rounded-xl p-6 border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:border-[#3c83f6] transition-all duration-300 group"
                >
                  <div className="flex items-center justify-center size-12 rounded-full bg-[#3c83f6]/10 text-[#3c83f6] group-hover:bg-[#3c83f6] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">person_check</span>
                  </div>
                  <p className="text-gray-700 text-sm font-semibold leading-normal">User Approvals</p>
                </button>
                <button
                  onClick={() => navigate('/admin/patients')}
                  className="flex flex-col items-center justify-center gap-3 rounded-xl p-6 border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:border-[#3c83f6] transition-all duration-300 group"
                >
                  <div className="flex items-center justify-center size-12 rounded-full bg-[#3c83f6]/10 text-[#3c83f6] group-hover:bg-[#3c83f6] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">groups</span>
                  </div>
                  <p className="text-gray-700 text-sm font-semibold leading-normal">All Patients</p>
                </button>
                <button
                  onClick={() => navigate('/admin/doctors')}
                  className="flex flex-col items-center justify-center gap-3 rounded-xl p-6 border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:border-[#3c83f6] transition-all duration-300 group"
                >
                  <div className="flex items-center justify-center size-12 rounded-full bg-[#3c83f6]/10 text-[#3c83f6] group-hover:bg-[#3c83f6] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">medical_services</span>
                  </div>
                  <p className="text-gray-700 text-sm font-semibold leading-normal">All Doctors</p>
                </button>
                <button
                  onClick={() => navigate('/admin/reports')}
                  className="flex flex-col items-center justify-center gap-3 rounded-xl p-6 border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:border-[#3c83f6] transition-all duration-300 group"
                >
                  <div className="flex items-center justify-center size-12 rounded-full bg-[#3c83f6]/10 text-[#3c83f6] group-hover:bg-[#3c83f6] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">bar_chart</span>
                  </div>
                  <p className="text-gray-700 text-sm font-semibold leading-normal">Reports</p>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

