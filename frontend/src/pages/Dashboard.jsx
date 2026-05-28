import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logsApi } from "../api/api";
import WeekTimeline from "../components/WeekTimeline";
import { getRecentWeekTabs, getWeekEndDate, getWeekStartDate, toDateKey } from "../utils/week";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const weekTabs = useMemo(() => getRecentWeekTabs(10), []);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await logsApi.getMyLogs(100, 0);
      setLogs(response.data || []);
    } catch (err) {
      setError("Failed to fetch logs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const logsForSelectedWeek = useMemo(() => {
    const weekStart = getWeekStartDate(selectedWeek);
    const weekEnd = getWeekEndDate(weekStart);
    const startKey = toDateKey(weekStart);
    const endKey = toDateKey(weekEnd);
    return logs
      .filter((log) => log.date >= startKey && log.date <= endKey)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [logs, selectedWeek]);

  const handleEdit = (log) => {
    navigate(`/add-eod-update?edit=${log.id}`);
  };

  const handleDelete = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this log?')) return;

    try {
      await logsApi.deleteLog(logId);
      await fetchLogs();
    } catch (err) {
      setError("Failed to delete log");
      console.error(err);
    }
  };

  return (
    <div className="dashboard-container">
      <main className="dashboard-content">
        {error && <div className="error-message">{error}</div>}

        <section className="week-tabs-card">
          <h2>Weekwise Logs</h2>
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
          <h2>Your EOD Updates</h2>
          {loading && <p className="loading">Loading logs...</p>}
          {!loading && (
            <WeekTimeline
              logs={logsForSelectedWeek}
              emptyText="No logs in this week yet."
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </section>
      </main>
    </div>
  );
}
