import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logsApi, authApi } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingLogId, setEditingLogId] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, -1 = last week, etc.
  
  // Form states
  const [formData, setFormData] = useState({
    done: '',
    in_progress: '',
    blockers: '',
    hours: 0,
    tags: ''
  });

  // Fetch logs on mount and when editing finishes
  useEffect(() => {
    fetchLogs();
  }, [selectedWeek]);

  // Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authApi.getCurrentUser();
        console.log('User:', response.data);
        // Team info is already in user from AuthContext
      } catch (err) {
        console.error('Failed to fetch user info', err);
      }
    };
    fetchUser();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await logsApi.getMyLogs(100, 0);
      setLogs(response.data || []);
    } catch (err) {
      setError('Failed to fetch logs');
      console.error(err);
    } finally {
      setLoading(false);
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

  const formatDateKey = (date) => date.toISOString().split('T')[0];

  const getLogsForWeek = () => {
    const weekStart = getWeekStartDate(selectedWeek);
    const weekEnd = getWeekEndDate(weekStart);
    
    const startKey = formatDateKey(weekStart);
    const endKey = formatDateKey(weekEnd);
    
    return logs.filter(log => log.date >= startKey && log.date <= endKey)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const groupLogsByDate = (weekLogs) => {
    const grouped = {};
    weekLogs.forEach(log => {
      if (!grouped[log.date]) {
        grouped[log.date] = [];
      }
      grouped[log.date].push(log);
    });
    return grouped;
  };

  const getWeekLabel = () => {
    const weekStart = getWeekStartDate(selectedWeek);
    const weekEnd = getWeekEndDate(weekStart);
    const options = { month: 'short', day: 'numeric' };
    return `${weekStart.toLocaleDateString('en-US', options)} - ${weekEnd.toLocaleDateString('en-US', options)}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hours' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        done: formData.done || null,
        in_progress: formData.in_progress || null,
        blockers: formData.blockers || null,
        hours: formData.hours,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
      };

      if (editingLogId) {
        await logsApi.updateLog(editingLogId, payload);
        setEditingLogId(null);
      } else {
        await logsApi.createLog(payload);
      }

      setFormData({
        done: '',
        in_progress: '',
        blockers: '',
        hours: 0,
        tags: ''
      });

      await fetchLogs();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save log');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log) => {
    setEditingLogId(log.id);
    setFormData({
      done: log.done || '',
      in_progress: log.in_progress || '',
      blockers: log.blockers || '',
      hours: log.hours || 0,
      tags: (log.tags || []).join(', ')
    });
  };

  const handleDelete = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this log?')) return;

    try {
      await logsApi.deleteLog(logId);
      await fetchLogs();
    } catch (err) {
      setError('Failed to delete log');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setEditingLogId(null);
    setFormData({
      done: '',
      in_progress: '',
      blockers: '',
      hours: 0,
      tags: ''
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>📊 DevPulse</h1>
          <div className="user-info">
            <p>Welcome, {user?.name || 'User'}!</p>
            {user?.team_id && <span className="team-badge">Team ID: {user.team_id.substring(0, 8)}...</span>}
          </div>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/analytics')} className="nav-btn">
            📈 Analytics
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {error && <div className="error-message">{error}</div>}

        {/* Create/Edit Log Form */}
        <section className="form-section">
          <h2>{editingLogId ? 'Edit EOD Log' : 'Create New EOD Log'}</h2>
          <form onSubmit={handleSubmit} className="log-form">
            <div className="form-group">
              <label>Completed Tasks:</label>
              <textarea
                name="done"
                value={formData.done}
                onChange={handleInputChange}
                placeholder="What did you complete today?"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>In Progress:</label>
              <textarea
                name="in_progress"
                value={formData.in_progress}
                onChange={handleInputChange}
                placeholder="What are you currently working on?"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Blockers:</label>
              <textarea
                name="blockers"
                value={formData.blockers}
                onChange={handleInputChange}
                placeholder="Any blockers or issues?"
                rows="2"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hours Worked:</label>
                <input
                  type="number"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  min="0"
                  max="24"
                />
              </div>

              <div className="form-group">
                <label>Tags (comma-separated):</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g. frontend, bug-fix, feature"
                />
              </div>
            </div>

            <div className="form-buttons">
              <button type="submit" disabled={loading} className="btn-submit">
                {loading ? 'Saving...' : (editingLogId ? 'Update Log' : 'Create Log')}
              </button>
              {editingLogId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Week Selector */}
        <section className="week-selector">
          <button 
            onClick={() => setSelectedWeek(selectedWeek - 1)}
            className="week-nav-btn"
          >
            ← Previous
          </button>
          <h2 className="week-label">Week of {getWeekLabel()}</h2>
          <button 
            onClick={() => setSelectedWeek(selectedWeek + 1)}
            className="week-nav-btn"
            disabled={selectedWeek >= 0}
          >
            Next →
          </button>
        </section>

        {/* Vertical Timeline */}
        <section className="logs-section">
          <h2>📝 Your EOD Logs</h2>
          
          {loading && !logs.length && <p className="loading">Loading logs...</p>}
          
          {!loading && getLogsForWeek().length === 0 && (
            <p className="no-logs">No logs for this week. Create one to get started!</p>
          )}

          <div className="timeline">
            {Object.entries(groupLogsByDate(getLogsForWeek())).map(([date, dateLogs]) => (
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
                      <div key={log.id} className="log-card timeline-log">
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

                        <div className="log-actions">
                          <button
                            onClick={() => handleEdit(log)}
                            className="btn-edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="btn-delete"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
