import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { zohoAPI } from '../services/api';
import { getUser, removeToken, isAdmin } from '../utils/auth';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuthorizedApps();
  }, []);

  const fetchAuthorizedApps = async () => {
    try {
      setLoading(true);
      const response = await zohoAPI.getAuthorizedApps();
      if (response.success) {
        setApps(response.data.apps);
      }
    } catch (err) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const handleAppClick = async (appName) => {
    try {
      const response = await zohoAPI.getAppUrl(appName);
      if (response.success && response.data.url) {
        window.open(response.data.url, '_blank');
      }
    } catch (err) {
      alert('Failed to open application: ' + err.message);
    }
  };

  const getAppIcon = (appName) => {
    const icons = {
      'Zoho People': '👥',
      'Zoho CRM': '📊',
      'Zoho Desk': '🎫',
      'Zoho Books': '📚'
    };
    return icons[appName] || '📱';
  };

  const getAppDescription = (appName) => {
    const descriptions = {
      'Zoho People': 'Human Resources Management System',
      'Zoho CRM': 'Customer Relationship Management',
      'Zoho Desk': 'Customer Support & Ticketing',
      'Zoho Books': 'Financial Management & Accounting'
    };
    return descriptions[appName] || 'Zoho Application';
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">Loading your applications...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-left">
          <h2>Employee Portal</h2>
        </div>
        <div className="navbar-right">
          <div className="user-info">
            <div className="user-avatar">{getUserInitials()}</div>
            <div className="user-details">
              <h3>{user?.firstName} {user?.lastName}</h3>
              <p>{user?.roles?.map(r => r.name).join(', ')}</p>
            </div>
          </div>
          <div className="nav-links">
            {isAdmin() && (
              <Link to="/admin" className="nav-link">
                Admin Panel
              </Link>
            )}
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Welcome back, {user?.firstName}!</h1>
          <p>Access your authorized Zoho applications below</p>
        </div>

        {error && (
          <div className="error-state">{error}</div>
        )}

        {!error && apps.length === 0 && (
          <div className="no-apps">
            <h3>No Applications Available</h3>
            <p>Please contact your administrator to assign you a role.</p>
          </div>
        )}

        {apps.length > 0 && (
          <div className="apps-grid">
            {apps.map((app) => (
              <div
                key={app.name}
                className="app-card"
                onClick={() => handleAppClick(app.name)}
              >
                <div className="app-icon">{getAppIcon(app.name)}</div>
                <h3>{app.name}</h3>
                <p>{getAppDescription(app.name)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
