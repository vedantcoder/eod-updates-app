import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi, analyticsApi, teamsApi } from '../api/api';
import { getWeekStartDate, toDateKey } from '../utils/week';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [teamStats, setTeamStats] = useState([]);
  const [userWeekStats, setUserWeekStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const statHint = {
    totalUsers: "Total non-admin users in scope.",
    totalLogs: "Number of EOD entries submitted.",
    totalHours: "Sum of hours logged across selected users.",
    avgHoursPerLog: "Average hours recorded per EOD log.",
    avgLogsPerUser: "Average number of logs per user.",
    avgHoursPerUser: "Average total logged hours per user.",
  };

  const fetchWithRetry = async (requestFn, retries = 2) => {
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await requestFn();
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError;
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const currentWeekStart = toDateKey(getWeekStartDate(0));
      const [statsRes, teamsRes, usersRes] = await Promise.allSettled([
        fetchWithRetry(() => analyticsApi.getGlobalStats()),
        teamsApi.getTeams(),
        adminApi.getUsers(),
      ]);

      const teams = teamsRes.status === "fulfilled" ? (teamsRes.value.data.teams || []) : [];
      const users = usersRes.status === "fulfilled" ? (usersRes.value.data.users || []).filter((entry) => !entry.is_admin) : [];

      const teamStatsResults = await Promise.allSettled(
        teams.map(async (team) => {
          const teamRes = await analyticsApi.getGlobalStats(team.id, currentWeekStart);
          return { team, stats: teamRes.data };
        })
      );
      const weekStatsResults = await Promise.allSettled(
        users.map(async (entry) => {
          const userRes = await analyticsApi.getUserStats(entry.id);
          return {
            id: entry.id,
            name: entry.name,
            email: entry.email,
            total_hours: userRes.data.total_hours || 0,
            log_count: userRes.data.log_count || 0,
          };
        })
      );

      setStats(statsRes.status === "fulfilled" ? (statsRes.value.data || null) : null);
      setTeamStats(
        teamStatsResults
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value)
      );
      setUserWeekStats(
        weekStatsResults
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value)
      );

      if (statsRes.status !== "fulfilled") {
        setError("Unable to fetch global stats right now.");
      }
    } catch (err) {
      setError('Failed to fetch global stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const avgLogsPerUser = stats?.total_users ? (stats.total_logs / stats.total_users).toFixed(1) : "0.0";
  const avgHoursPerUser = stats?.total_users ? (stats.total_hours_logged / stats.total_users).toFixed(1) : "0.0";
  const mostActiveTeam = [...teamStats].sort((a, b) => (b.stats?.total_hours_logged || 0) - (a.stats?.total_hours_logged || 0))[0];
  const leastActiveTeam = [...teamStats].sort((a, b) => (a.stats?.total_hours_logged || 0) - (b.stats?.total_hours_logged || 0))[0];
  const topContributors = [...userWeekStats]
    .sort((a, b) => (b.total_hours || 0) - (a.total_hours || 0))
    .slice(0, 5);
  const activeUserCount = userWeekStats.filter((entry) => entry.log_count > 0).length;
  const activityRate = userWeekStats.length ? Math.round((activeUserCount / userWeekStats.length) * 100) : 0;

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Global Dashboard</h1>
        <p>{user?.name || 'Admin'} • Organization-wide EOD snapshot</p>
      </header>

      <main className="admin-content">
        {error && <div className="error-message">{error}</div>}
        {loading && <p className="loading">Loading stats...</p>}
        {!loading && stats && (
          <>
            <section className="collective-stats-full">
              <h2>Global Stats</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.total_users}</div>
                  <div className="stat-label">Total Users <span className="info-icon" title={statHint.totalUsers}>i</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.total_logs}</div>
                  <div className="stat-label">Total Logs <span className="info-icon" title={statHint.totalLogs}>i</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.total_hours_logged}hr</div>
                  <div className="stat-label">Total Hours Logged <span className="info-icon" title={statHint.totalHours}>i</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{(stats.avg_hours_per_log || 0).toFixed(1)}hr</div>
                  <div className="stat-label">Avg Hours per Log <span className="info-icon" title={statHint.avgHoursPerLog}>i</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{avgLogsPerUser}</div>
                  <div className="stat-label">Avg Logs per User <span className="info-icon" title={statHint.avgLogsPerUser}>i</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{avgHoursPerUser}hr</div>
                  <div className="stat-label">Avg Hours per User <span className="info-icon" title={statHint.avgHoursPerUser}>i</span></div>
                </div>
              </div>
            </section>

            <section className="insights-grid">
              <article className="insight-card">
                <h3>Current Week Activity</h3>
                <p>{activeUserCount} of {userWeekStats.length} users submitted logs this week.</p>
                <strong>{activityRate}% participation</strong>
              </article>
              <article className="insight-card">
                <h3>Most Active Team</h3>
                <p>{mostActiveTeam?.team?.name || "N/A"}</p>
                <strong>{mostActiveTeam?.stats?.total_hours_logged || 0}hr this week</strong>
              </article>
              <article className="insight-card">
                <h3>Needs Attention</h3>
                <p>{leastActiveTeam?.team?.name || "N/A"}</p>
                <strong>{leastActiveTeam?.stats?.total_hours_logged || 0}hr this week</strong>
              </article>
            </section>

            <section className="collective-stats-full">
              <h2>Team Performance</h2>
              <div className="team-performance-list">
                {teamStats.map((entry) => (
                  <article key={entry.team.id} className="team-performance-card">
                    <div>
                      <h3>{entry.team.name}</h3>
                      <p>{entry.stats.total_users} users • {entry.stats.total_logs} logs</p>
                    </div>
                    <strong>{entry.stats.total_hours_logged}hr</strong>
                  </article>
                ))}
              </div>
            </section>

            <section className="collective-stats-full">
              <h2>Top Contributors This Week</h2>
              <div className="contributors-list">
                {topContributors.length === 0 && <p>No contributions yet this week.</p>}
                {topContributors.map((entry) => (
                  <article key={entry.id} className="contributor-row">
                    <div>
                      <h4>{entry.name}</h4>
                      <p>{entry.email}</p>
                    </div>
                    <div className="contributor-metrics">
                      <span>{entry.log_count} logs</span>
                      <strong>{entry.total_hours}hr</strong>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
