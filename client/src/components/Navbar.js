import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          Mission Control
        </Link>
        
        <div className="user-menu">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <span className="user-name">{user?.username}</span>
          <button onClick={handleLogout} className="btn-logout" tabIndex="0">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 