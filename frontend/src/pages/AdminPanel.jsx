import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { getUser, removeToken, isAdmin } from '../utils/auth';
import UserManagement from '../components/UserManagement';
import AuditLogs from '../components/AuditLogs';
import PermissionManagement from '../components/PermissionManagement';
import './AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (!user) return 'A';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="admin-container">
      <nav className="navbar">
        <div className="navbar-left">
          <h2>Admin Panel</h2>
        </div>
        <div className="navbar-right">
          <div className="user-info">
            <div className="user-avatar">{getUserInitials()}</div>
            <div className="user-details">
              <h3>{user?.firstName} {user?.lastName}</h3>
              <p>Administrator</p>
            </div>
          </div>
          <div className="nav-links">
            <button onClick={() => navigate('/dashboard')} className="nav-link">
              Dashboard
            </button>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="admin-content">
        <div className="admin-header">
          <h1>System Administration</h1>
          <p>Manage users, roles, and view system audit logs</p>
        </div>

        {!loading && stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Users</h3>
              <div className="stat-value">{stats.totalUsers}</div>
            </div>
            <div className="stat-card">
              <h3>Active Users</h3>
              <div className="stat-value">{stats.activeUsers}</div>
            </div>
            <div className="stat-card">
              <h3>Total Roles</h3>
              <div className="stat-value">{stats.totalRoles}</div>
            </div>
          </div>
        )}

        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
          <button
            className={`admin-tab ${activeTab === 'permissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('permissions')}
          >
            Permissions
          </button>
          <button
            className={`admin-tab ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            Audit Logs
          </button>
        </div>

        {activeTab === 'users' && <UserManagement onUserChange={fetchStats} />}
        {activeTab === 'permissions' && <PermissionManagement />}
        {activeTab === 'audit' && <AuditLogs />}
      </div>
    </div>
  );
};

export default AdminPanel;
