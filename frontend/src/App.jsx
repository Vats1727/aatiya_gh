import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentForm from "./components/StudentForm";
import AdminLogin from "./components/AdminLogin";
import AdminRegister from "./components/AdminRegister";
import HostelRegister from "./components/HostelRegister";
import AdminDashboard from "./components/AdminDashboard";

const PrivateRoute = ({ children }) => {
  // Use JWT token presence for authentication check
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/admin" />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StudentForm />} />
  <Route path="/admin" element={<AdminLogin />} />
  <Route path="/admin/register" element={<AdminRegister />} />
  <Route path="/hostel/register" element={<HostelRegister />} />
      <Route path="/admin/dashboard" element={
        <PrivateRoute>
          <AdminDashboard />
        </PrivateRoute>
      } />
    </Routes>
  );
}
