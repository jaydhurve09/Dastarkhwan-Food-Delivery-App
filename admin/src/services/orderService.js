import axios from 'axios';
const url = 'http://localhost:5000/api'; // Adjust the URL as needed
import {useContext} from 'react';
import { AdminContext } from '../contexts/adminContext';
// how use context here


const updateOrderAgent = async (orderId, agentId) => {
    
  try {
    const token = localStorage.getItem('adminToken'); // Assuming you store the token in localStorage
    const response = await axios.put(
      `${url}/orders/update-agent`,
      { orderId, agentId },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      }
    );
    //reload the data after updating
   
    return response.data;
 
  } catch (error) {
    console.error('Update order agent error:', error.response?.data?.message || error.message);
    throw error.response?.data?.message || 'Failed to update order agent';
  }
};
const updateOrderStatus = async (orderId, status) => {
  try {
    const token = localStorage.getItem('adminToken'); // Assuming you store the token in localStorage
    const response = await axios.put(
      `${url}/orders/update-status`,
      { orderId, status },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      }
    );
    return response.data;
    fetchOrders();
  } catch (error) {
    console.error('Update order status error:', error.response?.data?.message || error.message);
    throw error.response?.data?.message || 'Failed to update order status';
  }
};
export { updateOrderAgent, updateOrderStatus };