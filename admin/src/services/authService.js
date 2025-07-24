import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/admin/login`, {
      email,
      password
    }, {
      withCredentials: true, // Important for sending/receiving cookies
      headers: {
        'Content-Type': 'application/json'
      }
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

const logout = () => {
  // Remove user data from storage
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
};

const getCurrentUser = () => {
  const user = localStorage.getItem('adminUser');
  return user ? JSON.parse(user) : null;
};

const getAuthToken = () => {
  return localStorage.getItem('adminToken');
};

export const authService = {
  login,
  logout,
  getCurrentUser,
  getAuthToken
};

export default authService;
