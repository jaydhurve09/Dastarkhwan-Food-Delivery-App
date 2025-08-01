import axios from 'axios';

// Use Vite's import.meta.env for environment variables in Vite
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('Using API URL:', API_URL); // For debugging

// Get all users (real API call, filter isActive)
export const getAllUsers = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await axios.get(`${API_URL}/users/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    // Response can be array or {data: array}
    const users = Array.isArray(response.data) ? response.data : response.data.data || [];
    // Only active users, map to {id, email or name}
    return users.filter(u => u.isActive !== false).map(u => ({
      id: u.id || u._id,
      email: u.email || u.name || u.phone
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error.response?.data?.message || 'Failed to fetch users';
  }
};

// Get all menu items (real API call, filter isActive)
export const getAllMenuItems = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await axios.get(`${API_URL}/menu-items/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    // Response can be {success, data: array} or array
    const items = Array.isArray(response.data) ? response.data : response.data.data || [];
    // Only active items, map to {id, name}
    return items.filter(i => i.isActive !== false).map(i => ({
      id: i.id || i._id,
      name: i.name
    }));
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error.response?.data?.message || 'Failed to fetch menu items';
  }
};

// Get all categories (real API call, filter isActive)
export const getAllCategories = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await axios.get(`${API_URL}/menu-categories/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    // Response can be {success, data: array} or array
    const cats = Array.isArray(response.data) ? response.data : response.data.data || [];
    // Only active categories, map to {id, name}
    return cats.filter(c => c.isActive !== false).map(c => ({
      id: c.id || c._id,
      name: c.name
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error.response?.data?.message || 'Failed to fetch categories';
  }
};

// Get all promo codes
export const getPromoCodes = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.get(`${API_URL}/promo-codes`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    throw error.response?.data?.message || 'Failed to fetch promo codes';
  }
};

// Get active promo codes
export const getActivePromoCodes = async () => {
  try {
    const response = await axios.get(`${API_URL}/promo-codes/active`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching active promo codes:', error);
    throw error.response?.data?.message || 'Failed to fetch active promo codes';
  }
};

// Create a new promo code
export const createPromoCode = async (promoData) => {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.post(`${API_URL}/promo-codes`, promoData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating promo code:', error);
    if (error.response?.status === 401) {
      // Handle unauthorized access
      throw new Error('Your session has expired. Please log in again.');
    }
    throw error.response?.data?.message || 'Failed to create promo code';
  }
};

// Update a promo code
export const updatePromoCode = async (id, promoData) => {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.put(`${API_URL}/promo-codes/${id}`, promoData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    return response.data.data;
  } catch (error) {
    console.error('Error updating promo code:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please log in again.');
    }
    throw error.response?.data?.message || 'Failed to update promo code';
  }
};

// Delete a promo code
export const deletePromoCode = async (id) => {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.delete(`${API_URL}/promo-codes/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting promo code:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please log in again.');
    }
    throw error.response?.data?.message || 'Failed to delete promo code';
  }
};

// Validate a promo code
export const togglePromoCodeActive = async (id) => {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No authentication token found');
    const response = await axios.patch(
      `${API_URL}/promo-codes/${id}/toggle-active`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error toggling promo code status:', error);
    throw error.response?.data?.message || 'Failed to toggle promo code status';
  }
};

export const validatePromoCode = async (code, userId, orderTotal, items = [], isNewUser = false) => {
  try {
    const token = localStorage.getItem('adminToken');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.post(
      `${API_URL}/promo-codes/validate`,
      { code, userId, orderTotal, items, isNewUser },
      { 
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        withCredentials: true 
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error validating promo code:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please log in again.');
    }
    throw error.response?.data?.message || 'Failed to validate promo code';
  }
};
