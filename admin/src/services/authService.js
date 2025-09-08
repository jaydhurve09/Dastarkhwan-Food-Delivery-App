import api from '../config/axios';

const API_URL = '/auth';

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('adminToken');
};

const login = async (email, password) => {
  try {
    const response = await api.post(`${API_URL}/admin/login`, {
      email,
      password
    });

    if (response.data.token) {
      // Store the token in localStorage or a more secure storage
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminUser', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data?.message || error.message);
    throw error.response?.data?.message || 'Login failed. Please try again.';
  }
};

const logout = async () => {
  console.log('AuthService: Starting logout process');
  try {
    // Clear local storage first to ensure immediate logout
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
    // Clear any existing cookies
    document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    console.log('AuthService: Local storage cleared');
    
    // Try to call backend logout endpoint, but don't wait for it if it fails
    try {
      const response = await api.post(
        `${API_URL}/admin/logout`,
        {}
      );
      console.log('AuthService: Backend logout successful');
      return response.data;
    } catch (apiError) {
      console.warn('AuthService: Backend logout failed, but local logout completed:', apiError.message);
      // Don't throw here, local logout is more important
      return { message: 'Local logout completed' };
    }
  } catch (error) {
    console.error('Logout error:', error.response?.data || error.message);
    // Even if everything fails, ensure local storage is cleared
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    throw error;
  }
};

const getCurrentUser = () => {
  const user = localStorage.getItem('adminUser');
  return user ? JSON.parse(user) : null;
};

const getAuthToken = () => {
  return localStorage.getItem('adminToken');
};

// Check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    // Decode the token to get the expiration time
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    console.log('Token payload:', payload);
    console.log('Token exp:', payload.exp);
    console.log('Current time:', Date.now() / 1000);
    console.log('Token expired:', payload.exp < Date.now() / 1000);
    
    // Check if token is expired
    return payload.exp < Date.now() / 1000;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    console.error('Token that failed:', token);
    return true; // If there's an error, assume token is invalid
  }
};

const createSubAdmin = async (adminData) => {
  try {
    const response = await api.post(
      '/admins/subadmins',
      adminData
    );
    return response.data;
  } catch (error) {
    console.error('Create sub-admin error:', error.response?.data?.message || error.message);
    throw error.response?.data?.message || 'Failed to create sub-admin';
  }
};

const updateSubAdmin = async (id, adminData) => {
  try {
    const token = getToken();
    const response = await api.put(
      `/admins/${id}`,
      adminData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Update sub-admin error:', error.response?.data?.message || error.message);
    console.error('Full error:', error);
    throw error.response?.data?.message || 'Failed to update sub-admin';
  }
};

const getSubAdmins = async () => {
  try {
    const token = getToken();
    const response = await api.get(
      '/admins/subadmins',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Get sub-admins error:', error.response?.data?.message || error.message);
    throw error.response?.data?.message || 'Failed to fetch sub-admins';
  }
};

// Request password reset
const requestPasswordReset = async (email) => {
  try {
    const response = await api.post(
      `${API_URL}/admin/forgot-password`,
      { email },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Password reset request error:', error.response?.data?.message || error.message);
    throw error.response?.data?.message || 'Failed to process password reset request.';
  }
};

// Reset password with token
const resetPassword = async (token, password, passwordConfirm) => {
  try {
    const response = await api.patch(
      `${API_URL}/admin/reset-password/${token}`,
      { password, passwordConfirm },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Password reset error:', error.response?.data?.message || error.message);
    throw error.response?.data?.message || 'Failed to reset password. The link may have expired.';
  }
};

export const authService = {
  login,
  logout,
  getCurrentUser,
  getAuthToken,
  isTokenExpired,
  createSubAdmin,
  updateSubAdmin,
  getSubAdmins,
  requestPasswordReset,
  resetPassword
};

export {
  login,
  logout,
  getCurrentUser,
  getAuthToken,
  createSubAdmin,
  updateSubAdmin,
  getSubAdmins
};

export default {
  login,
  logout,
  getCurrentUser,
  getAuthToken,
  createSubAdmin,
  updateSubAdmin,
  getSubAdmins
};
