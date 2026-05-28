import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './AddEODUpdate.css';

export default function AddEODUpdate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const logId = searchParams.get('edit');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    done: '',
    in_progress: '',
    blockers: '',
    hours: '',
    tags: []
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  useEffect(() => {
    if (!logId) {
      checkForTodayLog();
    } else {
      fetchLogData(logId);
    }
  }, [logId]);

  const checkForTodayLog = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/logs/check-today`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.exists) {
        setDuplicateWarning({
          exists: true,
          logId: response.data.log_id,
          message: 'You already have a log for today! Would you like to edit it instead?'
        });
      }
    } catch (err) {
      console.error('Failed to check for today log', err);
    }
  };

  const fetchLogData = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/logs/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const log = response.data;
      setFormData({
        done: log.done || '',
        in_progress: log.in_progress || '',
        blockers: log.blockers || '',
        hours: log.hours || '',
        tags: log.tags || []
      });
      setIsEditing(true);
    } catch (err) {
      setError('Failed to load log data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.done && !formData.in_progress && !formData.blockers) {
        setError('Please fill at least one field (done, in_progress, or blockers)');
        setLoading(false);
        return;
      }

      const payload = {
        done: formData.done || null,
        in_progress: formData.in_progress || null,
        blockers: formData.blockers || null,
        hours: parseInt(formData.hours) || 0,
        tags: formData.tags
      };

      if (logId) {
        await axios.put(
          `${API_URL}/logs/${logId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${API_URL}/logs`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save log');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-eod-container">
      <header className="add-eod-header">
        <h1>
          {isEditing ? 'Edit EOD Update' : 'New EOD Update'}
        </h1>
        <p>{isEditing ? 'Update your progress' : 'Log your end-of-day accomplishments'}</p>
      </header>

      <main className="add-eod-content">
        <div className="form-card">
          {error && <div className="error-message">{error}</div>}
          
          {duplicateWarning?.exists && (
            <div className="warning-message">
              <div className="warning-content">
                <span className="warning-icon">!</span>
                <div>
                  <p className="warning-title">Log Already Exists</p>
                  <p className="warning-text">{duplicateWarning.message}</p>
                </div>
              </div>
              <div className="warning-actions">
                <button 
                  onClick={() => navigate(`/add-eod-update?edit=${duplicateWarning.logId}`)}
                  className="warning-edit-btn"
                >
                  Edit Existing Log
                </button>
                <button 
                  onClick={() => setDuplicateWarning(null)}
                  className="warning-dismiss-btn"
                >
                  Create New Anyway
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <div className="section-header">
                <label htmlFor="done">Completed Today</label>
                <span className="section-hint">What did you finish?</span>
              </div>
              <textarea
                id="done"
                name="done"
                value={formData.done}
                onChange={handleInputChange}
                placeholder="e.g., Implemented login page, Fixed navbar bug, Completed code review..."
                rows="4"
              />
            </div>

            <div className="form-section">
              <div className="section-header">
                <label htmlFor="in_progress">In Progress</label>
                <span className="section-hint">What are you working on?</span>
              </div>
              <textarea
                id="in_progress"
                name="in_progress"
                value={formData.in_progress}
                onChange={handleInputChange}
                placeholder="e.g., Building dashboard, Testing API endpoints, Writing documentation..."
                rows="4"
              />
            </div>

            <div className="form-section">
              <div className="section-header">
                <label htmlFor="blockers">Blockers/Issues</label>
                <span className="section-hint">Any impediments?</span>
              </div>
              <textarea
                id="blockers"
                name="blockers"
                value={formData.blockers}
                onChange={handleInputChange}
                placeholder="e.g., Waiting for design approval, Database permission issue, Need clarification on requirements..."
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-section">
                <div className="section-header">
                  <label htmlFor="hours">Hours Worked</label>
                  <span className="section-hint">Total hours today</span>
                </div>
                <input
                  type="number"
                  id="hours"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  min="0"
                  max="24"
                  placeholder="8"
                  className="hours-input"
                />
              </div>
            </div>

            <div className="form-section">
              <div className="section-header">
                <label htmlFor="tag-input">Tags</label>
                <span className="section-hint">Add skills, projects, or categories</span>
              </div>
              <div className="tag-input-group">
                <input
                  type="text"
                  id="tag-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Type tag and press Enter or click Add"
                />
                <button
                  type="button"
                  className="add-tag-btn"
                  onClick={handleAddTag}
                >
                  Add Tag
                </button>
              </div>

              {formData.tags.length > 0 && (
                <div className="tags-list">
                  {formData.tags.map((tag, index) => (
                    <div key={index} className="tag-badge">
                      <span>{tag}</span>
                      <button
                        type="button"
                        className="remove-tag"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Saving...' : isEditing ? 'Update Log' : 'Create Log'}
              </button>
            </div>
          </form>
        </div>

        <aside className="tips-sidebar">
          <div className="tips-card">
            <h3>Tips</h3>
            <ul>
              <li>Be specific and detailed</li>
              <li>Mention technologies used</li>
              <li>List achievements first</li>
              <li>Be honest about blockers</li>
              <li>Use relevant tags for filtering</li>
            </ul>
          </div>

          <div className="example-card">
            <h3>Example</h3>
            <p className="example-text">
              <strong>Done:</strong> Completed user auth flow, merged PR #42
            </p>
            <p className="example-text">
              <strong>In Progress:</strong> Testing payment integration
            </p>
            <p className="example-text">
              <strong>Blockers:</strong> Awaiting API keys from finance team
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
