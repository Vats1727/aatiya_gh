import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
const StudentForm = React.lazy(() => import("./components/StudentForm"));
const AdminLogin = React.lazy(() => import("./components/AdminLogin"));
const AdminDashboard = React.lazy(() => import("./components/AdminDashboard"));
const AdminRegister = React.lazy(() => import("./components/AdminRegister"));
const StudentsPage = React.lazy(() => import("./components/StudentsPage"));
const StudentPayments = React.lazy(() => import("./components/StudentPayments"));
const StudentProfile = React.lazy(() => import("./components/StudentProfile"));
const SubmissionSuccess = React.lazy(() => import("./components/SubmissionSuccess"));
const SuperAdminPage = React.lazy(() => import("./components/SuperAdminPage"));

// Authentication wrapper
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    // Redirect to login with the current location to redirect back after login
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }
  return children;
};

// Public route wrapper
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (token) {
    // Redirect to dashboard if already logged in
    return <Navigate to="/admin/dashboard" state={{ from: location }} replace />;
  }
  return children;
};

// Dashboard wrapper - shows SuperAdmin or Admin dashboard based on role
const DashboardRoute = () => {
  const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true';
  return isSuperAdmin ? <SuperAdminPage /> : <AdminDashboard />;
};

export default function App() {
  return (
    <React.Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>Loading...</div>}>
      <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/admin" replace />} />

      <Route path="/admin" element={
        <PublicRoute>
          <AdminLogin />
        </PublicRoute>
      } />

      <Route path="/admin/register" element={
        <PublicRoute>
          <AdminRegister />
        </PublicRoute>
      } />

      {/* Protected routes */}
      <Route path="/admin/dashboard" element={
        <PrivateRoute>
          <DashboardRoute />
        </PrivateRoute>
      } />

      <Route path="/hostel/:hostelId/students" element={
        <PrivateRoute>
          <StudentsPage />
        </PrivateRoute>
      } />

      <Route path="/hostel/:hostelId/students/:studentId/payments" element={
        <PrivateRoute>
          <StudentPayments />
        </PrivateRoute>
      } />

      <Route path="/hostel/:hostelId/students/:studentId/profile" element={
        <PrivateRoute>
          <StudentProfile />
        </PrivateRoute>
      } />

      <Route path="/hostel/:hostelId/add-student" element={
        <StudentForm />
      } />

      <Route path="/submission-success" element={
        <SubmissionSuccess />
      } />

      {/* Redirect all unknown routes to login */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </React.Suspense>
  );
}