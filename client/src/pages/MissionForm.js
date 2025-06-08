import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { missionsAPI } from '../utils/api';
import '../styles/MissionForm.css';

const MissionForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'active'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  useEffect(() => {
    const fetchMission = async () => {
      try {
        const response = await missionsAPI.getOne(id);
        setFormData(response.data);
      } catch (err) {
        setError('Failed to fetch mission details');
      }
    };

    if (isEditMode) {
      fetchMission();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEditMode) {
        await missionsAPI.update(id, formData);
      } else {
        await missionsAPI.create(formData);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to save mission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mission-form-container">
      <h1 className="mission-form-title">
        {isEditMode ? 'Edit Mission' : 'Create New Mission'}
      </h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="mission-form">
        <div className="form-group">
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="form-input"
            placeholder=" "
            required
          />
          <label htmlFor="title" className="form-label">Title</label>
        </div>

        <div className="form-group">
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-input"
            placeholder=" "
            rows="4"
            required
          />
          <label htmlFor="description" className="form-label">Description</label>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <div className="select-wrapper">
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="form-input"
                placeholder=" "
              >
                <option value="" disabled>Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <label htmlFor="priority" className="form-label">Priority</label>
            </div>
          </div>

          <div className="form-group">
            <div className="select-wrapper">
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-input"
                placeholder=" "
              >
                <option value="" disabled>Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              <label htmlFor="status" className="form-label">Status</label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <div className="loading-spinner" />
            ) : (
              isEditMode ? 'Update Mission' : 'Create Mission'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MissionForm; 