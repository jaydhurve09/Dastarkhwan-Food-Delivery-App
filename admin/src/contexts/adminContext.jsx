//create context for order management
import React, { createContext, useState } from 'react';
import api from '../config/axios';

export const AdminContext = createContext();

const AdminProvider = ({ children }) => {
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [activeDeliveryPartners, setActiveDeliveryPartners] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchDeliveryPartners = async () => {
    try {
      const response = await api.get('/delivery-partners/');
      setDeliveryPartners(response.data);
    } catch (error) {
      console.error('Error fetching delivery partners:', error);
    }
  };

  const fetchActiveDeliveryPartners = async () => {
    try {
      const response = await api.get('/delivery-partners/active');
      setActiveDeliveryPartners(response.data);
    } catch (error) {
      console.error('Error fetching active delivery partners:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/all');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchFeedback = async () => {
    try {
      const response = await api.get('/feedback');
      setFeedback(response.data.data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/complaints');
      setComplaints(response.data.data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/menu-items');
      setMenuItems(response.data.menuItems || response.data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  React.useEffect(() => {
    // Only fetch data if user is authenticated
    const token = localStorage.getItem('adminToken');
    if (token) {
      fetchOrders();
      fetchDeliveryPartners();
      fetchActiveDeliveryPartners();
      fetchUsers();
      fetchFeedback();
      fetchComplaints();
      fetchMenuItems();
    }
  }, []);

  const value = {
    orders,
    deliveryPartners,
    activeDeliveryPartners,
    users,
    menuItems,
    fetchOrders,
    fetchDeliveryPartners,
    fetchActiveDeliveryPartners,
    fetchUsers,
    fetchMenuItems,
    feedback,
    fetchFeedback,
    complaints,
    fetchComplaints,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminProvider;
