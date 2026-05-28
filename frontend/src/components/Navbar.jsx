import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => navigate('/dashboard')}>
          <span className="logo-icon">●</span>
          <span className="logo-text">DevPulse</span>
        </div>
        <div className="navbar-links">
          {user.is_admin ? (
            <>
              <a
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </a>
              <a
                className={`nav-link ${isActive('/teams') ? 'active' : ''}`}
                onClick={() => navigate('/teams')}
              >
                Teams
              </a>
            </>
          ) : (
            <>
              <a
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </a>
              <a
                className={`nav-link ${isActive('/add-eod-update') ? 'active' : ''}`}
                onClick={() => navigate('/add-eod-update')}
              >
                Add Update
              </a>
              <a
                className={`nav-link ${isActive('/analysis') ? 'active' : ''}`}
                onClick={() => navigate('/analysis')}
              >
                Analysis
              </a>
            </>
          )}
        </div>

        <div className="navbar-user">
          <div className="user-info">
            <div className="user-avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>
          <div className="user-meta-inline">
            <span className="meta-chip">{user.is_admin ? 'Admin' : 'User'}</span>
            <span className="meta-chip">{user.is_admin ? 'Owner' : (user.team_name || 'No Team')}</span>
          </div>

          <div className="user-menu-container">
            <button
              className="menu-toggle"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              ⋮
            </button>
            {showUserMenu && (
              <div className="dropdown-menu">
                <div className="menu-item disabled">
                  <span className="badge-label">Role:</span>
                  <span className="badge">
                    {user.is_admin ? 'Admin' : 'User'}
                  </span>
                </div>
                {user.team_name && (
                  <div className="menu-item disabled">
                    <span className="badge-label">Team:</span>
                    <span className="team-name">{user.team_name}</span>
                  </div>
                )}
                <hr />
                <button className="menu-item logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
