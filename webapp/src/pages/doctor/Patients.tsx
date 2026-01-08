// src/pages/doctor/Patients.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/common/Loading';
import DoctorHeader from '@/components/layout/DoctorHeader';
import patientService from '@/services/patientService';
import type { Patient } from '@/models/Patient';
import { formatDateShort, formatPhone } from '@/utils/formatters';

type StatusFilter = 'all' | 'active' | 'pending' | 'critical';

const Patients: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const loadPatients = async () => {
      const doctorId = user?.userID || user?.userId;
      if (!doctorId) return;
      
      try {
        const data = await patientService.getPatientsByDoctor(doctorId);
        // Sort by last visit (most recent first)
        const sorted = data.sort((a, b) => {
          const dateA = a.updatedAt?.getTime() || 0;
          const dateB = b.updatedAt?.getTime() || 0;
          return dateB - dateA;
        });
        setPatients(sorted);
        setFilteredPatients(sorted);
      } catch (error) {
        console.error('[DOCTOR_PATIENTS] Error loading patients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [user]);

  useEffect(() => {
    let filtered = [...patients];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (patient) => {
          const firstName = patient.personalInfo?.firstName?.toLowerCase() || '';
          const lastName = patient.personalInfo?.lastName?.toLowerCase() || '';
          const patientId = patient.userID?.toLowerCase() || '';
          const phone = patient.contactInfo?.primaryPhone?.toLowerCase() || '';
          const email = patient.contactInfo?.email?.toLowerCase() || '';
          
          return firstName.includes(query) ||
                 lastName.includes(query) ||
                 patientId.includes(query) ||
                 phone.includes(query) ||
                 email.includes(query);
        }
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      // For now, we'll use a simple heuristic:
      // - active: approved and active status
      // - pending: pending status
      // - critical: could be based on recent encounters or test results (simplified for now)
      filtered = filtered.filter((patient) => {
        if (statusFilter === 'active') {
          return patient.isApproved && patient.status === 'active';
        } else if (statusFilter === 'pending') {
          return patient.status === 'pending' || !patient.isApproved;
        } else if (statusFilter === 'critical') {
          // Placeholder - could check for critical test results or urgent conditions
          return false; // For now, no critical patients
        }
        return true;
      });
    }

    setFilteredPatients(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, statusFilter, patients]);

  const getPatientStatus = (patient: Patient): { label: string; color: string } => {
    if (patient.status === 'pending' || !patient.isApproved) {
      return { label: 'Pending', color: 'orange' };
    }
    if (patient.status === 'active' && patient.isApproved) {
      return { label: 'Active', color: 'green' };
    }
    // Placeholder for critical - could be enhanced with actual logic
    return { label: 'Active', color: 'green' };
  };

  const getStatusBadge = (status: { label: string; color: string }) => {
    const colors = {
      green: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-500/20',
      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
      red: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20',
    };
    const dotColors = {
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[status.color as keyof typeof colors]}`}>
        <span className={`size-1.5 rounded-full ${dotColors[status.color as keyof typeof dotColors]}`}></span>
        {status.label}
      </span>
    );
  };

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f8]">
        <Loading size={48} message="Loading patients..." />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f5f7f8]">
      {/* Header */}
      <DoctorHeader />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        <div className="w-full bg-white z-10 border-b border-slate-200 shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Patient List</h2>
                <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                  Total Patients: <span className="font-semibold text-slate-900">{filteredPatients.length}</span>
                  {patients.length > 0 && (
                    <>
                      <span className="size-1 rounded-full bg-slate-300"></span>
                      <span className="text-green-600 font-medium">+{Math.floor(patients.length * 0.01)} this week</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full lg:max-w-md group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#3c83f6] transition-colors">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3c83f6]/50 focus:border-[#3c83f6] transition-all sm:text-sm"
                  placeholder="Search by name, ID, or phone number..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {/* Status Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-500 mr-1 hidden sm:inline-block">Status:</span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  All Statuses
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="size-2 rounded-full bg-green-500"></span> Active
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === 'pending'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="size-2 rounded-full bg-orange-500"></span> Pending
                </button>
                <button
                  onClick={() => setStatusFilter('critical')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === 'critical'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="size-2 rounded-full bg-red-500"></span> Critical
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Patients Table/Cards */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {paginatedPatients.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="py-4 pl-6 pr-4 font-semibold text-xs uppercase tracking-wider text-slate-500 w-16">
                          <span className="sr-only">Avatar</span>
                        </th>
                        <th className="py-4 px-4 font-semibold text-xs uppercase tracking-wider text-slate-500">Patient Name</th>
                        <th className="py-4 px-4 font-semibold text-xs uppercase tracking-wider text-slate-500">ID</th>
                        <th className="py-4 px-4 font-semibold text-xs uppercase tracking-wider text-slate-500">Last Visit</th>
                        <th className="py-4 px-4 font-semibold text-xs uppercase tracking-wider text-slate-500">Status</th>
                        <th className="py-4 pl-4 pr-6 font-semibold text-xs uppercase tracking-wider text-slate-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedPatients.map((patient) => {
                        const patientName = patient.personalInfo
                          ? `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`
                          : 'Unknown Patient';
                        const patientId = patient.userID || 'N/A';
                        const phone = patient.contactInfo?.primaryPhone ? formatPhone(patient.contactInfo.primaryPhone) : 'N/A';
                        const lastVisit = patient.updatedAt ? formatDateShort(patient.updatedAt) : 'N/A';
                        const status = getPatientStatus(patient);

                        return (
                          <tr
                            key={patient.userID}
                            className="group hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => navigate(`/doctor/patient-profile/${patient.userID}`)}
                          >
                            <td className="py-3 pl-6 pr-4">
                              {patient.photoURL ? (
                                <div
                                  className="size-10 rounded-full bg-cover bg-center ring-2 ring-white"
                                  style={{ backgroundImage: `url("${patient.photoURL}")` }}
                                />
                              ) : (
                                <div className="size-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold ring-2 ring-white">
                                  {patientName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 text-sm">{patientName}</span>
                                <span className="text-xs text-slate-500">{phone}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-500 font-mono">#{patientId}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{lastVisit}</td>
                            <td className="py-3 px-4">
                              {getStatusBadge(status)}
                            </td>
                            <td className="py-3 pl-4 pr-6 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/doctor/patient-profile/${patient.userID}`);
                                }}
                                className="text-[#3c83f6] hover:text-blue-600 text-sm font-semibold hover:underline"
                              >
                                View Profile
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden flex flex-col gap-4">
                  {paginatedPatients.map((patient) => {
                    const patientName = patient.personalInfo
                      ? `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`
                      : 'Unknown Patient';
                    const patientId = patient.userID || 'N/A';
                    const phone = patient.contactInfo?.primaryPhone ? formatPhone(patient.contactInfo.primaryPhone) : 'N/A';
                    const lastVisit = patient.updatedAt ? formatDateShort(patient.updatedAt) : 'N/A';
                    const status = getPatientStatus(patient);

                    return (
                      <div
                        key={patient.userID}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {patient.photoURL ? (
                              <div
                                className="size-12 rounded-full bg-cover bg-center"
                                style={{ backgroundImage: `url("${patient.photoURL}")` }}
                              />
                            ) : (
                              <div className="size-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                                {patientName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h3 className="font-bold text-slate-900">{patientName}</h3>
                              <p className="text-sm text-slate-500">#{patientId}</p>
                            </div>
                          </div>
                          {getStatusBadge(status)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-slate-500 text-xs uppercase font-medium">Last Visit</p>
                            <p className="text-slate-900 mt-1">{lastVisit}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs uppercase font-medium">Phone</p>
                            <p className="text-slate-900 mt-1">{phone}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/doctor/patient-profile/${patient.userID}`)}
                          className="w-full py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
                        >
                          View Profile
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 mt-4 md:mt-0 md:rounded-b-xl shadow-sm md:shadow-none">
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-700">
                          Showing <span className="font-medium text-slate-900">{startIndex + 1}</span> to{' '}
                          <span className="font-medium text-slate-900">{Math.min(endIndex, filteredPatients.length)}</span> of{' '}
                          <span className="font-medium text-slate-900">{filteredPatients.length}</span> results
                        </p>
                      </div>
                      <div>
                        <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Previous</span>
                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                          </button>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                                  currentPage === pageNum
                                    ? 'z-10 bg-[#3c83f6] text-white focus-visible:outline-[#3c83f6]'
                                    : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:outline-offset-0'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          {totalPages > 5 && currentPage < totalPages - 2 && (
                            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300">
                              ...
                            </span>
                          )}
                          {totalPages > 5 && (
                            <button
                              onClick={() => setCurrentPage(totalPages)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ${
                                currentPage === totalPages
                                  ? 'z-10 bg-[#3c83f6] text-white'
                                  : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {totalPages}
                            </button>
                          )}
                          <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Next</span>
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                <p className="text-slate-500">
                  {searchQuery || statusFilter !== 'all' ? 'No patients found matching your filters' : 'No patients assigned yet'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Patients;
