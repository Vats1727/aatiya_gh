import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentForm from "./components/StudentForm";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";

const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/admin" />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StudentForm />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={
        <PrivateRoute>
          <AdminDashboard />
        </PrivateRoute>
      } />
    </Routes>
  );
}
