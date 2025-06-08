import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userRole, setUserRole] = useState('user');

  const fetchMissions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/missions?page=${currentPage}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMissions(response.data.missions);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch missions');
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchMissions();
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role);
    }
  }, [currentPage, fetchMissions]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleJoinMission = async (missionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/missions/${missionId}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchMissions();
    } catch (err) {
      setError('Failed to join mission');
    }
  };

  const handleLeaveMission = async (missionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/missions/${missionId}/leave`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchMissions();
    } catch (err) {
      setError('Failed to leave mission');
    }
  };

  if (loading) {
    return <div className="loading">Loading missions...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Mission Control Dashboard</h1>
        {userRole === 'admin' && (
          <Link to="/missions/new" className="create-mission-btn">
            Create New Mission
          </Link>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="missions-grid">
        {missions.map(mission => (
          <div key={mission._id} className="mission-card">
            <div className="mission-header">
              <h2>{mission.title}</h2>
              <span className={`status-badge ${mission.status}`}>
                {mission.status}
              </span>
            </div>
            <div className="mission-actions">
              <Link to={`/missions/${mission._id}`} className="view-details-btn">
                View Details
              </Link>
              {userRole !== 'admin' && mission.status === 'active' && (
                mission.participants?.some(p => p.user._id === localStorage.getItem('userId')) ? (
                  <button
                    onClick={() => handleLeaveMission(mission._id)}
                    className="leave-mission-btn"
                  >
                    Leave Mission
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoinMission(mission._id)}
                    className="join-mission-btn"
                  >
                    Join Mission
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 