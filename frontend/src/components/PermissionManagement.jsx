import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const PermissionManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all permissions
      const permResponse = await adminAPI.getAllPermissions();
      if (permResponse.success) {
        setPermissions(permResponse.data.permissions);
      }

      // Fetch all roles
      const rolesResponse = await adminAPI.getRoles();
      if (rolesResponse.success) {
        const roleList = rolesResponse.data.roles;
        setRoles(roleList);

        // Fetch permissions for each role
        const rolePermsMap = {};
        for (const role of roleList) {
          const rolePermsResponse = await adminAPI.getRolePermissions(role.id);
          if (rolePermsResponse.success) {
            rolePermsMap[role.id] = rolePermsResponse.data.role.permissions.map(p => p.id);
          }
        }
        setRolePermissions(rolePermsMap);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (roleId, permissionId) => {
    return rolePermissions[roleId]?.includes(permissionId) || false;
  };

  const handlePermissionToggle = async (roleId, permissionId, currentlyHas) => {
    try {
      setUpdating(true);
      setError('');

      if (currentlyHas) {
        await adminAPI.removePermissionFromRole(roleId, permissionId);
      } else {
        await adminAPI.addPermissionToRole(roleId, permissionId);
      }

      // Update local state
      setRolePermissions(prev => ({
        ...prev,
        [roleId]: currentlyHas
          ? prev[roleId].filter(id => id !== permissionId)
          : [...(prev[roleId] || []), permissionId]
      }));
    } catch (err) {
      setError(err.message || 'Failed to update permission');
      // Revert on error - refetch data
      fetchData();
    } finally {
      setUpdating(false);
    }
  };

  const groupPermissionsByResource = () => {
    const grouped = {};
    permissions.forEach(perm => {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push(perm);
    });
    return grouped;
  };

  const getResourceDisplayName = (resource) => {
    const names = {
      'users': 'User Management',
      'roles': 'Role Management',
      'zoho_apps': 'Zoho Applications',
      'audit_logs': 'Audit Logs'
    };
    return names[resource] || resource;
  };

  if (loading) {
    return <div className="loading-state">Loading permissions...</div>;
  }

  const groupedPermissions = groupPermissionsByResource();

  return (
    <div className="section-card">
      <div className="section-header">
        <h2>Permission Management</h2>
        <button className="btn-secondary" onClick={fetchData} disabled={updating} style={{ width: 'auto', padding: '8px 16px', flex: 'none' }}>
          Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="permissions-info" style={{
        background: '#f8f9fa',
        padding: '12px 16px',
        borderRadius: '6px',
        marginBottom: '20px',
        fontSize: '14px',
        color: '#64748B'
      }}>
        <strong>ℹ️ Permission Management:</strong> Toggle checkboxes to add or remove permissions from each role.
        Changes are applied immediately and logged in the audit system.
      </div>

      {updating && (
        <div style={{
          background: '#fff3cd',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '14px',
          color: '#856404'
        }}>
          Updating permissions...
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: '800px' }}>
          <thead>
            <tr>
              <th style={{ minWidth: '200px' }}>Permission</th>
              {roles.map(role => (
                <th key={role.id} style={{ textAlign: 'center', minWidth: '100px' }}>
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedPermissions).map(([resource, perms]) => (
              <>
                <tr key={`header-${resource}`} style={{ background: '#f8fafc' }}>
                  <td colSpan={roles.length + 1} style={{
                    fontWeight: 600,
                    color: '#334155',
                    padding: '12px 16px',
                    fontSize: '14px'
                  }}>
                    {getResourceDisplayName(resource)}
                  </td>
                </tr>
                {perms.map(permission => (
                  <tr key={permission.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 500, color: '#0f172a' }}>
                          {permission.name.replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {permission.description}
                        </span>
                      </div>
                    </td>
                    {roles.map(role => {
                      const hasIt = hasPermission(role.id, permission.id);
                      return (
                        <td key={`${role.id}-${permission.id}`} style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={hasIt}
                            onChange={() => handlePermissionToggle(role.id, permission.id, hasIt)}
                            disabled={updating}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: updating ? 'not-allowed' : 'pointer'
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: '#f0f9ff',
        borderRadius: '6px',
        borderLeft: '3px solid #3b82f6'
      }}>
        <strong style={{ color: '#1e40af', fontSize: '14px' }}>📋 Summary:</strong>
        <div style={{ marginTop: '8px', fontSize: '13px', color: '#475569' }}>
          Managing {permissions.length} permissions across {roles.length} roles.
          All changes are tracked in the audit log for compliance and security.
        </div>
      </div>
    </div>
  );
};

export default PermissionManagement;
