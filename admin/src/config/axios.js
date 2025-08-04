import axios from 'axios';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = authService.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Logout the user
        await authService.logout();
        
        // Show a toast message
        toast.error('Your session has expired. Please log in again.');
        
        // Redirect to login page
        window.location.href = '/admin/login';
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
