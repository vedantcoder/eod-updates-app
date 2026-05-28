import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Analytics.css';

export default function Analytics() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchAnalytics();
  }, [selectedWeek]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const weekDate = getWeekStartDate(selectedWeek);
      const weekStr = weekDate.toISOString().split('T')[0];

      const [statsRes, tagsRes] = await Promise.all([
        axios.get(`${API_URL}/analytics/my-stats?week_start=${weekStr}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_URL}/analytics/my-tags`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      setStats(statsRes.data);
      setTags(tagsRes.data.tags || []);
    } catch (err) {
      setError('Failed to fetch analytics');
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

  const getWeekLabel = () => {
    const weekStart = getWeekStartDate(selectedWeek);
    const weekEnd = getWeekEndDate(weekStart);
    const options = { month: 'short', day: 'numeric' };
    return `${weekStart.toLocaleDateString('en-US', options)} - ${weekEnd.toLocaleDateString('en-US', options)}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <div className="header-left">
          <h1>Analysis</h1>
          <p>Welcome, {user?.name || 'User'}!</p>
          {user?.team_name && <span className="team-badge">Team: {user.team_name}</span>}
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/dashboard')} className="nav-btn">
            ← Dashboard
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="analytics-content">
        {error && <div className="error-message">{error}</div>}
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

        {loading ? (
          <p className="loading">Loading analytics...</p>
        ) : stats ? (
          <>
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.total_hours}hr</div>
                <div className="stat-label">Total Hours</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">{stats.avg_hours_per_day.toFixed(1)}hr</div>
                <div className="stat-label">Avg Hours/Day</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">{stats.log_count}</div>
                <div className="stat-label">Logs This Week</div>
              </div>
            </section>

            <section className="tags-section">
              <h2>Top Tags</h2>
              
              {tags.length === 0 ? (
                <p className="no-tags">No tags used this week</p>
              ) : (
                <div className="tags-grid">
                  {tags.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="tag-item">
                      <div className="tag-name">{item.tag}</div>
                      <div className="tag-count">{item.count}</div>
                      <div className="tag-bar">
                        <div 
                          className="tag-bar-fill" 
                          style={{ 
                            width: `${(item.count / tags[0].count) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {stats.logs && stats.logs.length > 0 && (
              <section className="daily-section">
                <h2>Daily Breakdown</h2>
                <div className="daily-logs">
                  {stats.logs.map((log, idx) => (
                    <div key={idx} className="daily-item">
                      <div className="daily-date">
                        {new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="daily-hours">{log.hours}hr</div>
                      <div className="daily-progress">
                        <div 
                          className="progress-bar"
                          style={{ width: `${(log.hours / 8) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <p className="no-data">No data available for this week</p>
        )}
      </main>
    </div>
  );
}
