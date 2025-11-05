import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentForm from "./components/StudentForm";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import StudentsPage from "./components/StudentsPage";

// Authentication wrapper
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/admin" />;
};

// Public route wrapper
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return !token ? children : <Navigate to="/dashboard" />;
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

      {/* Protected routes */}
      <Route path="/dashboard" element={
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
        <PrivateRoute>
          <StudentForm />
        </PrivateRoute>
      } />

      {/* Redirect all unknown routes to login */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
