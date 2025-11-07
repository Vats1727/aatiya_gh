import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import StudentForm from "./components/StudentForm";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import AdminRegister from "./components/AdminRegister";
import StudentsPage from "./components/StudentsPage";
import PaymentPage from "./components/PaymentPage";
import SubmissionSuccess from "./components/SubmissionSuccess";

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

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        <PublicRoute>
          <StudentForm />
        </PublicRoute>
      } />

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
          <AdminDashboard />
        </PrivateRoute>
      } />

      <Route path="/hostel/:hostelId/students" element={
        <PrivateRoute>
          <StudentsPage />
        </PrivateRoute>
      } />

      <Route path="/hostel/:hostelId/add-student" element={
        <StudentForm />
      } />

      <Route path="/hostel/:hostelId/students/:studentId/payments" element={
        <PrivateRoute>
          <PaymentPage />
        </PrivateRoute>
      } />

      <Route path="/submission-success" element={
        <SubmissionSuccess />
      } />

      {/* Redirect all unknown routes to login */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}