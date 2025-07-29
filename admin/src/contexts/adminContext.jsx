//create context for order management
import React, { createContext, useState } from 'react';


export const OrderContext = createContext();

const adminProvider = ({ children }) => {
  const url = "http://localhost:5000/api"; // Adjust the URL as needed
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
  // Fetch orders when the provider mounts
  React.useEffect(() => {
    fetchOrders();
  }, []);


  const value = {
    orders
  };
  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};
export default adminProvider;