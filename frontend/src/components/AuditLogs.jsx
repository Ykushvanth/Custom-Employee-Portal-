import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [page, filterAction]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getAuditLogs({
        page,
        limit: 20,
        action: filterAction || undefined
      });

      if (response.success) {
        setLogs(response.data.logs);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'success': return 'badge-success';
      case 'failure': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  if (loading && logs.length === 0) {
    return <div className="loading-state">Loading audit logs...</div>;
  }

  return (
    <div className="section-card">
      <div className="section-header">
        <h2>Audit Logs</h2>
        <select
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value);
            setPage(1);
          }}
          className="btn-secondary"
        >
          <option value="">All Actions</option>
          <option value="login_success">Login Success</option>
          <option value="login_failed">Login Failed</option>
          <option value="user_created">User Created</option>
          <option value="user_updated">User Updated</option>
          <option value="user_deleted">User Deleted</option>
          <option value="role_assigned">Role Assigned</option>
          <option value="role_removed">Role Removed</option>
          <option value="zoho_app_access">Zoho App Access</option>
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Status</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{formatDate(log.createdAt)}</td>
                <td>
                  {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                  <br />
                  <small style={{ color: '#666' }}>{log.user?.email || '-'}</small>
                </td>
                <td>{log.action.replace(/_/g, ' ')}</td>
                <td>{log.resource || '-'}</td>
                <td>
                  <span className={`badge ${getStatusBadgeClass(log.status)}`}>
                    {log.status}
                  </span>
                </td>
                <td>{log.ipAddress || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button
            className="btn-secondary"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span style={{ padding: '8px 16px', color: '#666' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn-secondary"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
