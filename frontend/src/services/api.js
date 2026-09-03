import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile')
};

// Zoho API
export const zohoAPI = {
  getAuthorizedApps: () => api.get('/zoho/apps'),
  getAppUrl: (appName) => api.get(`/zoho/apps/${appName}/url`)
};

// Admin API
export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getRoles: () => api.get('/admin/roles'),
  assignRole: (userId, roleId) => api.post(`/admin/users/${userId}/roles`, { roleId }),
  removeRole: (userId, roleId) => api.delete(`/admin/users/${userId}/roles/${roleId}`),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getStats: () => api.get('/admin/stats'),
  // Permission management
  getAllPermissions: () => api.get('/admin/permissions'),
  getRolePermissions: (roleId) => api.get(`/admin/roles/${roleId}/permissions`),
  addPermissionToRole: (roleId, permissionId) => api.post(`/admin/roles/${roleId}/permissions`, { permissionId }),
  removePermissionFromRole: (roleId, permissionId) => api.delete(`/admin/roles/${roleId}/permissions/${permissionId}`)
};

export default api;
