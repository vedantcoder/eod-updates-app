import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi, teamsApi } from '../api/api';
import './Teams.css';

export default function Teams() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/dashboard');
      return;
    }
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    setError('');
    try {
      const [teamsRes, usersRes] = await Promise.all([teamsApi.getTeams(), adminApi.getUsers()]);
      setTeams(teamsRes.data.teams || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      setError('Failed to fetch teams');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="teams-container">
      <header className="teams-header">
        <h1>Teams</h1>
        <p>Manage and view team performance</p>
      </header>

      <main className="teams-content">
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="no-teams">No teams found</div>
        ) : (
          <div className="teams-grid">
            {teams.map(team => (
              <div
                key={team.id}
                className="team-card"
                onClick={() => navigate(`/teams/${team.id}`)}
              >
                <div className="team-icon">Team</div>
                <h3>{team.name}</h3>
                <p className="team-description">{team.description || 'Team'}</p>
                <p className="team-count">
                  {(users || []).filter((u) => u.team_id === team.id && !u.is_admin).length} members
                </p>
                <button className="view-btn">
                  View Team →
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
