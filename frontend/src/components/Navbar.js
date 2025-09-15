// components/Navbar.js
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/dashboard" className="brand-link">
            <h2>Xeno CRM</h2>
          </Link>
        </div>
        
        <div className="navbar-nav">
          <Link 
            to="/dashboard" 
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/campaigns" 
            className={`nav-link ${isActive('/campaigns') || isActive('/campaigns/create') ? 'active' : ''}`}
          >
            Campaigns
          </Link>
        </div>

        <div className="navbar-user">
          {user && (
            <div className="user-info">
              {user.picture && (
                <img 
                  src={user.picture} 
                  alt="Profile" 
                  className="user-avatar"
                />
              )}
              <span className="user-name">{user.name}</span>
              <button 
                onClick={handleLogout} 
                className="logout-btn"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;