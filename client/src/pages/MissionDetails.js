import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import '../styles/MissionDetails.css';

const MissionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [logMessage, setLogMessage] = useState('');
  const [logSeverity, setLogSeverity] = useState('info');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const timerRef = useRef(null);
  const syncTimerRef = useRef(null);

  useEffect(() => {
    fetchMission();
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setIsAdmin(payload.role === 'admin');
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);

      syncTimerRef.current = setInterval(() => {
        syncTimerWithServer();
      }, 10000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [isTimerRunning]);

  const fetchMission = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/missions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMission(response.data);
      
      const timerResponse = await axios.get(`http://localhost:5000/api/missions/${id}/timer`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimer(timerResponse.data.timer);
      setIsTimerRunning(timerResponse.data.isRunning);
    } catch (err) {
      setError('Failed to fetch mission details');
    } finally {
      setLoading(false);
    }
  };

  const syncTimerWithServer = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/missions/${id}/timer`,
        { seconds: timer },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (err) {
      console.error('Failed to sync timer:', err);
    }
  };

  const handleTimerToggle = async () => {
    if (!isAdmin) {
      setAdminMessage('Only admins can control the mission timer');
      setTimeout(() => setAdminMessage(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const endpoint = isTimerRunning ? 'stop' : 'start';
      const response = await axios.post(
        `http://localhost:5000/api/missions/${id}/timer/${endpoint}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setTimer(response.data.currentTimer);
      setIsTimerRunning(!isTimerRunning);
    } catch (err) {
      setError('Failed to toggle timer');
    }
  };

  const handleComplete = async () => {
    if (!isAdmin) {
      setAdminMessage('Only admins can complete missions');
      setTimeout(() => setAdminMessage(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (isTimerRunning) {
        await handleTimerToggle();
      }
      
      await axios.post(
        `http://localhost:5000/api/missions/${id}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchMission();
    } catch (err) {
      setError('Failed to complete mission');
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/missions/${id}/logs`,
        {
          message: logMessage,
          severity: logSeverity
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setLogMessage('');
      fetchMission();
    } catch (err) {
      setError('Failed to add log');
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="mission-details">
        <p className="detail-value">Mission not found</p>
      </div>
    );
  }

  return (
    <div className="mission-details">
      {adminMessage && (
        <div className="admin-message">
          {adminMessage}
        </div>
      )}
      <div className="mission-header">
        <h1 className="mission-title">{mission.title}</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="back-button"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="mission-grid">
        <div className="mission-card mission-details-card">
          <h2 className="card-title">Mission Details</h2>
          <div className="detail-row">
            <div className="detail-group">
              <span className="detail-label">Status</span>
              <span className={`status-badge status-${mission.status}`}>
                {mission.status}
              </span>
            </div>
            <div className="detail-group">
              <span className="detail-label">Priority</span>
              <span className="detail-value">{mission.priority}</span>
            </div>
          </div>
          <div className="detail-group">
            <span className="detail-label">Started</span>
            <span className="detail-value">
              {format(new Date(mission.startTime), 'PPpp')}
            </span>
          </div>
          {mission.endTime && (
            <div className="detail-group">
              <span className="detail-label">Completed</span>
              <span className="detail-value">
                {format(new Date(mission.endTime), 'PPpp')}
              </span>
            </div>
          )}
          <div className="detail-group">
            <span className="detail-label">Description</span>
            <p className="detail-value">{mission.description}</p>
          </div>

          {mission.status === 'active' && (
            <button
              onClick={handleComplete}
              className="btn btn-primary"
            >
              Complete Mission
            </button>
          )}
        </div>

        <div className="mission-bottom-grid">
          <div className="mission-card mission-timer-card">
            <h2 className="card-title">Mission Timer</h2>
            <div className="mission-timer">
              {formatTime(timer)}
            </div>
            {mission.status === 'active' && (
              <button
                onClick={handleTimerToggle}
                className="btn btn-secondary"
              >
                {isTimerRunning ? 'Pause Timer' : 'Start Timer'}
              </button>
            )}
          </div>

          <div className="mission-card mission-logs-card">
            <h2 className="card-title">Mission Logs</h2>
            <div className="logs-container">
              {mission.logs?.map((log, index) => (
                <div key={index} className={`log-entry log-${log.severity}`}>
                  <p>{log.message}</p>
                  <small>{format(new Date(log.timestamp), 'PPpp')}</small>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddLog} className="log-form">
              <textarea
                value={logMessage}
                onChange={(e) => setLogMessage(e.target.value)}
                placeholder="Add a log entry..."
                className="log-input"
                rows="3"
              />
              <select
                value={logSeverity}
                onChange={(e) => setLogSeverity(e.target.value)}
                className="severity-select"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              <button type="submit" className="btn btn-primary">
                Add Log
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionDetails; 