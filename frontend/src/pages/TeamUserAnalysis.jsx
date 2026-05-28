import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi, analyticsApi } from "../api/api";
import { getWeekEndDate, getWeekStartDate, toDateKey } from "../utils/week";
import "./TeamUserAnalysis.css";

function getTagFrequency(logs = []) {
  const counts = {};
  logs.forEach((log) => {
    (log.tags || []).forEach((tag) => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export default function TeamUserAnalysis() {
  const navigate = useNavigate();
  const { teamId, userId } = useParams();
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStaticData();
  }, [userId]);

  useEffect(() => {
    fetchWeeklyStats();
  }, [selectedWeek, userId]);

  const fetchStaticData = async () => {
    try {
      const [usersRes, logsRes] = await Promise.allSettled([adminApi.getUsers(), adminApi.getUserLogs(userId)]);
      if (usersRes.status === "fulfilled") {
        setUsers(usersRes.value.data.users || []);
      }
      if (logsRes.status === "fulfilled") {
        setAllLogs(logsRes.value.data.logs || []);
      }
    } catch (err) {
      setError("Failed to load analysis data");
      console.error(err);
    }
  };

  const fetchWeeklyStats = async () => {
    setLoading(true);
    setError("");
    try {
      const weekStart = toDateKey(getWeekStartDate(selectedWeek));
      const response = await analyticsApi.getUserStats(userId, weekStart);
      setStats(response.data);
    } catch (err) {
      setError("Failed to load selected user's analysis");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = useMemo(() => users.find((item) => item.id === userId), [users, userId]);
  const tags = useMemo(() => getTagFrequency(allLogs).slice(0, 10), [allLogs]);

  const weekLabel = useMemo(() => {
    const start = getWeekStartDate(selectedWeek);
    const end = getWeekEndDate(start);
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }, [selectedWeek]);

  return (
    <div className="team-user-analysis-page">
      <div className="team-user-analysis-container">
        <header className="analysis-header">
          <button className="back-btn" onClick={() => navigate(`/teams/${teamId}/${userId}`)}>
            ← Back to User Timeline
          </button>
          <div>
            <h1>{selectedUser?.name || "User"} Analysis</h1>
            <p>{selectedUser?.email || "Weekwise analytics view"}</p>
          </div>
        </header>

        {error && <div className="error-message">{error}</div>}

        <section className="week-selector">
          <button onClick={() => setSelectedWeek(selectedWeek - 1)} className="week-nav-btn">
            ← Previous
          </button>
          <h2>Week of {weekLabel}</h2>
          <button
            onClick={() => setSelectedWeek(selectedWeek + 1)}
            className="week-nav-btn"
            disabled={selectedWeek >= 0}
          >
            Next →
          </button>
        </section>

        {loading ? (
          <p className="loading">Loading analysis...</p>
        ) : (
          <>
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats?.total_hours || 0}hr</div>
                <div className="stat-label">Total Hours</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{(stats?.avg_hours_per_day || 0).toFixed(1)}hr</div>
                <div className="stat-label">Avg Hours/Day</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats?.log_count || 0}</div>
                <div className="stat-label">Logs This Week</div>
              </div>
            </section>

            <section className="tags-section">
              <h2>Top Tags</h2>
              {tags.length === 0 ? (
                <p className="empty-state">No tags available for this user yet.</p>
              ) : (
                <div className="tags-grid">
                  {tags.map((item) => (
                    <div key={item.tag} className="tag-item">
                      <div className="tag-name">{item.tag}</div>
                      <div className="tag-count">{item.count}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
