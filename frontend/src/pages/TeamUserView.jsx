import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../api/api";
import WeekTimeline from "../components/WeekTimeline";
import { getRecentWeekTabs, getWeekEndDate, getWeekStartDate, toDateKey } from "../utils/week";
import "./TeamUserView.css";

export default function TeamUserView() {
  const navigate = useNavigate();
  const { teamId, userId } = useParams();
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const weekTabs = useMemo(() => getRecentWeekTabs(10), []);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, userLogsRes] = await Promise.allSettled([
        adminApi.getUsers(),
        adminApi.getUserLogs(userId),
      ]);

      if (usersRes.status === "fulfilled") {
        setUsers(usersRes.value.data.users || []);
      }
      if (userLogsRes.status === "fulfilled") {
        setLogs(userLogsRes.value.data.logs || []);
      } else {
        setError("Failed to load user logs");
      }
    } catch (err) {
      setError("Failed to load user view");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = useMemo(() => users.find((item) => item.id === userId), [users, userId]);

  const logsForSelectedWeek = useMemo(() => {
    const weekStart = getWeekStartDate(selectedWeek);
    const weekEnd = getWeekEndDate(weekStart);
    const startKey = toDateKey(weekStart);
    const endKey = toDateKey(weekEnd);
    return logs
      .filter((log) => log.date >= startKey && log.date <= endKey)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [logs, selectedWeek]);

  return (
    <div className="team-user-page">
      <div className="team-user-container">
        <header className="team-user-header">
          <button className="back-btn" onClick={() => navigate(`/teams/${teamId}`)}>
            ← Back to Team
          </button>
          <div className="title-block">
            <h1>{selectedUser?.name || "User"} - Weekwise Logs</h1>
            <p>{selectedUser?.email || "Tracking user progress by week"}</p>
          </div>
          <button
            className="analysis-btn"
            onClick={() => navigate(`/teams/${teamId}/${userId}/analysis`)}
          >
            Show Analysis
          </button>
        </header>

        {error && <div className="error-message">{error}</div>}
        {loading && <p className="loading">Loading user logs...</p>}

        {!loading && (
          <>
            <section className="week-tabs-card">
              <h2>Weekwise Timeline</h2>
              <div className="week-tabs">
                {weekTabs.map((week) => (
                  <button
                    key={week.offset}
                    className={`week-tab ${selectedWeek === week.offset ? "active" : ""}`}
                    onClick={() => !week.disabled && setSelectedWeek(week.offset)}
                    disabled={week.disabled}
                    aria-label={week.disabled ? `${week.label} not available yet` : week.label}
                  >
                    <span>{week.label}</span>
                    <small>{week.dateLabel}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="logs-section">
              <WeekTimeline logs={logsForSelectedWeek} emptyText="No logs in this week." />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
