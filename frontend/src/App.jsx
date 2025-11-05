import React from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import StudentForm from "./components/StudentForm";
import AdminLogin from "./components/AdminLogin";
import AdminRegister from "./components/AdminRegister";
import AdminDashboard from "./components/AdminDashboard";
import StudentsPage from "./components/StudentsPage";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/admin" />;
};

// Wrapper to pass hostelId to StudentForm when accessed from the admin flow
const StudentFormWrapper = () => {
  const { state } = useLocation();
  const { hostelId } = useParams();
  
  // If coming from admin flow, use the hostelId from URL
  // If coming from public form, it will be handled by the form itself
  return <StudentForm hostelId={hostelId} isAdminFlow={!!hostelId} />;
};

export default function App() {
  return (
    <Routes>
      {/* Public route for student form */}
      <Route path="/" element={<StudentForm />} />
      
      {/* Admin authentication routes */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      
      {/* Protected admin routes */}
      <Route path="/admin/dashboard" element={
        <PrivateRoute>
          <AdminDashboard />
        </PrivateRoute>
      } />
      
      {/* Student management routes */}
      <Route path="/hostel/:hostelId/students" element={
        <PrivateRoute>
          <StudentsPage />
        </PrivateRoute>
      } />
      
      {/* New student form within admin context */}
      <Route path="/hostel/:hostelId/student/new" element={
        <PrivateRoute>
          <StudentFormWrapper />
        </PrivateRoute>
      } />
      
      {/* View/Edit student (if needed in the future) */}
      <Route path="/student/:studentId" element={
        <PrivateRoute>
          <StudentForm editMode={true} />
        </PrivateRoute>
      } />
      
      {/* Redirect any unknown routes to home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
