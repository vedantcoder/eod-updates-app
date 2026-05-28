import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { authApi } from './api/api';
import Login from './pages/Login';
import './App.css';

// Placeholder components (to be built)
const Dashboard = () => <div className="container"><h1>Dashboard - Coming Soon</h1></div>;
const Analytics = () => <div className="container"><h1>Analytics - Coming Soon</h1></div>;
const AdminPanel = () => <div className="container"><h1>Admin Panel - Coming Soon</h1></div>;

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/" />;
}

export default function App() {
  const { token, setUser, logout } = useAuth();

  useEffect(() => {
    if (token) {
      authApi.getCurrentUser()
        .then((res) => setUser(res.data))
        .catch(() => logout());
    }
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
