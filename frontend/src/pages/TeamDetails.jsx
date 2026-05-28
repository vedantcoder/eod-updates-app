import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi, analyticsApi, teamsApi } from "../api/api";
import "./TeamDetails.css";

export default function TeamDetails() {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  const fetchTeamData = async () => {
    setLoading(true);
    setError("");
    try {
      const [teamsRes, usersRes, statsRes] = await Promise.allSettled([
        teamsApi.getTeams(),
        adminApi.getUsers(),
        analyticsApi.getGlobalStats(teamId),
      ]);
      const allTeams = teamsRes.status === "fulfilled" ? (teamsRes.value.data.teams || []) : [];
      const matchedTeam = allTeams.find((item) => item.id === teamId) || null;
      const allUsers = usersRes.status === "fulfilled" ? (usersRes.value.data.users || []) : [];
      const teamUsers = allUsers.filter((item) => item.team_id === teamId && !item.is_admin);

      setTeam(matchedTeam);
      setUsers(teamUsers);
      setStats(statsRes.status === "fulfilled" ? statsRes.value.data : null);

      if (statsRes.status === "rejected" && teamsRes.status === "rejected" && usersRes.status === "rejected") {
        setError("Failed to load team details");
      }
    } catch (err) {
      setError("Failed to load team details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const avgHoursPerUser = useMemo(() => {
    if (!stats?.total_users) return 0;
    return (stats.total_hours_logged || 0) / stats.total_users;
  }, [stats]);

  return (
    <div className="team-details-page">
      <div className="team-details-container">
        <header className="team-details-header">
          <button className="back-btn" onClick={() => navigate("/teams")}>
            ← Back to Teams
          </button>
          <div>
            <h1>{team?.name || "Team Overview"}</h1>
            <p>{team?.description || "Team analytics and employees"}</p>
          </div>
        </header>

        {error && <div className="error-message">{error}</div>}
        {loading && <p className="loading">Loading team details...</p>}

        {!loading && (
          <>
            <section className="team-stats-grid">
              <article className="team-stat-card">
                <span>Total Members</span>
                <strong>{stats?.total_users ?? 0}</strong>
              </article>
              <article className="team-stat-card">
                <span>Total Logs</span>
                <strong>{stats?.total_logs ?? 0}</strong>
              </article>
              <article className="team-stat-card">
                <span>Total Hours</span>
                <strong>{stats?.total_hours_logged ?? 0}hr</strong>
              </article>
              <article className="team-stat-card">
                <span>Avg Hours / Log</span>
                <strong>{(stats?.avg_hours_per_log || 0).toFixed(1)}hr</strong>
              </article>
              <article className="team-stat-card">
                <span>Avg Hours / Member</span>
                <strong>{avgHoursPerUser.toFixed(1)}hr</strong>
              </article>
            </section>

            <section className="team-members-section">
              <div className="section-title-row">
                <h2>Team Members</h2>
                <span>{users.length} employees</span>
              </div>

              {users.length === 0 ? (
                <p className="empty-state">No employees are assigned to this team yet.</p>
              ) : (
                <div className="members-grid">
                  {users.map((member) => (
                    <article
                      key={member.id}
                      className="member-card"
                      onClick={() => navigate(`/teams/${teamId}/${member.id}`)}
                    >
                      <div className="member-avatar">
                        {(member.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="member-body">
                        <h3>{member.name || "Unnamed User"}</h3>
                        <p>{member.email}</p>
                      </div>
                      <button className="member-view-btn">Open View</button>
                    </article>
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
