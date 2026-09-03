import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { zohoAPI } from '../services/api';
import { getUser, removeToken, isAdmin } from '../utils/auth';
import ZohoCRMView from '../components/ZohoCRMView';
import ZohoDeskView from '../components/ZohoDeskView';
import ZohoBooksView from '../components/ZohoBooksView';
import ZohoPeopleView from '../components/ZohoPeopleView';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zohoData, setZohoData] = useState(null);
  const [showDataModal, setShowDataModal] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

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

  const fetchZohoData = async (appName) => {
    try {
      setDataLoading(true);
      setError('');
      let response;

      // Call appropriate API based on app name
      switch (appName) {
        case 'Zoho People':
          response = await zohoAPI.getPeopleData();
          break;
        case 'Zoho CRM':
          response = await zohoAPI.getCRMData();
          break;
        case 'Zoho Desk':
          response = await zohoAPI.getDeskData();
          break;
        case 'Zoho Books':
          response = await zohoAPI.getBooksData();
          break;
        default:
          throw new Error('Unknown Zoho application');
      }

      if (response.success) {
        setZohoData({
          appName,
          data: response.data,
          timestamp: new Date().toLocaleString()
        });
        setShowDataModal(true);
      }
    } catch (err) {
      setError(err.message || `Failed to fetch ${appName} data. Make sure ZOHO_REFRESH_TOKEN is configured.`);
      setZohoData(null);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const handleAppClick = async (appName) => {
    // Fetch Zoho data via backend proxy
    await fetchZohoData(appName);
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

      {/* Zoho Data Modal */}
      {showDataModal && zohoData && (
        <div className="modal-overlay" onClick={() => setShowDataModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{zohoData.appName} - Live Data</h2>
              <button className="modal-close" onClick={() => setShowDataModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {dataLoading ? (
                <div className="loading-state">Loading Zoho data...</div>
              ) : (
                <>
                  <div className="data-info">
                    <p><strong>Fetched at:</strong> {zohoData.timestamp}</p>
                    <p><strong>Source:</strong> Backend proxy using service account</p>
                  </div>

                  <div className="data-display">
                    {zohoData.appName === 'Zoho CRM' && <ZohoCRMView data={zohoData.data} />}
                    {zohoData.appName === 'Zoho Desk' && <ZohoDeskView data={zohoData.data} />}
                    {zohoData.appName === 'Zoho Books' && <ZohoBooksView data={zohoData.data} />}
                    {zohoData.appName === 'Zoho People' && <ZohoPeopleView data={zohoData.data} />}
                  </div>

                  <div className="modal-actions">
                    <button
                      className="btn-primary"
                      onClick={async () => {
                        const response = await zohoAPI.getAppUrl(zohoData.appName);
                        if (response.success && response.data.url) {
                          window.open(response.data.url, '_blank');
                        }
                      }}
                    >
                      Open Full {zohoData.appName} App
                    </button>
                    <button className="btn-secondary" onClick={() => setShowDataModal(false)}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
