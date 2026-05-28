import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserLogs, setSelectedUserLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedUserWeek, setSelectedUserWeek] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/dashboard');
      return;
    }
    fetchAdminData();
  }, [selectedWeek]);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setUsers(usersRes.data.users || []);
      setStats(statsRes.data);
    } catch (err) {
      setError('Failed to fetch admin data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLogs = async (userId, weekOffset = 0) => {
    try {
      const weekDate = getWeekStartDate(weekOffset);
      const dateFrom = weekDate.toISOString().split('T')[0];
      const dateTo = new Date(weekDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await axios.get(
        `${API_URL}/admin/users/${userId}/logs?date_from=${dateFrom}&date_to=${dateTo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedUserLogs(response.data.logs || []);
    } catch (err) {
      console.error('Failed to fetch user logs', err);
      setSelectedUserLogs([]);
    }
  };

  const getWeekStartDate = (weeksOffset = 0) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + (weeksOffset * 7);
    return new Date(today.setDate(diff));
  };

  const getWeekEndDate = (startDate) => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    return endDate;
  };

  const getWeekLabel = (offset = 0) => {
    const weekStart = getWeekStartDate(offset);
    const weekEnd = getWeekEndDate(weekStart);
    const options = { month: 'short', day: 'numeric' };
    return `${weekStart.toLocaleDateString('en-US', options)} - ${weekEnd.toLocaleDateString('en-US', options)}`;
  };

  const groupLogsByDate = (logs) => {
    const grouped = {};
    logs.forEach(log => {
      if (!grouped[log.date]) {
        grouped[log.date] = [];
      }
      grouped[log.date].push(log);
    });
    return grouped;
  };

  const handleSelectUser = (userId, weekOffset = 0) => {
    setSelectedUserId(userId);
    setSelectedUserWeek(weekOffset);
    fetchUserLogs(userId, weekOffset);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-left">
          <h1>🔐 Admin Dashboard</h1>
          <p>Logged in as: {user?.name || 'Admin'}</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/dashboard')} className="nav-btn">
            ← My Dashboard
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="admin-content">
        {error && <div className="error-message">{error}</div>}

        <div className="admin-layout">
          {/* Left: Users List */}
          <aside className="users-panel">
            <h2>👥 Team Members</h2>
            
            {loading && !users.length ? (
              <p className="loading">Loading users...</p>
            ) : (
              <div className="users-list">
                {users
                  .filter(u => !u.is_admin)
                  .map(u => (
                    <div
                      key={u.id}
                      className={`user-item ${selectedUserId === u.id ? 'selected' : ''}`}
                      onClick={() => handleSelectUser(u.id, 0)}
                    >
                      <div className="user-name">{u.name}</div>
                      <div className="user-email">{u.email}</div>
                    </div>
                  ))}
              </div>
            )}
          </aside>

          {/* Right: Content Area */}
          <section className="content-panel">
            {/* Collective Stats */}
            <div className="collective-stats">
              <h2>📊 Collective Stats</h2>
              {stats ? (
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{stats.total_users}</div>
                    <div className="stat-label">Total Users</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats.total_logs}</div>
                    <div className="stat-label">Total Logs</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats.total_hours_logged}h</div>
                    <div className="stat-label">Total Hours</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats.avg_hours_per_log.toFixed(1)}h</div>
                    <div className="stat-label">Avg Hours/Log</div>
                  </div>
                </div>
              ) : (
                <p>Loading stats...</p>
              )}
            </div>

            {/* User Progress Section */}
            {selectedUserId && (
              <div className="user-progress-section">
                <div className="progress-header">
                  <h2>📈 User Progress: {users.find(u => u.id === selectedUserId)?.name}</h2>
                  <div className="progress-week-selector">
                    <button 
                      onClick={() => handleSelectUser(selectedUserId, selectedUserWeek - 1)}
                      className="week-nav-btn"
                    >
                      ← Prev
                    </button>
                    <span className="week-label">{getWeekLabel(selectedUserWeek)}</span>
                    <button 
                      onClick={() => handleSelectUser(selectedUserId, selectedUserWeek + 1)}
                      className="week-nav-btn"
                      disabled={selectedUserWeek >= 0}
                    >
                      Next →
                    </button>
                  </div>
                </div>

                {/* User Logs Timeline */}
                <div className="user-timeline">
                  {selectedUserLogs.length === 0 ? (
                    <p className="no-logs">No logs for this week</p>
                  ) : (
                    Object.entries(groupLogsByDate(selectedUserLogs)).map(([date, dateLogs]) => (
                      <div key={date} className="timeline-day">
                        <div className="timeline-marker">
                          <div className="timeline-dot"></div>
                        </div>
                        
                        <div className="timeline-content">
                          <h3 className="timeline-date">
                            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </h3>
                          
                          <div className="logs-for-date">
                            {dateLogs.map(log => (
                              <div key={log.id} className="log-card">
                                <div className="log-header">
                                  <div className="log-meta">
                                    <span className="hours-badge">{log.hours}h</span>
                                    {log.tags && log.tags.length > 0 && (
                                      <div className="tags">
                                        {log.tags.map((tag, i) => (
                                          <span key={i} className="tag">{tag}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="log-content">
                                  {log.done && (
                                    <div className="log-section">
                                      <strong>✅ Done:</strong>
                                      <p>{log.done}</p>
                                    </div>
                                  )}
                                  {log.in_progress && (
                                    <div className="log-section">
                                      <strong>🔄 In Progress:</strong>
                                      <p>{log.in_progress}</p>
                                    </div>
                                  )}
                                  {log.blockers && (
                                    <div className="log-section blockers">
                                      <strong>🚫 Blockers:</strong>
                                      <p>{log.blockers}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {!selectedUserId && (
              <div className="no-user-selected">
                <p>👈 Select a team member to view their progress</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
