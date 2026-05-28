import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { authApi } from './api/api';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import AddEODUpdate from './pages/AddEODUpdate';
import AdminDashboard from './pages/AdminDashboard';
import Teams from './pages/Teams';
import TeamDetails from './pages/TeamDetails';
import TeamUserView from './pages/TeamUserView';
import TeamUserAnalysis from './pages/TeamUserAnalysis';
import './App.css';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { token, user } = useAuth();
  return token && user?.is_admin ? children : <Navigate to="/dashboard" />;
}

export default function App() {
  const { token, setUser, logout, user } = useAuth();

  useEffect(() => {
    if (token) {
      authApi.getCurrentUser()
        .then((res) => setUser(res.data))
        .catch(() => logout());
    }
  }, [token]);

  return (
    <BrowserRouter>
      {token && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {user?.is_admin ? <AdminDashboard /> : <Dashboard />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-eod-update"
          element={
            <ProtectedRoute>
              <AddEODUpdate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analysis"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams"
          element={
            <AdminRoute>
              <Teams />
            </AdminRoute>
          }
        />
        <Route
          path="/teams/:teamId"
          element={
            <AdminRoute>
              <TeamDetails />
            </AdminRoute>
          }
        />
        <Route
          path="/teams/:teamId/:userId"
          element={
            <AdminRoute>
              <TeamUserView />
            </AdminRoute>
          }
        />
        <Route
          path="/teams/:teamId/:userId/analysis"
          element={
            <AdminRoute>
              <TeamUserAnalysis />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
