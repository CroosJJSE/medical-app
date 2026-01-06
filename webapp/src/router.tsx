// src/router.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, UserStatus } from '@/enums';
import Loading from '@/components/common/Loading';

// Auth pages
import Login from '@/pages/auth/Login';
import PatientRegister from '@/pages/auth/PatientRegister';
import PatientRegistrationFlow from '@/pages/auth/PatientRegistrationFlow';
import DoctorRegister from '@/pages/auth/DoctorRegister';

// Patient pages
import PatientDashboard from '@/pages/patient/Dashboard';
import PatientProfile from '@/pages/patient/Profile';
import PatientAppointments from '@/pages/patient/Appointments';
import ScheduleAppointment from '@/pages/patient/ScheduleAppointment';
import TestResults from '@/pages/patient/TestResults';
import PatientTimeline from '@/pages/patient/Timeline';

// Doctor pages
import DoctorDashboard from '@/pages/doctor/Dashboard';
import Patients from '@/pages/doctor/Patients';
import DoctorPatientProfile from '@/pages/doctor/PatientProfile';
import DoctorAppointments from '@/pages/doctor/Appointments';
import NewEncounter from '@/pages/doctor/NewEncounter';
import TestResultsReview from '@/pages/doctor/TestResultsReview';

// Admin pages
import AdminDashboard from '@/pages/admin/Dashboard';
import Approvals from '@/pages/admin/Approvals';
import AllPatients from '@/pages/admin/AllPatients';
import AllDoctors from '@/pages/admin/AllDoctors';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading..." />
      </div>
    );
  }

  // If user is null, they need to register (not found in /admin/common_info/users mapping)
  // This means they haven't completed registration yet
  if (!user) {
    // Check if they're signed in with Google (but not registered)
    // Redirect to registration flow for patients
    if (allowedRoles.includes(UserRole.PATIENT)) {
      return <Navigate to="/register/patient/flow" replace />;
    }
    // For other roles, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If user exists but not approved, show pending approval message
  if (!user.isApproved || user.status === UserStatus.PENDING) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Account Pending Approval</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your account is pending admin approval. Please wait for approval.
          </p>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register/patient" element={<PatientRegister />} />
        <Route path="/register/patient/flow" element={<PatientRegistrationFlow />} />
        <Route path="/register/doctor" element={<DoctorRegister />} />

        {/* Patient Routes */}
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/profile"
          element={
            <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
              <PatientProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
              <PatientAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/schedule-appointment"
          element={
            <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
              <ScheduleAppointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/test-results"
          element={
            <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
              <TestResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/timeline"
          element={
            <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
              <PatientTimeline />
            </ProtectedRoute>
          }
        />

        {/* Doctor Routes */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/patients"
          element={
            <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
              <Patients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/patient-profile/:patientId"
          element={
            <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
              <DoctorPatientProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/appointments"
          element={
            <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
              <DoctorAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/new-encounter"
          element={
            <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
              <NewEncounter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/test-results-review"
          element={
            <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
              <TestResultsReview />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <Approvals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/patients"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AllPatients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/doctors"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AllDoctors />
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;

