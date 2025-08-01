//create context for order management
import React, { createContext, useState } from 'react';


export const AdminContext = createContext();


const adminProvider = ({ children }) => {
  const url = "http://localhost:5000/api"; // Adjust the URL as needed
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [complaints, setComplaints] = useState([]);
const fetchOrders = async () => {
    try {
      const response = await fetch(`${url}/orders`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };
  const fetchDeliveryPartners = async () => {
    try {
      const response = await fetch(`${url}/delivery-partners/`);
      if (!response.ok) {
        throw new Error('Failed to fetch delivery partners');
      }
      const data = await response.json();
      setDeliveryPartners(data);
      
    } catch (error) {
      console.error('Error fetching delivery partners:', error);
    }
  };
  // Fetch orders when the provider mounts
  const fetchUsers = async () => {
    try {

      const response = await fetch(`${url}/users/all`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
      

    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  // Fetch feedback when the provider mounts
  const fetchFeedback = async () => {
    try {
      const response = await fetch(`${url}/feedback`);
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      const data = await response.json();
      setFeedback(data.data);
      
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };
  const fetchComplaints = async () => {
    try {
      const response = await fetch(`${url}/complaints`);
      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }
      const data = await response.json();
      setComplaints(data.data);
      
      
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };
  React.useEffect(() => {
    fetchOrders();
    fetchDeliveryPartners();
    fetchUsers();
    fetchFeedback();
    fetchComplaints();
  }, []);


  const value = {
    orders,
    deliveryPartners,
    users,
    fetchOrders,
    fetchDeliveryPartners,
    fetchUsers,
    fetchFeedback,
    feedback,
    complaints,
    fetchComplaints,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
export default adminProvider;
