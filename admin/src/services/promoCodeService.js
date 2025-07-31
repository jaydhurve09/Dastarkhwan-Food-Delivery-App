import axios from 'axios';

// Use Vite's import.meta.env for environment variables in Vite
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('Using API URL:', API_URL); // For debugging

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
    const response = await axios.post(`${API_URL}/promo-codes`, promoData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating promo code:', error);
    throw error.response?.data?.message || 'Failed to create promo code';
  }
};

// Update a promo code
export const updatePromoCode = async (id, promoData) => {
  try {
    const response = await axios.put(`${API_URL}/promo-codes/${id}`, promoData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error updating promo code:', error);
    throw error.response?.data?.message || 'Failed to update promo code';
  }
};

// Delete a promo code
export const deletePromoCode = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/promo-codes/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting promo code:', error);
    throw error.response?.data?.message || 'Failed to delete promo code';
  }
};

// Validate a promo code
export const validatePromoCode = async (code, userId, orderTotal, items = [], isNewUser = false) => {
  try {
    const response = await axios.post(
      `${API_URL}/promo-codes/validate`,
      { code, userId, orderTotal, items, isNewUser }
    );
    return response.data;
  } catch (error) {
    console.error('Error validating promo code:', error);
    throw error.response?.data?.message || 'Failed to validate promo code';
  }
};
