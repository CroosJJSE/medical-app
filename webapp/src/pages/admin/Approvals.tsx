// src/pages/admin/Approvals.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import BackToDashboardButton from '@/components/common/BackToDashboardButton';
import Loading from '@/components/common/Loading';
import Input from '@/components/common/Input';
import userService from '@/services/userService';
import { useAuthContext } from '@/context/AuthContext';
import { getPendingApprovals, removePendingPatient, removePendingDoctor } from '@/repositories/pendingApprovalRepository';
import { getById } from '@/repositories/userRepository';
import type { PendingUserInfo } from '@/repositories/pendingApprovalRepository';
import type { User } from '@/models/User';
import { UserStatus, UserRole } from '@/enums';
import doctorService from '@/services/doctorService';
import patientService from '@/services/patientService';
import type { Doctor } from '@/models/Doctor';

// Helper function to convert Firestore timestamp to Date
const convertToDate = (timestamp: any): Date | null => {
  if (!timestamp) return null;
  
  // If it's already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // If it's a Firestore Timestamp object with toDate method
  if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // If it's a Firestore timestamp object with seconds property
  if (typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
  }
  
  // If it's a string, try to parse it
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // If it's a number (milliseconds since epoch)
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  return null;
};

// Helper function to format date
const formatDate = (date: Date | null): string => {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Helper function to format date for list (short format)
const formatDateShort = (date: Date | null): string => {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const Approvals: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthContext();
  const [searchParams] = useSearchParams();
  const selectedUserID = searchParams.get('userID');
  const [pendingPatients, setPendingPatients] = useState<PendingUserInfo[]>([]);
  const [pendingDoctors, setPendingDoctors] = useState<PendingUserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPendingUser, setSelectedPendingUser] = useState<PendingUserInfo | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [activeDoctors, setActiveDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  useEffect(() => {
    const loadPendingApprovals = async () => {
      setLoading(true);
      try {
        const data = await getPendingApprovals();
        
        // Ensure we have arrays
        const patients = Array.isArray(data.patients) ? data.patients : [];
        const doctors = Array.isArray(data.doctors) ? data.doctors : [];
        
        setPendingPatients(patients);
        setPendingDoctors(doctors);
        
        if (selectedUserID) {
          // Find in pending lists
          const pendingUser = [...patients, ...doctors].find(u => u.userID === selectedUserID);
          if (pendingUser) {
            setSelectedPendingUser(pendingUser);
            // Fetch full user details
            const fullUser = await getById(selectedUserID);
            if (fullUser) setSelectedUser(fullUser);
          }
        }
      } catch (error: any) {
        console.error('Error loading pending approvals:', error);
        alert(`Error loading pending approvals: ${error?.message || 'Unknown error'}. Please check the console for details.`);
      } finally {
        setLoading(false);
      }
    };

    const loadActiveDoctors = async () => {
      try {
        const doctors = await doctorService.getDoctors();
        // Filter only active and approved doctors
        const active = doctors.filter(
          (doc) => doc.status === 'active' && doc.isApproved
        );
        setActiveDoctors(active);
      } catch (error) {
        console.error('Error loading active doctors:', error);
      }
    };

    loadPendingApprovals();
    loadActiveDoctors();
  }, [selectedUserID]);

  const handleSelectUser = async (pendingUser: PendingUserInfo) => {
    setSelectedPendingUser(pendingUser);
    setShowRejectionInput(false);
    setRejectionReason('');
    setSelectedDoctorId(''); // Reset doctor selection
    // Fetch full user details from /users/{userID}
    try {
      const fullUser = await getById(pendingUser.userID);
      setSelectedUser(fullUser);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setSelectedUser(null);
    }
  };

  const handleApprove = async (userID: string, role: 'patient' | 'doctor') => {
    if (!currentUser) {
      alert('You must be logged in to approve users.');
      return;
    }
    
    setProcessing(true);
    try {
      const adminUserID = currentUser.userID || currentUser.userId || 'admin';
      
      // Approve user - update status in /users/{userID}
      await userService.approveUser(userID, adminUserID);
      
      // If approving a patient and a doctor is selected, assign the doctor
      if (role === 'patient' && selectedDoctorId) {
        try {
          await patientService.assignPrimaryDoctor(userID, selectedDoctorId, adminUserID);
        } catch (assignError) {
          console.error('Error assigning doctor:', assignError);
          // Continue with approval even if assignment fails
          alert('Patient approved, but there was an error assigning the doctor. You can assign the doctor later from the patient profile.');
        }
      }
      
      // Remove from pending approvals array
      if (role === 'patient') {
        await removePendingPatient(userID);
      } else {
        await removePendingDoctor(userID);
      }
      
      alert('User approved successfully! The user needs to refresh their browser or sign in again to access their account.');
      
      // Reload pending approvals
      const data = await getPendingApprovals();
      setPendingPatients(data.patients || []);
      setPendingDoctors(data.doctors || []);
      
      setSelectedUser(null);
      setSelectedPendingUser(null);
      setSelectedDoctorId('');
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Error approving user. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (userID: string, role: 'patient' | 'doctor') => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      await userService.rejectUser(userID, rejectionReason);
      
      // Remove from pending approvals array
      if (role === 'patient') {
        await removePendingPatient(userID);
      } else {
        await removePendingDoctor(userID);
      }
      
      alert('User rejected successfully!');
      
      // Reload pending approvals
      const data = await getPendingApprovals();
      setPendingPatients(data.patients || []);
      setPendingDoctors(data.doctors || []);
      
      setSelectedUser(null);
      setSelectedPendingUser(null);
      setRejectionReason('');
      setShowRejectionInput(false);
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Error rejecting user. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Filter users based on search query
  const allPendingUsers = [...pendingPatients, ...pendingDoctors];
  const filteredUsers = searchQuery.trim()
    ? allPendingUsers.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.userID.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery)
      )
    : allPendingUsers;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading approvals..." />
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
          <span className="text-gray-900 text-sm font-medium">Approvals</span>
        </div>

        {/* Page Heading */}
        <div className="flex flex-wrap justify-between gap-3 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-gray-900 text-3xl font-bold tracking-tight">Admin Approvals</h1>
            <p className="text-gray-600 text-base font-normal">Review and manage pending user registrations.</p>
          </div>
          <BackToDashboardButton />
        </div>

        {/* Two-column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: User List */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Requests</h2>
              
              {/* Search Bar */}
              <div className="mb-4">
                <div className="flex w-full items-stretch rounded-lg h-11 border border-gray-200">
                  <div className="flex items-center justify-center pl-3.5 pr-2 border-r border-gray-200 bg-gray-50 rounded-l-lg">
                    <span className="material-symbols-outlined text-xl text-gray-500">search</span>
                  </div>
                  <input
                    type="text"
                    className="flex-1 px-3.5 py-2 text-sm font-normal text-gray-900 bg-white rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-gray-500"
                    placeholder="Search by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* User List */}
            <div className="flex flex-col gap-2">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((pendingUser) => {
                  const registeredDate = convertToDate(pendingUser.registeredAt);
                  const isSelected = selectedPendingUser?.userID === pendingUser.userID;
                  const userType = pendingUser.userID.startsWith('PAT') ? 'Patient' : 'Doctor';
                  
                  return (
                    <div
                      key={pendingUser.userID}
                      className={`flex cursor-pointer items-center gap-4 rounded-xl p-4 transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border-l-4 border-blue-500 shadow-sm'
                          : 'bg-white hover:bg-gray-50 border border-gray-200'
                      }`}
                      onClick={() => handleSelectUser(pendingUser)}
                    >
                      {pendingUser.photoURL ? (
                        <img
                          src={pendingUser.photoURL}
                          alt={pendingUser.name}
                          className="h-12 w-12 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
                          <span className="text-gray-600 text-lg font-semibold">
                            {pendingUser.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-base font-medium truncate ${
                          isSelected 
                            ? 'text-blue-600' 
                            : 'text-gray-900'
                        }`}>
                          {pendingUser.name}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          ID: {pendingUser.userID}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm text-gray-500">
                        {formatDateShort(registeredDate)}
                      </p>
                    </div>
                  );
                })
              ) : (
                <Card className="p-8">
                  <p className="text-gray-500 text-center">No pending approvals</p>
                </Card>
              )}
            </div>
          </div>

          {/* Right Column: User Details */}
          {selectedPendingUser ? (
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 h-fit">
              <div className="p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">User Details</h2>
                
                {/* Profile Header */}
                <div className="flex items-center gap-6 mb-8">
                  {selectedPendingUser.photoURL ? (
                    <img
                      src={selectedPendingUser.photoURL}
                      alt={selectedPendingUser.name}
                      className="h-24 w-24 rounded-full object-cover shrink-0 border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center shrink-0 border-2 border-gray-200">
                      <span className="text-gray-600 text-3xl font-semibold">
                        {selectedPendingUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedPendingUser.name}
                    </p>
                    <p className="text-base text-gray-600">
                      {selectedPendingUser.userID.startsWith('PAT') ? 'Patient' : 'Doctor'}
                    </p>
                  </div>
                </div>

                {/* Information Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">User ID</p>
                    <p className="text-base font-medium text-gray-800">{selectedPendingUser.userID}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Registration Date</p>
                    <p className="text-base font-medium text-gray-800">
                      {formatDate(convertToDate(selectedPendingUser.registeredAt))}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="text-base font-medium text-gray-800">{selectedPendingUser.phone}</p>
                  </div>
                      {selectedUser && (
                    <>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Email Address</p>
                        <p className="text-base font-medium text-gray-800">{selectedUser.email || 'N/A'}</p>
                      </div>
                      {(selectedUser as any).contactInfo?.address && (
                        <div className="md:col-span-2 space-y-1">
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="text-base font-medium text-gray-800">{(selectedUser as any).contactInfo.address}</p>
                        </div>
                      )}
                      {selectedPendingUser.userID.startsWith('DOC') && selectedUser && 'professionalInfo' in selectedUser && (
                        <>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500">Specialization</p>
                            <p className="text-base font-medium text-gray-800">
                              {(selectedUser as any).professionalInfo?.specialization || 'N/A'}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500">Medical License No.</p>
                            <p className="text-base font-medium text-gray-800">
                              {(selectedUser as any).professionalInfo?.licenseNumber || 'N/A'}
                            </p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Doctor Assignment (for patients only) */}
                {selectedPendingUser?.userID.startsWith('PAT') && (
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Primary Doctor <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 text-sm"
                    >
                      <option value="">Select Doctor...</option>
                      {activeDoctors.map((doctor) => (
                        <option key={doctor.userID} value={doctor.userID}>
                          {doctor.displayName} - {doctor.professionalInfo?.specialization || 'N/A'}
                        </option>
                      ))}
                    </select>
                    {activeDoctors.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        No active doctors available. You can assign a doctor later from the patient profile.
                      </p>
                    )}
                  </div>
                )}

                {/* Rejection Reason Input */}
                {showRejectionInput && (
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Rejection
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 text-sm"
                      rows={3}
                      placeholder="Provide a clear reason for rejecting this user..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="flex justify-end gap-4 border-t border-gray-200 p-6 bg-gray-50 rounded-b-xl">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowRejectionInput(!showRejectionInput);
                    if (showRejectionInput) {
                      setRejectionReason('');
                    }
                  }}
                  disabled={processing}
                  className="px-5 py-2.5"
                >
                  {showRejectionInput ? 'Cancel' : 'Reject'}
                </Button>
                {showRejectionInput && rejectionReason.trim() && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (confirm('Are you sure you want to reject this user?')) {
                        handleReject(
                          selectedPendingUser.userID,
                          selectedPendingUser.userID.startsWith('PAT') ? 'patient' : 'doctor'
                        );
                      }
                    }}
                    disabled={processing}
                    className="px-5 py-2.5"
                  >
                    Confirm Rejection
                  </Button>
                )}
                <Button
                  onClick={() => {
                    handleApprove(
                      selectedPendingUser.userID,
                      selectedPendingUser.userID.startsWith('PAT') ? 'patient' : 'doctor'
                    );
                  }}
                  disabled={processing}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Approve
                </Button>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <p className="text-gray-500 text-center">Select a user to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Approvals;
