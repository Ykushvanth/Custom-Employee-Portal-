import { jwtDecode } from 'jwt-decode';

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export const hasRole = (roleName) => {
  const user = getUser();
  if (!user || !user.roles) return false;
  return user.roles.some(role => role.name === roleName);
};

export const isAdmin = () => {
  return hasRole('Admin');
};

export const getUserRoles = () => {
  const user = getUser();
  return user?.roles || [];
};

export const getUserPermissions = () => {
  const user = getUser();
  if (!user || !user.roles) return [];

  // Flatten all permissions from all roles
  const permissions = [];
  user.roles.forEach(role => {
    if (role.permissions) {
      permissions.push(...role.permissions);
    }
  });

  // Remove duplicates by permission name
  const uniquePermissions = Array.from(
    new Map(permissions.map(p => [p.name, p])).values()
  );

  return uniquePermissions;
};

export const hasPermission = (permissionName) => {
  const permissions = getUserPermissions();
  return permissions.some(p => p.name === permissionName);
};
