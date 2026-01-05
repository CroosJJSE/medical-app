// src/pages/admin/Approvals.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import Input from '@/components/common/Input';
import userService from '@/services/userService';
import { useAuthContext } from '@/context/AuthContext';
import type { User } from '@/models/User';
import { UserStatus, UserRole } from '@/enums';

const Approvals: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthContext();
  const [searchParams] = useSearchParams();
  const selectedUserId = searchParams.get('userId');
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadPendingUsers = async () => {
      try {
        const users = await userService.getPendingUsers();
        setPendingUsers(users);
        
        if (selectedUserId) {
          const user = users.find(u => u.userId === selectedUserId);
          if (user) setSelectedUser(user);
        }
      } catch (error) {
        console.error('Error loading pending users:', error);
        alert('Error loading pending users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPendingUsers();
  }, [selectedUserId]);

  const handleApprove = async (userId: string) => {
    if (!currentUser) {
      alert('You must be logged in to approve users.');
      return;
    }
    
    setProcessing(true);
    try {
      await userService.approveUser(userId, currentUser.userId);
      alert('User approved successfully!');
      setPendingUsers(pendingUsers.filter(u => u.userId !== userId));
      setSelectedUser(null);
      // Reload pending users
      const users = await userService.getPendingUsers();
      setPendingUsers(users);
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Error approving user. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      await userService.rejectUser(userId, rejectionReason);
      alert('User rejected successfully!');
      setPendingUsers(pendingUsers.filter(u => u.userId !== userId));
      setSelectedUser(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Error rejecting user. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading approvals..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">User Approvals</h1>
          <Button variant="secondary" onClick={() => navigate('/admin/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Users List */}
          <Card title={`Pending Approvals (${pendingUsers.length})`}>
            {pendingUsers.length > 0 ? (
              <div className="space-y-2">
                {pendingUsers.map((user) => (
                  <div
                    key={user.userId}
                    className={`border rounded p-3 cursor-pointer ${
                      selectedUser?.userId === user.userId
                        ? 'bg-blue-50 dark:bg-blue-900 border-blue-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <p className="font-semibold">{user.displayName || user.email}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Role: {user.role} | {user.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No pending approvals</p>
            )}
          </Card>

          {/* User Details & Actions */}
          {selectedUser && (
            <Card title="User Details">
              <div className="space-y-4">
                <div>
                  <p className="font-semibold">{selectedUser.displayName || 'N/A'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email: {selectedUser.email}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Role: {selectedUser.role}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status: {selectedUser.status}
                  </p>
                  {selectedUser.createdAt && (
                    <p className="text-xs text-gray-500">
                      Registered: {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Approval Actions */}
                <div className="border-t pt-4 space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(selectedUser.userId)}
                      disabled={processing}
                      className="flex-1"
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (confirm('Are you sure you want to reject this user?')) {
                          // Show rejection reason input
                        }
                      }}
                      disabled={processing}
                      className="flex-1"
                    >
                      Reject
                    </Button>
                  </div>

                  {/* Rejection Reason */}
                  <div>
                    <Input
                      label="Rejection Reason (if rejecting)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                    />
                    {rejectionReason && (
                      <Button
                        variant="danger"
                        onClick={() => handleReject(selectedUser.userId)}
                        disabled={processing}
                        className="w-full mt-2"
                      >
                        Confirm Rejection
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Approvals;

