//create context for order management
import React, { createContext, useState } from 'react';


export const AdminContext = createContext();


const adminProvider = ({ children }) => {
  const url = "http://localhost:5000/api"; // Adjust the URL as needed
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [orders, setOrders] = useState([]);
const fetchOrders = async () => {
    try {
      const response = await fetch(`${url}/orders`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data);
      console.log('Orders fetched successfully:', data);
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
      console.log('Delivery partners fetched successfully:', data);
    } catch (error) {
      console.error('Error fetching delivery partners:', error);
    }
  };
  // Fetch orders when the provider mounts
  React.useEffect(() => {
    fetchOrders();
    fetchDeliveryPartners();
  }, []);


  const value = {
    orders,
    deliveryPartners
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
export default adminProvider;
