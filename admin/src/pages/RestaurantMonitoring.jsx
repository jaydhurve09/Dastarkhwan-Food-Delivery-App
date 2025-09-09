import React, { useState, useEffect, useContext } from 'react';
import { FaStar, FaEdit, FaTrash, FaPlus, FaUpload, FaCheck, FaTimes, FaMotorcycle } from 'react-icons/fa';
import { MdOutlineRefresh } from "react-icons/md";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AdminContext } from '../contexts/adminContext';
import api from '../config/axios';

const API_BASE_URL = 'http://localhost:5000/api';

// --- MOCK DATA ---
const initialMenuItems = [
  {
    id: 1,
    name: 'Margherita Pizza',
    price: { full: 12.99 },
    subCategory: 'Veg',
    subDishes: [{ name: 'Extra Cheese', price: 120 }, { name: 'Olives', price: 60 }],
    available: true,
    category: 'Pizzas',
    description: 'Classic pizza with mozzarella cheese and fresh basil.',
    image: 'https://via.placeholder.com/150',
    recommendation: ['recommended'] // Changed to array
  },
  {
    id: 2,
    name: 'Pepperoni Pizza',
    price: { full: 14.99 },
    tags: ['non-veg', 'spicy'],
    available: true,
    category: 'Pizzas',
    description: 'Spicy pepperoni on a cheesy base.',
    image: 'https://via.placeholder.com/150',
    recommendation: ['mostLoved'] // Changed to array
  },
  {
    id: 3,
    name: 'Caesar Salad',
    price: { full: 8.99 },
    tags: ['veg', 'healthy'],
    available: false,
    category: 'Starters',
    description: 'Fresh romaine lettuce with Caesar dressing.',
    image: 'https://via.placeholder.com/150',
    recommendation: [] // Changed to array (empty if none)
  },
  {
    id: 4,
    name: 'Chicken Biryani',
    price: { full: 18.99 },
    subCategory: 'Chicken',
    available: true,
    category: 'Biryani',
    description: 'Fragrant basmati rice cooked with succulent chicken.',
    image: 'https://via.placeholder.com/150',
    recommendation: ['recommended', 'mostLoved'] // Both selected
  },
];

const initialOrders = [
  { id: '#1024', cartPrice: 1250, dishes: [{ name: 'Chicken Biryani', qty: 2 }, { name: 'Coke', qty: 2 }], location: '123 Main St, Anytown', status: 'Pending' },
  { id: '#1025', cartPrice: 800, dishes: [{ name: 'Veg Pizza', qty: 1 }, { name: 'Garlic Bread', qty: 1 }], location: '456 Oak Ave, Sometown', status: 'Pending' },
];

const initialReviews = [
  { id: 1, user: 'John Doe', rating: 4, comment: 'Great pizza, fast delivery!', date: '2024-07-20' },
  { id: 2, user: 'Jane Smith', rating: 5, comment: 'The best pasta in town.', date: '2024-07-18' },
];

const initialHours = {
  Monday: { open: '09:00', close: '22:00' },
  Tuesday: { open: '09:00', close: '22:00' },
  Wednesday: { open: '09:00', close: '22:00' },
  Thursday: { open: '09:00', close: '22:00' },
  Friday: { open: '09:00', close: '23:00' },
  Saturday: { open: '10:00', close: '23:00' },
  Sunday: { open: '10:00', close: '21:00' },
};
// --- END MOCK DATA ---

// This component injects a <style> block to handle responsive design,
// as media queries are not supported in React's inline styles.
const ResponsiveStyles = () => (
  <style>
    {`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .spin {
        animation: spin 1s linear infinite;
      }

      @media (max-width: 768px) {
        .responsive-grid-container {
          grid-template-columns: 1fr !important;
        }

        .responsive-table thead {
          display: none;
        }

        .responsive-table tbody {
          display: block;
        }

        .responsive-table tr {
          display: block;
          margin-bottom: 1em;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1em;
        }

        .responsive-table td {
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: right;
          border-bottom: 1px solid #eee;
          padding: 12px 0;
        }

        .responsive-table td:last-child {
          border-bottom: none;
        }

        .responsive-table .action-cell-container {
          justify-content: flex-end;
        }
      }
    `}
  </style>
);

// Reusable Modal Component
const Modal = ({ children, isOpen, onClose }) => {
  if (!isOpen) return null;
  const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    content: { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '600px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' },
    closeButton: { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', zIndex: 1 }
  };
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.content} onClick={e => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
};

const DEFAULT_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvcnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

const RestaurantMonitoring = () => {
  const { deliveryPartners, orders, users, fetchOrders, activeDeliveryPartners, fetchActiveDeliveryPartners } = useContext(AdminContext);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews] = useState(initialReviews);
  const [operatingHours, setOperatingHours] = useState(initialHours);
  const [isOnline, setIsOnline] = useState(true);
 
  const [profile, setProfile] = useState({
    name: 'Dastarkhwan Restaurant',
    deliveryTime: '30-45 min',
    logo: null,
  });

  // State for delivery partner assignment
  const [selectedPartners, setSelectedPartners] = useState({});
  const [assigningOrders, setAssigningOrders] = useState(new Set());

  // State for modals and forms
  const [isMenuModalOpen, setMenuModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({
    name: '',
    isActive: true,
    hasSubcategories: false,
    subCategories: []
  });
  const [subCategoryInput, setSubCategoryInput] = useState('');
  const [success, setSuccess] = useState('');

  // Add state to track active section
  const [activeSection, setActiveSection] = useState('menu'); // 'menu' or 'categories'

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      console.log('Fetching categories with token:', token);

      const response = await axios.get(`${API_BASE_URL}/menu-categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      console.log('Categories API response:', response);

      if (response.data && response.data.data) {
        console.log('Setting categories:', response.data.data);
        setCategories(response.data.data);
      } else {
        console.warn('Unexpected response format:', response.data);
        setCategories([]);
      }
    } catch (err) {
      console.error('Error in fetchCategories:', err);
      console.error('Error response:', err.response);
      setError('Failed to load categories. Please try again.');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add these state variables near the top of your component with other state declarations
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [ongoingOrders, setOngoingOrders] = useState([]); // New state for ongoing orders
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingOngoing, setIsLoadingOngoing] = useState(true); // New loading state
  const [ordersError, setOrdersError] = useState(null);
  const [autoAssignPartners, setAutoAssignPartners] = useState(true); // Auto-assignment toggle
  
  // Search state variables
  const [incomingOrdersSearch, setIncomingOrdersSearch] = useState('');
  const [ongoingOrdersSearch, setOngoingOrdersSearch] = useState('');
  const [deliveryPartnerFilter, setDeliveryPartnerFilter] = useState('all'); // 'all', 'assigned', 'unassigned'

  // Filter functions for search
  const filteredIncomingOrders = incomingOrders.filter(order => {
    if (!incomingOrdersSearch.trim()) return true;
    
    const searchTerm = incomingOrdersSearch.toLowerCase();
    const orderId = (order.orderId || order.id || '').toString().toLowerCase();
    const customerName = (order.userInfo?.display_name || order.userInfo?.name || '').toLowerCase();
    const status = (order.orderStatus || '').toLowerCase();
    const total = (order.orderTotal || 0).toString();
    const date = order.order_Date ? new Date(order.order_Date.seconds * 1000).toLocaleDateString().toLowerCase() : '';
    const items = order.products ? order.products.map(p => (p.name || '').toLowerCase()).join(' ') : '';
    
    return orderId.includes(searchTerm) || 
           customerName.includes(searchTerm) || 
           status.includes(searchTerm) || 
           total.includes(searchTerm) || 
           date.includes(searchTerm) || 
           items.includes(searchTerm);
  });

  const filteredOngoingOrders = ongoingOrders.filter(order => {
    // Filter by delivery partner status
    if (deliveryPartnerFilter === 'assigned' && !order.assigningPartner && !order.partnerAssigned) {
      return false;
    }
    if (deliveryPartnerFilter === 'unassigned' && (order.assigningPartner || order.partnerAssigned)) {
      return false;
    }
    
    // Filter by search term
    if (!ongoingOrdersSearch.trim()) return true;
    
    const searchTerm = ongoingOrdersSearch.toLowerCase();
    const orderId = (order.orderId || order.id || '').toString().toLowerCase();
    const customerName = (order.userInfo?.display_name || order.userInfo?.name || '').toLowerCase();
    const status = (order.orderStatus || '').toLowerCase();
    const total = (order.orderTotal || 0).toString();
    const date = order.order_Date ? new Date(order.order_Date.seconds * 1000).toLocaleDateString().toLowerCase() : '';
    const items = order.products ? order.products.map(p => (p.name || '').toLowerCase()).join(' ') : '';
    const partnerName = order.partnerAssigned?.partnerName?.toLowerCase() || '';
    
    return orderId.includes(searchTerm) || 
           customerName.includes(searchTerm) || 
           status.includes(searchTerm) || 
           total.includes(searchTerm) || 
           date.includes(searchTerm) || 
           items.includes(searchTerm) ||
           partnerName.includes(searchTerm);
  });

  // Fetch all orderedProduct documents from users subcollection
  const fetchYetToBeAcceptedOrders = async () => {
    try {
      setIsLoadingOrders(true);
      setOrdersError(null);
      
      const response = await api.get('/orders/yet-to-be-accepted');
      
      if (response.data) {
        console.log('Orders fetched:', response.data);
        console.log('First order structure:', response.data[0]);
        setIncomingOrders(response.data);
      } else {
        setIncomingOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orderedProduct documents:', error);
      setOrdersError('Failed to fetch orders');
      setIncomingOrders([]);
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Fetch ongoing orders from orders collection
  const fetchOngoingOrders = async () => {
    try {
      setIsLoadingOngoing(true);
      setOrdersError(null);
      
      const response = await api.get('/orders/ongoing');
      
      if (response.data) {
        console.log('Ongoing orders fetched:', response.data);
        setOngoingOrders(response.data);
      } else {
        setOngoingOrders([]);
      }
    } catch (error) {
      console.error('Error fetching ongoing orders:', error);
      setOrdersError('Failed to fetch ongoing orders');
      setOngoingOrders([]);
      toast.error('Failed to fetch ongoing orders');
    } finally {
      setIsLoadingOngoing(false);
    }
  };

  // Handle order acceptance and notify all active delivery partners
  const handleAcceptOrderWithNotification = async (orderId) => {
    try {
      console.log('Accepting order and notifying all delivery partners:', orderId);
      
      // Log which partners are eligible for notifications
      const eligiblePartners = activeDeliveryPartners.filter(partner => 
        partner.isActive === true && partner.isOnline === true
      );
      console.log('📋 Eligible partners for notification (active & online):');
      eligiblePartners.forEach(partner => {
        console.log(`  - ${partner.displayName || partner.name} (ID: ${partner.id}) - Active: ${partner.isActive}, Online: ${partner.isOnline}`);
      });
      
      // Call the new backend endpoint that accepts order and notifies all active partners
      const response = await api.patch(`/orders/${orderId}/accept-and-notify`);
      
      if (response.data.success) {
        const { data, notifiedPartners, message } = response.data;
        
        console.log('✅ Order accepted successfully:', data);
        console.log('📱 Notification sent to partners:');
        if (notifiedPartners && Array.isArray(notifiedPartners)) {
          notifiedPartners.forEach(partner => {
            console.log(`  ✅ Notified: ${partner.name || partner.displayName} (ID: ${partner.id})`);
          });
        } else {
          console.log('  ℹ️ No partner notification details returned from server');
        }
        console.log(`📊 Total partners notified: ${notifiedPartners?.length || 0}`);
        
        // Update local state - move order from incoming to ongoing
        const acceptedOrder = incomingOrders.find(order => order.id === orderId);
        if (acceptedOrder) {
          // Don't auto-assign partner, just move to ongoing with preparing status
          const updatedOrder = { 
            ...acceptedOrder, 
            orderStatus: 'preparing',
            assigningPartner: false // Don't show auto-assignment loading
          };
          setOngoingOrders(prev => [...prev, updatedOrder]);
          setIncomingOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
          
          // Show success message with notification count
          toast.success(`${message} - Order moved to preparing! Delivery partners will respond if available.`);
        }
        
        // Refresh both sections to ensure data consistency
        await fetchYetToBeAcceptedOrders();
        await fetchOngoingOrders();
      }
    } catch (error) {
      console.error('Error accepting order and notifying partners:', error);
      toast.error('Failed to accept order and send notifications');
    }
  };

  // Handle order status update - now works with orders collection
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log('Updating order status:', { orderId, newStatus });
      // Use the orders collection endpoint to update order status
      const response = await api.patch(`/orders/${orderId}/status`, { status: newStatus });

      // If marking as prepared and there's a delivery partner assigned, trigger notification
      if (newStatus === 'prepared') {
        try {
          // Find the order to get delivery partner info
          const currentOrder = ongoingOrders.find(order => order.id === orderId);
          if (currentOrder && currentOrder.partnerAssigned) {
            console.log('Triggering mark as prepared notification for order:', orderId);
            
            // Call test endpoint instead of Cloud Function for now
            const testResponse = await api.post('/test/test-mark-prepared', {
              orderId: orderId,
              deliveryPartnerId: currentOrder.partnerAssigned.partnerId || currentOrder.partnerAssigned.id,
              restaurantName: currentOrder.restaurantName || 'Restaurant',
              customerAddress: currentOrder.customerAddress || currentOrder.address,
              orderDetails: JSON.stringify(currentOrder.items || currentOrder.orderDetails || [])
            });
            
            console.log('✅ Mark as prepared test response:', testResponse.data);
            toast.success('Order marked as prepared and delivery partner trigger tested!');
          } else {
            toast.success('Order marked as prepared');
          }
        } catch (notificationError) {
          console.error('Error testing prepared notification:', notificationError);
          toast.warn('Order marked as prepared but notification test failed');
        }
      }

      // Update local state based on the status change
      if (newStatus === 'preparing') {
        // Move order from incoming to ongoing list
        const acceptedOrder = incomingOrders.find(order => order.id === orderId);
        if (acceptedOrder) {
          setOngoingOrders(prev => [...prev, { ...acceptedOrder, orderStatus: 'preparing' }]);
          toast.success('Order accepted and moved to ongoing');
        }
        // Remove from incoming orders
        setIncomingOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      } else if (newStatus === 'prepared') {
        // When marked as prepared, keep order in ongoing orders (don't remove it)
        // The order will show the dispatch button now
        if (!newStatus.includes('notification')) { // Only show this toast if notification toast wasn't shown
          toast.success('Order marked as prepared - ready for dispatch');
        }
      } else if (newStatus === 'dispatched') {
        // Remove from ongoing orders when dispatched
        setOngoingOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
        toast.success('Order dispatched');
      } else if (newStatus === 'declined') {
        // Remove from both incoming and ongoing orders when declined
        setIncomingOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
        setOngoingOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
        toast.success('Order declined');
      }

      // Refresh both sections to ensure data consistency
      await fetchYetToBeAcceptedOrders();
      await fetchOngoingOrders();

    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  // Fetch orders on component mount
  useEffect(() => {
    fetchYetToBeAcceptedOrders();
    fetchOngoingOrders();
    fetchActiveDeliveryPartners();
  }, []);

  const handleSaveProfile = () => {
    alert('Profile changes saved!');
  };

  // Handle delivery partner selection
  const handlePartnerSelection = (orderId, partnerId) => {
    setSelectedPartners(prev => ({
      ...prev,
      [orderId]: partnerId
    }));
  };

  // Handle delivery partner assignment with filtering for active/online partners
  const handleAssignPartner = async (orderId) => {
    const partnerId = selectedPartners[orderId];
    
    if (!partnerId) {
      toast.error('Please select a delivery partner first');
      return;
    }

    // Filter to only include active and online partners
    const availablePartners = activeDeliveryPartners.filter(partner => 
      partner.isActive === true && partner.isOnline === true
    );

    const selectedPartner = availablePartners.find(p => p.id === partnerId);
    if (!selectedPartner) {
      toast.error('Selected delivery partner is not available (offline or inactive)');
      return;
    }

    console.log('🎯 Manual assignment initiated:');
    console.log(`  Order ID: ${orderId}`);
    console.log(`  Selected Partner: ${selectedPartner.display_name || selectedPartner.name} (ID: ${partnerId})`);
    console.log(`  Partner Status - Active: ${selectedPartner.isActive}, Online: ${selectedPartner.isOnline}`);

    try {
      setAssigningOrders(prev => new Set([...prev, orderId]));

      const response = await api.patch(`/orders/${orderId}/assign-partner`, {
        partnerId: partnerId,
        partnerName: selectedPartner.display_name || selectedPartner.name,
        phone: selectedPartner.phone
      });

      if (response.data.success) {
        console.log('✅ Partner assignment successful');
        
        // Immediately update local state to show assignment
        setOngoingOrders(prev => prev.map(order => {
          if (order.id === orderId) {
            return {
              ...order,
              partnerAssigned: {
                partnerId: partnerId,
                partnerName: selectedPartner.display_name || selectedPartner.name,
                name: selectedPartner.display_name || selectedPartner.name,
                phone: selectedPartner.phone
              },
              driverPositions: selectedPartner.driverPositions || { lat: null, lng: null },
              assigningPartner: false
            };
          }
          return order;
        }));

        // Call the single partner notification endpoint (only notify the assigned partner)
        try {
          console.log('📱 Sending single partner assignment notification...');
          console.log(`  Target Partner: ${selectedPartner.display_name || selectedPartner.name} (ID: ${partnerId})`);
          
          // Find the order to get details for notification
          const currentOrder = ongoingOrders.find(order => order.id === orderId) || 
                              incomingOrders.find(order => order.id === orderId);
          
          const testResponse = await api.post('/test/test-single-partner-notification', {
            orderId: orderId,
            deliveryPartnerId: partnerId,
            partnerName: selectedPartner.display_name || selectedPartner.name,
            restaurantName: currentOrder?.restaurantName || 'Restaurant',
            customerAddress: currentOrder?.customerAddress || currentOrder?.deliveryAddress?.address || currentOrder?.address || 'Customer Address'
          });
          
          console.log('✅ Single partner assignment notification response:', testResponse.data);
          console.log(`📧 Notification sent to: ${selectedPartner.display_name || selectedPartner.name}`);
          toast.success(`${selectedPartner.display_name || selectedPartner.name} assigned and notified!`);
        } catch (notificationError) {
          console.error('❌ Error sending single partner assignment notification:', notificationError);
          console.log(`❌ Failed to notify: ${selectedPartner.display_name || selectedPartner.name}`);
          toast.warn(`${selectedPartner.display_name || selectedPartner.name} assigned but notification failed`);
        }

        // Refresh both sections to show updated status
        await fetchYetToBeAcceptedOrders();
        await fetchOngoingOrders();
        // Clear the selected partner for this order
        setSelectedPartners(prev => {
          const updated = { ...prev };
          delete updated[orderId];
          return updated;
        });
      } else {
        throw new Error(response.data.message || 'Failed to assign partner');
      }
    } catch (error) {
      console.error('❌ Error assigning delivery partner:', error);
      toast.error(error.response?.data?.message || 'Failed to assign delivery partner');
    } finally {
      setAssigningOrders(prev => {
        const updated = new Set(prev);
        updated.delete(orderId);
        return updated;
      });
    }
  };

  // Handle dispatching order (set orderStatus to 'dispatched')
  const handleDispatchOrder = async (orderId) => {
    try {
      console.log('Dispatching order:', orderId);
      
      const response = await api.patch(`/orders/${orderId}/dispatch`);
      
      if (response.data.success) {
        toast.success('Order dispatched successfully!');
        // Refresh both sections to show updated status
        await fetchYetToBeAcceptedOrders();
        await fetchOngoingOrders();
      } else {
        throw new Error(response.data.message || 'Failed to dispatch order');
      }
    } catch (error) {
      console.error('Error dispatching order:', error);
      toast.error(error.response?.data?.message || 'Failed to dispatch order');
    }
  };

  // Get delivery partner assignment status
  const getPartnerAssignmentStatus = (order) => {
    if (order.partnerAssigned) {
      return `Assigned to ${order.partnerAssigned.partnerName}`;
    }
    return 'Partner Not Assigned';
  };

  const handleSaveHours = () => {
    alert('Operational hours updated!');
  };

  const getOrderStatusStyle = (status) => {
    const baseStyle = {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'capitalize'
    };
  
    switch (status) {
      case 'yetToBeAccepted':
        return { ...baseStyle, backgroundColor: '#f39c12', color: 'white' };
      case 'preparing':
        return { ...baseStyle, backgroundColor: '#3498db', color: 'white' };
      case 'prepared':
        return { ...baseStyle, backgroundColor: '#2ecc71', color: 'white' };
      case 'dispatched':
        return { ...baseStyle, backgroundColor: '#9b59b6', color: 'white' };
      case 'delivered':
        return { ...baseStyle, backgroundColor: '#27ae60', color: 'white' };
      case 'declined':
        return { ...baseStyle, backgroundColor: '#e74c3c', color: 'white' };
      default:
        return { ...baseStyle, backgroundColor: '#95a5a6', color: 'white' };
    }
  };

  const RECOMMENDATION_TAGS = {
    RECOMMENDED: 'Recommended',
    MOST_LOVED: 'Most Loved'
  };

  const handleRecommendationTagChange = (tag) => {
    const newTags = new Set(selectedRecommendationTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedRecommendationTags(newTags);
  };

  const [price, setPrice] = useState('');

  useEffect(() => {
    if (editingItem) {
      const itemPrice = editingItem.price?.full || editingItem.price;
      setPrice(itemPrice ? parseFloat(itemPrice).toFixed(2) : '');
    } else {
      setPrice('');
    }
  }, [editingItem]);

  const handleMenuFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const foodType = formData.get('foodType');
    const token = localStorage.getItem('adminToken');

    // Get the selected category
    const selectedCategory = categories.find(cat => cat.id === formData.get('category'));

    // Determine the subcategory - use the selected subcategory if available
    // Otherwise, use the food type as fallback (but this should be avoided)
    const subCategory = selectedSubCategory || foodType;

    // Format tags to ensure consistent casing
    const formattedTags = Array.from(selectedRecommendationTags).map(tag => {
      // Convert to title case if needed
      if (tag === 'recommended') return 'Recommended';
      if (tag === 'mostLoved' || tag === 'most loved') return 'Most Loved';
      return tag;
    });

    // If category has subcategories but none is selected, show error
    if (selectedCategory?.subCategories?.length > 0 && !selectedSubCategory) {
      toast.error('Please select a subcategory', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    // Prepare the request data
    const requestFormData = new FormData();
    requestFormData.append('name', formData.get('name'));
    requestFormData.append('categoryId', formData.get('category'));
    requestFormData.append('subCategory', subCategory);
    requestFormData.append('isVeg', foodType === 'Veg' ? 'true' : 'false');
    requestFormData.append('price', parseFloat(price) || 0);
    requestFormData.append('description', formData.get('description') || '');
    requestFormData.append('tags', JSON.stringify(formattedTags));
    requestFormData.append('isActive', 'true');
    
    // Handle addOns properly - send as individual entries for FormData
    const addOnsArray = hasSubDishes && currentSubDishes.length > 0 ? currentSubDishes : [];
    addOnsArray.forEach((addOn, index) => {
      requestFormData.append(`addOns[${index}][name]`, addOn.name);
      requestFormData.append(`addOns[${index}][price]`, addOn.price);
    });
    
    // Add image file if selected
    const imageFile = formData.get('image');
    if (imageFile && imageFile.size > 0) {
      requestFormData.append('image', imageFile);
    }

    try {
      let response;
      const headers = {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type - let browser set it with boundary for multipart/form-data
      };

      if (editingItem && editingItem.id) {
        // Update existing menu item
        const editingId = extractIdFromDocRef(editingItem.id);
        response = await axios.put(
          `${API_BASE_URL}/menu-items/${editingId}`,
          requestFormData,
          { headers }
        );
        toast.success('Menu item updated successfully!', { /* ... */ });
      } else {
        // Create new menu item
        response = await axios.post(
          `${API_BASE_URL}/menu-items`,
          requestFormData,
          { headers }
        );

        toast.success('Menu item added successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }

      // Close the modal and reset form
      setMenuModalOpen(false);
      setEditingItem(null);
      setImagePreview(null);
      setSelectedSubCategory('');
      setHasSubDishes(false);
      setCurrentSubDishes([]);
      setSelectedRecommendationTags(new Set());

      // Refresh the menu items
      await fetchMenuItems();

    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error(error.response?.data?.message || 'Failed to save menu item', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Handle adding sub-dishes (add-ons)
  const handleAddSubDish = () => {
    if (subDishName && subDishPrice) {
      setCurrentSubDishes([...currentSubDishes, {
        name: subDishName,
        price: parseFloat(subDishPrice)
      }]);
      setSubDishName('');
      setSubDishPrice('');
    }
  };

  // Handle removing a sub-dish (add-on)
  const handleRemoveSubDish = (index) => {
    const newSubDishes = [...currentSubDishes];
    newSubDishes.splice(index, 1);
    setCurrentSubDishes(newSubDishes);
  };

  // Group menu items by category
  const menuByCategory = menuItems.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  const getFoodTypeStyle = (isVeg) => ({
    padding: '4px 8px',
    borderRadius: '12px',
    backgroundColor: isVeg ? '#e8f8f0' : '#fdedec',
    color: isVeg ? '#27ae60' : '#e74c3c',
    border: `1px solid ${isVeg ? '#27ae60' : '#e74c3c'}`,
    fontSize: '0.8em',
    fontWeight: 'bold',
    display: 'inline-block'
  });

  const getStatusStyle = (isActive) => ({
    padding: '4px 8px',
    borderRadius: '12px',
    backgroundColor: isActive ? '#e8f5e8' : '#f5f5f5',
    color: isActive ? '#27ae60' : '#666',
    border: `1px solid ${isActive ? '#27ae60' : '#ddd'}`,
    fontSize: '0.8em',
    fontWeight: 'bold',
    display: 'inline-block'
  });

  const getButtonStyle = (bgColor) => ({
    backgroundColor: bgColor,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'background-color 0.2s',
    '&:hover': {
      opacity: 0.9
    }
  });

  // Styles
  const styles = {
    pageContainer: { padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9f9f9' },
    gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(700px, 1fr))', gap: '20px' },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    cardTitle: { fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#333' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '1px solid #ddd', backgroundColor: '#f2f2f2' },
    td: { padding: '12px', borderBottom: '1px solid #ddd', verticalAlign: 'middle' },
    button: {
      padding: '10px 15px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
    },
    editButton: { backgroundColor: '#3498db', color: 'white' },
    deleteButton: { backgroundColor: '#e74c3c', color: 'white' },
    addButton: { backgroundColor: '#2ecc71', color: 'white', marginTop: '15px' },
    toggleSwitch: {
      position: 'relative',
      display: 'inline-block',
      width: '60px',
      height: '34px',
    },
    toggleInput: { opacity: 0, width: 0, height: 0 },
    toggleSlider: { position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#ccc', transition: '.4s', borderRadius: '34px' },
    toggleSliderBefore: { position: 'absolute', content: '""', height: '26px', width: '26px', left: '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' },
    input: { width: '100%', padding: '10px', margin: '5px 0 15px 0', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px', margin: '5px 0 15px 0', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px', boxSizing: 'border-box' },
    formGroup: {
      marginBottom: '15px',
      width: '100%',
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: '500',
      color: '#333',
    },
    imagePreview: { width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' },
    menuItemImage: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', marginRight: '15px' },
    categoryTitle: { fontSize: '1.8rem', color: '#1a2c3e', marginTop: '30px', marginBottom: '15px', borderBottom: '2px solid #1a2c3e', paddingBottom: '5px' },
    recommendationTag: {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '0.8em',
      color: 'white',
      marginRight: '5px',
      marginBottom: '5px',
    }
  };

  const sliderStyle = (isChecked) => ({ ...styles.toggleSlider, backgroundColor: isChecked ? '#2ecc71' : '#ccc' });
  const sliderBeforeStyle = (isChecked) => ({ ...styles.toggleSliderBefore, transform: isChecked ? 'translateX(26px)' : 'translateX(0)' });

  const [selectedRecommendationTags, setSelectedRecommendationTags] = useState(new Set());
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [currentSubCategories, setCurrentSubCategories] = useState([]);
  const [hasSubDishes, setHasSubDishes] = useState(false);
  const [currentSubDishes, setCurrentSubDishes] = useState([]);
  const [subDishName, setSubDishName] = useState('');
  const [subDishPrice, setSubDishPrice] = useState('');
  const [foodType, setFoodType] = useState('Veg');

  // useEffect(() => {
  //   if (editingItem) {
  //     // Set the current subcategories based on the selected category
  //     const selectedCategory = categories.find(cat => cat.id === editingItem.categoryId);
  //     if (selectedCategory) {
  //       setCurrentSubCategories(selectedCategory.subCategories || []);
        
  //       // If the category has subcategories and the editing item has a subcategory, select it
  //       if (selectedCategory.subCategories && selectedCategory.subCategories.length > 0 && editingItem.subCategory) {
  //         setSelectedSubCategory(editingItem.subCategory);
  //       }
  //     } else {
  //       // If no category is found (e.g., new item), ensure subcategories are reset
  //       setCurrentSubCategories([]);
  //       setSelectedSubCategory('');
  //     }
  //   } else {
  //     // Reset when not editing
  //     setCurrentSubCategories([]);
  //     setSelectedSubCategory('');
  //   }
  // }, [editingItem, categories]);

  useEffect(() => {
    if (editingItem) {
      // Set form fields for editing an existing item
      const itemPrice = editingItem.price || 0;
      setPrice(itemPrice ? parseFloat(itemPrice).toFixed(2) : '');
      setFoodType(editingItem.isVeg === true ? 'Veg' : 'Non-Veg');
  
      const tagsSet = new Set(editingItem.tags || []);
      setSelectedRecommendationTags(tagsSet);
      
      const addOns = editingItem.addOns || [];
      setHasSubDishes(addOns.length > 0);
      setCurrentSubDishes(addOns);
  
      // Find the category for the item and set subcategories
      const selectedCategory = categories.find(cat => cat.id === editingItem.categoryId);
      if (selectedCategory) {
        setCurrentSubCategories(selectedCategory.subCategories || []);
        // Set the selected subcategory if it exists
        setSelectedSubCategory(editingItem.subCategory || '');
      } else {
        setCurrentSubCategories([]);
        setSelectedSubCategory('');
      }
    } else {
      // Reset form fields for a new item
      setPrice('');
      setFoodType('Veg');
      setSelectedRecommendationTags(new Set());
      setHasSubDishes(false);
      setCurrentSubDishes([]);
      setCurrentSubCategories([]);
      setSelectedSubCategory('');
    }
  }, [editingItem]);

  // Fetch orders on component mount
  useEffect(() => {
    fetchYetToBeAcceptedOrders();
    fetchOngoingOrders();
  }, []);

  const handleCategoryInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCategory(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Add a function to handle subcategory input
  const handleAddSubCategory = () => {
    if (subCategoryInput.trim()) {
      setNewCategory(prev => ({
        ...prev,
        subCategories: [...prev.subCategories, subCategoryInput.trim()]
      }));
      setSubCategoryInput('');
    }
  };

  // Function to remove a subcategory
  const handleRemoveSubCategory = (index) => {
    setNewCategory(prev => ({
      ...prev,
      subCategories: prev.subCategories.filter((_, i) => i !== index)
    }));
  };

  // Add new category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
  
      // Format subcategories as an array of strings
      const formattedSubCategories = newCategory.hasSubcategories
        ? (Array.isArray(newCategory.subCategories)
          ? newCategory.subCategories
          : (newCategory.subCategories || '').split(',').map(s => s.trim()).filter(Boolean)
        )
        : [];
  
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', newCategory.name);
      formData.append('isActive', newCategory.isActive);
      formData.append('hasSubcategories', newCategory.hasSubcategories);
      formData.append('subCategories', JSON.stringify(formattedSubCategories));
      
      // Add image file if selected
      if (newCategory.imageFile) {
        formData.append('image', newCategory.imageFile);
      }
  
      const response = await axios.post(
        `${API_BASE_URL}/menu-categories`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );
  
      setCategories([...categories, response.data.data]);
      setSuccess('Category added successfully!');
      setCategoryModalOpen(false);
      setNewCategory({
        name: '',
        isActive: true,
        hasSubcategories: false,
        subCategories: [],
        imageFile: null,
        imagePreview: null
      });
      toast.success('Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      setError(error.response?.data?.message || 'Failed to add category');
      toast.error('Failed to add category');
    } finally {
      setIsLoading(false);
    }
  };

  // Update category
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      setIsLoading(true);
      setError('');

      // Format subcategories as an array of strings
      const formattedSubCategories = newCategory.hasSubcategories
        ? (Array.isArray(newCategory.subCategories)
          ? newCategory.subCategories
          : (newCategory.subCategories || '').split(',').map(s => s.trim()).filter(Boolean)
        )
        : [];

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', newCategory.name);
      formData.append('isActive', newCategory.isActive);
      formData.append('hasSubcategories', newCategory.hasSubcategories);
      formData.append('subCategories', JSON.stringify(formattedSubCategories));
      
      // Add image file if selected
      if (newCategory.imageFile) {
        formData.append('image', newCategory.imageFile);
      }

      const response = await axios.put(
        `${API_BASE_URL}/menu-categories/${editingCategory.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );

      setCategories(categories.map(cat =>
        cat.id === editingCategory.id ? response.data.data : cat
      ));
      setSuccess('Category updated successfully!');
      setCategoryModalOpen(false);
      setEditingCategory(null);
      toast.success('Category updated successfully!');
    } catch (error) {
      console.error('Error updating category:', error);
      setError(error.response?.data?.message || 'Failed to update category');
      toast.error('Failed to update category');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch menu items from the backend
  const fetchMenuItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/menu-items`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Handle different response structures
      let items = [];
      if (Array.isArray(response.data)) {
        items = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        items = response.data.data;
      } else if (response.data && response.data.items) {
        items = Array.isArray(response.data.items) ? response.data.items : [];
      }

      console.log('Fetched menu items:', items);
      console.log('Available categories:', categories);
      
      // Log category matching for debugging
      items.forEach(item => {
        const matchedCategory = categories.find(cat => cat.id === item.categoryId);
        if (!matchedCategory && item.categoryId) {
          console.warn(`No category found for item "${item.name}" with categoryId: ${item.categoryId}`);
        }
      });

      setMenuItems(items || []);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load menu items');
      setMenuItems([]);
      toast.error('Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  // Call fetchMenuItems when the component mounts
  useEffect(() => {
    fetchMenuItems();
  }, []);

  const handleDeleteMenuItem = async (id) => {
    try {
      // Extract string ID from Firestore DocumentReference if needed
      const itemId = typeof id === 'object' && id._path ? id._path.segments[id._path.segments.length - 1] : id;
      console.log('Deleting menu item with ID:', itemId);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }
      
      const response = await axios.delete(`${API_BASE_URL}/menu-items/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Menu item deleted:', response);
      toast.success('Menu item deleted successfully!');
      setMenuItems(prevItems => prevItems.filter(item => {
        const currentItemId = typeof item.id === 'object' && item.id._path ? item.id._path.segments[item.id._path.segments.length - 1] : item.id;
        return currentItemId !== itemId;
      }));
    } catch (error) {
      console.error('Error deleting menu item:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to delete menu item';
      toast.error(errorMessage);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/menu-categories/${id}`);
      console.log('Category deleted:', response);
      toast.success('Category deleted successfully!');
      setCategories(prevCategories => prevCategories.filter(category => category.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({
      ...category,
      imageFile: null,
      imagePreview: null
    });
    setCategoryModalOpen(true);
  };

  // Helper function to extract string ID from Firestore DocumentReference
  const extractIdFromDocRef = (docRef) => {
    if (typeof docRef === 'object' && docRef._path) {
      return docRef._path.segments[docRef._path.segments.length - 1];
    }
    return docRef;
  };

  const [menuItemNameCache, setMenuItemNameCache] = useState({});

  const extractMenuItemId = (ref) => {
    console.log('🔍 Extracting menu item ID from:', ref);
    if (!ref) return null;
    
    // Handle Firestore DocumentReference object with _path property
    if (ref && ref._path && ref._path.segments) {
      const segments = ref._path.segments;
      const id = segments[segments.length - 1];
      console.log('📝 Extracted ID from _path.segments:', id);
      return id;
    }
    
    // Handle different reference formats
    if (typeof ref === 'string') {
      // Handle Firestore document reference path like "menuItems/abc123" or "/menuItems/abc123"
      const parts = ref.split('/');
      const id = parts[parts.length - 1];
      console.log('📝 Extracted ID from string:', id);
      return id; // Get the last part (document ID)
    }
    
    // Handle Firestore DocumentReference object
    if (ref && ref.id) {
      console.log('📝 Extracted ID from object.id:', ref.id);
      return ref.id;
    }
    
    // Handle path property
    if (ref && ref.path && typeof ref.path === 'string') {
      const parts = ref.path.split('/');
      const id = parts[parts.length - 1];
      console.log('📝 Extracted ID from object.path:', id);
      return id;
    }
    
    console.log('❌ Could not extract ID from:', ref);
    return null;
  };

  const getMenuItemName = async (id) => {
    console.log('🍽️ Fetching menu item name for ID:', id);
    if (!id) return null;
    if (menuItemNameCache[id]) {
      console.log('✅ Found in cache:', menuItemNameCache[id]);
      return menuItemNameCache[id];
    }
    try {
      console.log('🌐 Making API call to:', `${API_BASE_URL}/menu-items/${id}`);
      const res = await axios.get(`${API_BASE_URL}/menu-items/${id}`);
      console.log('📡 API response:', res.data);
      const name = res.data?.name || res.data?.data?.name;
      if (name) {
        console.log('✅ Menu item name found:', name);
        setMenuItemNameCache((prev) => ({ ...prev, [id]: name }));
      } else {
        console.log('❌ No name found in response');
      }
      return name || null;
    } catch (e) {
      console.error(`❌ Error fetching menu item ${id}:`, e);
      console.error('Error details:', e.response?.data);
      return null;
    }
  };

  useEffect(() => {
    const resolveProductNames = async () => {
      console.log('🔄 Resolving product names for incoming orders:', incomingOrders);
      const idsToFetch = new Set();
      (incomingOrders || []).forEach((order) => {
        console.log('📦 Processing order:', order.orderId || order.id);
        const products = order?.products || [];
        console.log('🛍️ Order products:', products);
        products.forEach((p) => {
          const id = extractMenuItemId(
            p?.productRef || p?.menuItem || p?.menuItemRef || p?.itemRef || p?.itemId || p?.menuItemId || p?.productId
          );
          if (id && !menuItemNameCache[id]) {
            console.log('➕ Adding ID to fetch:', id);
            idsToFetch.add(id);
          }
        });
      });
      console.log('📋 IDs to fetch:', [...idsToFetch]);
      if (idsToFetch.size > 0) {
        await Promise.all([...idsToFetch].map((id) => getMenuItemName(id)));
      }
    };
    resolveProductNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingOrders]);

  useEffect(() => {
    const resolveOngoingProductNames = async () => {
      const idsToFetch = new Set();
      (ongoingOrders || []).forEach((order) => {
        const products = order?.products || [];
        products.forEach((p) => {
          const id = extractMenuItemId(
            p?.productRef || p?.menuItem || p?.menuItemRef || p?.itemRef || p?.itemId || p?.menuItemId || p?.productId
          );
          if (id && !menuItemNameCache[id]) idsToFetch.add(id);
        });
      });
      if (idsToFetch.size > 0) {
        await Promise.all([...idsToFetch].map((id) => getMenuItemName(id)));
      }
    };
    resolveOngoingProductNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ongoingOrders]);

  const renderIncomingOrders = () => (
    <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={styles.cardTitle}>Incoming Orders</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Auto-assignment toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
              Auto-assign Partners:
            </label>
            <label style={{ 
              position: 'relative',
              display: 'inline-block',
              width: '50px',
              height: '24px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={autoAssignPartners}
                onChange={(e) => setAutoAssignPartners(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: autoAssignPartners ? '#4CAF50' : '#ccc',
                borderRadius: '24px',
                transition: '0.3s',
                cursor: 'pointer'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: autoAssignPartners ? '29px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}></span>
              </span>
            </label>
            <span style={{ 
              fontSize: '12px', 
              color: autoAssignPartners ? '#4CAF50' : '#999',
              fontWeight: '500',
              minWidth: '30px'
            }}>
              {autoAssignPartners ? 'ON' : 'OFF'}
            </span>
          </div>
          <button 
            onClick={fetchYetToBeAcceptedOrders}
            style={{
              ...styles.button,
              backgroundColor: '#3498db',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              borderRadius: '60px',
            }}
          >
            <MdOutlineRefresh size={20}/>
          </button>
        </div>
      </div>

      {/* Search bar for incoming orders */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search orders by ID, customer, items, total, date, or status..."
          value={incomingOrdersSearch}
          onChange={(e) => setIncomingOrdersSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.3s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3498db'}
          onBlur={(e) => e.target.style.borderColor = '#ddd'}
        />
      </div>
  
      {isLoadingOrders ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading orders...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ ...styles.table, width: '100%' }}>
            <thead>
              <tr>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Items</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Delivery Partner</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncomingOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ ...styles.td, textAlign: 'center', padding: '40px', color: '#666' }}>
                    {ordersError ? (
                      <div>
                        <div style={{ fontSize: '18px', marginBottom: '10px' }}>⚠️ Error loading orders</div>
                        <div>{ordersError}</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '18px', marginBottom: '10px' }}>📋 No pending orders</div>
                        <div>All orders have been processed or there are no new orders at the moment.</div>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredIncomingOrders.map((order, index) => (
                  <tr key={`order-${order.id || index}`}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 'bold' }}>#{order.orderId || order.id}</div>
                    </td>
                    <td style={styles.td}>
                      {order.userInfo?.display_name || order.userInfo?.name || 'N/A'}
                    </td>
                    <td style={styles.td}>
                      {Array.isArray(order.products) && order.products.length > 0 ? (
                        <div>
                          <p className="font-medium">
                            {order.products.map((p, idx) => {
                              const id = extractMenuItemId(
                                p?.productRef || p?.menuItem || p?.menuItemRef || p?.itemRef || p?.itemId || p?.menuItemId || p?.productId
                              );
                              const name = p?.name || p?.itemName || p?.menuItemName || p?.item?.name || p?.product?.name || (id ? menuItemNameCache[id] : null) || 'Item';
                              const qty = p?.quantity || p?.qty || 1;
                              return (
                                <span key={idx}>
                                  {name} {qty ? `x${qty}` : ''}
                                  {idx < order.products.length - 1 ? ', ' : ''}
                                </span>
                              );
                            })}
                          </p>
                         
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">{order.itemName}</p>
                          {order.quantity ? (
                            <p className="text-gray-600">Qty: {order.quantity}</p>
                          ) : null}
                          {order.price && order.quantity ? (
                            <p className="text-gray-600">₹{order.price * order.quantity}</p>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      ₹{order.orderTotal?.toFixed(2) || '0.00'}
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontSize: '0.8em', color: '#666' }}>
                        {order.order_Date ? new Date(order.order_Date.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={getOrderStatusStyle(order.orderStatus)}>
                        {order.orderStatus || 'N/A'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
                        {order.partnerAssigned ? (
                          <div style={{ 
                            padding: '8px 12px', 
                            backgroundColor: '#e8f5e8', 
                            borderRadius: '6px',
                            border: '1px solid #c3e6c3'
                          }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9em', color: '#2d5f2d' }}>
                              {order.partnerAssigned.name || order.partnerAssigned.partnerName}
                            </div>
                            {(order.partnerAssigned.phone) && (
                              <div style={{ fontSize: '0.8em', color: '#666' }}>
                                📞 {order.partnerAssigned.phone}
                              </div>
                            )}
                            <div style={{ fontSize: '0.75em', color: '#2d5f2d', marginTop: '4px' }}>
                              ✅ Partner Assigned
                            </div>
                            <button
                              onClick={() => handleDispatchOrder(order.id)}
                              style={{
                                marginTop: '8px',
                                padding: '6px 12px',
                                backgroundColor: '#9b59b6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.8em',
                                cursor: 'pointer',
                                width: '100%'
                              }}
                            >
                              Dispatch
                            </button>
                          </div>
                        ) : order.orderStatus === 'dispatched' ? (
                          <div style={{ 
                            padding: '8px 12px', 
                            backgroundColor: '#e6e2ff', 
                            borderRadius: '6px',
                            border: '1px solid #d1c7ff'
                          }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9em', color: '#6b46c1' }}>
                              {order.partnerAssigned ? (order.partnerAssigned.name || order.partnerAssigned.partnerName) : 'Delivery Partner'}
                            </div>
                            {order.partnerAssigned && order.partnerAssigned.phone && (
                              <div style={{ fontSize: '0.8em', color: '#666' }}>
                                📞 {order.partnerAssigned.phone}
                              </div>
                            )}
                            <div style={{ fontSize: '0.75em', color: '#6b46c1', marginTop: '4px' }}>
                              🚀 Dispatched
                            </div>
                          </div>
                        ) : order.orderStatus === 'declined' ? (
                          <div style={{ 
                            padding: '8px 12px', 
                            backgroundColor: '#f8d7da', 
                            borderRadius: '6px',
                            border: '1px solid #f5c6cb'
                          }}>
                            <div style={{ fontSize: '0.9em', color: '#721c24', fontWeight: 'bold' }}>
                              Order Declined
                            </div>
                            <div style={{ fontSize: '0.8em', color: '#721c24', marginTop: '2px' }}>
                              No further action required
                            </div>
                          </div>
                        ) : activeDeliveryPartners.filter(partner => 
                            partner.isActive === true && partner.isOnline === true
                          ).length > 0 ? (
                          <div>
                            <div style={{ 
                              padding: '8px 12px', 
                              backgroundColor: '#d1ecf1', 
                              borderRadius: '6px',
                              border: '1px solid #bee5eb',
                              marginBottom: '8px'
                            }}>
                              <div style={{ fontSize: '0.9em', color: '#0c5460', fontWeight: 'bold' }}>
                                ⏳ Awaiting Partner Response
                              </div>
                              <div style={{ fontSize: '0.8em', color: '#0c5460', marginTop: '2px' }}>
                                FCM notifications sent to all active partners
                              </div>
                            </div>
                            <div style={{ 
                              padding: '4px 8px', 
                              backgroundColor: '#f8f9fa', 
                              borderRadius: '4px',
                              border: '1px solid #dee2e6',
                              marginBottom: '6px',
                              fontSize: '0.8em',
                              color: '#6c757d'
                            }}>
                              Or assign manually:
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                              <select
                                value={selectedPartners[order.id] || ''}
                                onChange={(e) => handlePartnerSelection(order.id, e.target.value)}
                                style={{
                                  flex: 1,
                                  padding: '6px 8px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  fontSize: '0.85em',
                                  backgroundColor: 'white'
                                }}
                                disabled={assigningOrders.has(order.id)}
                              >
                                <option value="">Select Partner</option>
                                {activeDeliveryPartners
                                  .filter(partner => partner.isActive === true && partner.isOnline === true)
                                  .map(partner => (
                                    <option key={partner.id} value={partner.id}>
                                      {partner.display_name || partner.name} - {partner.phone || 'No phone'}
                                    </option>
                                  ))}
                              </select>
                              <button
                                onClick={() => handleAssignPartner(order.id)}
                                disabled={!selectedPartners[order.id] || assigningOrders.has(order.id)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: assigningOrders.has(order.id) ? '#ccc' : '#f39c12',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.8em',
                                  cursor: assigningOrders.has(order.id) ? 'not-allowed' : 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                                               {assigningOrders.has(order.id) ? 'Assigning...' : 'Assign'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ 
                            padding: '8px 12px', 
                            backgroundColor: '#fff3cd', 
                            borderRadius: '6px',
                            border: '1px solid #ffeaa7',
                            fontSize: '0.85em',
                            color: '#856404'
                          }}>
                            No Active/Online Partners Available
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {order.orderStatus === 'yetToBeAccepted' ? (
                          <>
                            <button
                              onClick={() => handleAcceptOrderWithNotification(order.id)}
                              style={{
                                ...styles.button,
                                backgroundColor: '#2ecc71',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                fontSize: '12px',
                                padding: '6px 12px'
                              }}
                            >
                              <FaCheck /> Accept & Notify All Partners
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'declined')}
                              style={{
                                ...styles.button,
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                fontSize: '12px',
                                padding: '6px 12px'
                              }}
                            >
                              <FaTimes /> Decline
                            </button>
                          </>
                        ) : order.orderStatus === 'preparing' ? (
                          <>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'prepared')}
                              style={{
                                ...styles.button,
                                backgroundColor: '#3498db',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                fontSize: '12px',
                                padding: '6px 12px'
                              }}
                            >
                              Mark as Prepared
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'declined')}
                              style={{
                                ...styles.button,
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                fontSize: '12px',
                                padding: '6px 12px'
                              }}
                            >
                              <FaTimes /> Decline
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderOngoingOrders = () => (
    <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={styles.cardTitle}>Ongoing Orders</h2>
        <button 
          onClick={fetchOngoingOrders}
          style={{
            ...styles.button,
            backgroundColor: '#3498db',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            borderRadius: '60px',
          }}
        >
          <MdOutlineRefresh size={20}/>
        </button>
      </div>

      {/* Filter and Search controls for ongoing orders */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: 'bold', color: '#2c3e50' }}>Filter by Partner:</label>
          <select
            value={deliveryPartnerFilter}
            onChange={(e) => setDeliveryPartnerFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              minWidth: '150px'
            }}
          >
            <option value="all">All Orders</option>
            <option value="assigned">Partner Assigned</option>
            <option value="unassigned">No Partner Assigned</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <input
            type="text"
            placeholder="Search orders by ID, customer, items, total, date, status, or delivery partner..."
            value={ongoingOrdersSearch}
            onChange={(e) => setOngoingOrdersSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.3s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3498db'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>
      </div>
  
      {isLoadingOngoing ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading orders...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ ...styles.table, width: '100%' }}>
            <thead>
              <tr>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Items</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Delivery Partner</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOngoingOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ ...styles.td, textAlign: 'center', padding: '40px', color: '#666' }}>
                    {ordersError ? (
                      <div>
                        <div style={{ fontSize: '18px', marginBottom: '10px' }}>⚠️ Error loading orders</div>
                        <div>{ordersError}</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '18px', marginBottom: '10px' }}>📋 No ongoing orders</div>
                        <div>All orders have been processed or there are no ongoing orders at the moment.</div>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredOngoingOrders.map((order, index) => (
                  <tr key={`order-${order.id || index}`}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 'bold' }}>#{order.orderId || order.id}</div>
                    </td>
                    <td style={styles.td}>
                      {order.userInfo?.display_name || order.userInfo?.name || 'N/A'}
                    </td>
                    <td style={styles.td}>
                      {Array.isArray(order.products) && order.products.length > 0 ? (
                        <div>
                          <p className="font-medium">
                            {order.products.map((p, idx) => {
                              const id = extractMenuItemId(
                                p?.productRef || p?.menuItem || p?.menuItemRef || p?.itemRef || p?.itemId || p?.menuItemId || p?.productId
                              );
                              const name = p?.name || p?.itemName || p?.menuItemName || p?.item?.name || p?.product?.name || (id ? menuItemNameCache[id] : null) || 'Item';
                              const qty = p?.quantity || p?.qty || 1;
                              return (
                                <span key={idx}>
                                  {name} {qty ? `x${qty}` : ''}
                                  {idx < order.products.length - 1 ? ', ' : ''}
                                </span>
                              );
                            })}
                          </p>
                          {order.orderTotal ? (
                            <p className="text-gray-600">Total: ₹{order.orderTotal}</p>
                          ) : null}
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">{order.itemName}</p>
                          {order.quantity ? (
                            <p className="text-gray-600">Qty: {order.quantity}</p>
                          ) : null}
                          {order.price && order.quantity ? (
                            <p className="text-gray-600">₹{order.price * order.quantity}</p>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      ₹{order.orderTotal?.toFixed(2) || '0.00'}
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontSize: '0.8em', color: '#666' }}>
                        {order.order_Date ? new Date(order.order_Date.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={getOrderStatusStyle(order.orderStatus)}>
                        {order.orderStatus || 'N/A'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
                        {order.partnerAssigned ? (
                          <div style={{ 
                            padding: '8px 12px', 
                            backgroundColor: '#e8f5e8', 
                            borderRadius: '6px',
                            border: '1px solid #c3e6c3'
                          }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9em', color: '#2d5f2d' }}>
                              {order.partnerAssigned.name || order.partnerAssigned.partnerName}
                            </div>
                            {(order.partnerAssigned.phone) && (
                              <div style={{ fontSize: '0.8em', color: '#666' }}>
                                📞 {order.partnerAssigned.phone}
                              </div>
                            )}
                            <div style={{ fontSize: '0.75em', color: '#2d5f2d', marginTop: '4px' }}>
                              ✅ Partner Assigned
                            </div>
                            <button
                              onClick={() => handleDispatchOrder(order.id)}
                              style={{
                                marginTop: '8px',
                                padding: '6px 12px',
                                backgroundColor: '#9b59b6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.8em',
                                cursor: 'pointer',
                                width: '100%'
                              }}
                            >
                              Dispatch
                            </button>
                          </div>
                        ) : order.orderStatus === 'dispatched' ? (
                          <div style={{ 
                            padding: '8px 12px', 
                            backgroundColor: '#e6e2ff', 
                            borderRadius: '6px',
                            border: '1px solid #d1c7ff'
                          }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9em', color: '#6b46c1' }}>
                              {order.partnerAssigned ? (order.partnerAssigned.name || order.partnerAssigned.partnerName) : 'Delivery Partner'}
                            </div>
                            {order.partnerAssigned && order.partnerAssigned.phone && (
                              <div style={{ fontSize: '0.8em', color: '#666' }}>
                                📞 {order.partnerAssigned.phone}
                              </div>
                            )}
                            <div style={{ fontSize: '0.75em', color: '#6b46c1', marginTop: '4px' }}>
                              🚀 Dispatched
                            </div>
                          </div>
                        ) : order.orderStatus === 'declined' ? (
                          <div style={{ 
                            padding: '8px 12px', 
                            backgroundColor: '#f8d7da', 
                            borderRadius: '6px',
                            border: '1px solid #f5c6cb'
                          }}>
                            <div style={{ fontSize: '0.9em', color: '#721c24', fontWeight: 'bold' }}>
                              Order Declined
                            </div>
                            <div style={{ fontSize: '0.8em', color: '#721c24', marginTop: '2px' }}>
                              No further action required
                            </div>
                          </div>
                        ) : activeDeliveryPartners.filter(partner => 
                            partner.isActive === true && partner.isOnline === true
                          ).length > 0 ? (
                          <div>
                            <div style={{ 
                              padding: '8px 12px', 
                              backgroundColor: '#d1ecf1', 
                              borderRadius: '6px',
                              border: '1px solid #bee5eb',
                              marginBottom: '8px'
                            }}>
                              <div style={{ fontSize: '0.9em', color: '#0c5460', fontWeight: 'bold' }}>
                                ⏳ Awaiting Partner Response
                              </div>
                              <div style={{ fontSize: '0.8em', color: '#0c5460', marginTop: '2px' }}>
                                FCM notifications sent to all active partners
                              </div>
                            </div>
                            <div style={{ 
                              padding: '4px 8px', 
                              backgroundColor: '#f8f9fa', 
                              borderRadius: '4px',
                              border: '1px solid #dee2e6',
                              marginBottom: '6px',
                              fontSize: '0.8em',
                              color: '#6c757d'
                            }}>
                              Or assign manually:
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                              <select
                                value={selectedPartners[order.id] || ''}
                                onChange={(e) => handlePartnerSelection(order.id, e.target.value)}
                                style={{
                                  flex: 1,
                                  padding: '6px 8px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  fontSize: '0.85em',
                                  backgroundColor: 'white'
                                }}
                                disabled={assigningOrders.has(order.id)}
                              >
                                <option value="">Select Partner</option>
                                {activeDeliveryPartners
                                  .filter(partner => partner.isActive === true && partner.isOnline === true)
                                  .map(partner => (
                                    <option key={partner.id} value={partner.id}>
                                      {partner.display_name || partner.name} - {partner.phone || 'No phone'}
                                    </option>
                                  ))}
                              </select>
                              <button
                                onClick={() => handleAssignPartner(order.id)}
                                disabled={!selectedPartners[order.id] || assigningOrders.has(order.id)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: assigningOrders.has(order.id) ? '#ccc' : '#f39c12',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.8em',
                                  cursor: assigningOrders.has(order.id) ? 'not-allowed' : 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {assigningOrders.has(order.id) ? 'Assigning...' : 'Assign'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ 
                            padding: '8px 12px', 
                            backgroundColor: '#fff3cd', 
                            borderRadius: '6px',
                            border: '1px solid #ffeaa7',
                            fontSize: '0.85em',
                            color: '#856404'
                          }}>
                            No Active/Online Partners Available
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {order.orderStatus === 'yetToBeAccepted' ? (
                          <>
                            <button
                              onClick={() => handleAcceptOrderWithNotification(order.id)}
                              style={{
                                ...styles.button,
                                backgroundColor: '#2ecc71',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                fontSize: '12px',
                                padding: '6px 12px'
                              }}
                            >
                              <FaCheck /> Accept & Notify All Partners
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'declined')}
                              style={{
                                ...styles.button,
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                fontSize: '12px',
                                padding: '6px 12px'
                              }}
                            >
                              <FaTimes /> Decline
                            </button>
                          </>
                        ) : order.orderStatus === 'preparing' ? (
                          <>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'prepared')}
                              style={{
                                ...styles.button,
                                backgroundColor: '#3498db',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                fontSize: '12px',
                                padding: '6px 12px'
                              }}
                            >
                              Mark as Prepared
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'declined')}
                              style={{
                                ...styles.button,
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                fontSize: '12px',
                                padding: '6px 12px'
                              }}
                            >
                              <FaTimes /> Decline
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div style={styles.pageContainer}>
      <ResponsiveStyles />
      <ToastContainer />
      {/* --- Modals --- */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          setEditingCategory(null);
          setNewCategory({
            name: '',
            isActive: true,
            hasSubcategories: false,
            subCategories: [],
            imageFile: null,
            imagePreview: null
          });
          setSubCategoryInput('');
          setError('');
        }}
      >
        <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '1.5rem' }}>
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h3>

          <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="categoryName">Category Name</label>
              <input
                id="categoryName"
                type="text"
                name="name"
                value={newCategory.name}
                onChange={handleCategoryInputChange}
                style={styles.input}
                placeholder="e.g., Main Course, Desserts"
                required
              />
            </div>

            {/* Category Image Upload */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Category Image</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setNewCategory(prev => ({ ...prev, imageFile: file }));
                      // Create preview
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setNewCategory(prev => ({ ...prev, imagePreview: e.target.result }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#fff'
                  }}
                />
                {(newCategory.imagePreview || newCategory.image) && (
                  <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                    <img
                      src={newCategory.imagePreview || newCategory.image}
                      alt="Category preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #ddd'
                      }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        console.log('Remove button clicked');
                        console.log('editingCategory:', editingCategory);
                        console.log('newCategory:', newCategory);
                        
                        // Check if we're removing an existing image from an existing category
                        const hasExistingImage = editingCategory && editingCategory.id && (editingCategory.image || editingCategory.imageFileName);
                        const isNewlySelectedImage = newCategory.imageFile || newCategory.imagePreview;
                        
                        console.log('hasExistingImage:', hasExistingImage);
                        console.log('isNewlySelectedImage:', isNewlySelectedImage);
                        
                        // If there's an existing image and we're not just removing a newly selected preview
                        if (hasExistingImage && (!isNewlySelectedImage || (newCategory.image && !newCategory.imageFile))) {
                          try {
                            console.log('Calling delete API for category:', editingCategory.id);
                            const response = await axios.delete(
                              `${API_BASE_URL}/menu-categories/${editingCategory.id}/image`,
                              {
                                headers: {
                                  'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                                }
                              }
                            );
                            console.log('Delete API response:', response.data);
                            
                            // Update the categories list to reflect the change
                            setCategories(categories.map(cat =>
                              cat.id === editingCategory.id 
                                ? { ...cat, image: null, imageFileName: null }
                                : cat
                            ));
                            // Update the editing category
                            setEditingCategory(prev => ({ ...prev, image: null, imageFileName: null }));
                            toast.success('Image deleted from storage');
                          } catch (error) {
                            console.error('Error deleting image from Firebase:', error);
                            console.error('Error details:', error.response?.data);
                            toast.error('Failed to delete image from storage');
                            return; // Don't clear the form if API call failed
                          }
                        }
                        
                        setNewCategory(prev => ({ 
                          ...prev, 
                          imageFile: null, 
                          imagePreview: null,
                          image: null
                        }));
                        // Also clear the file input
                        const fileInput = document.querySelector('input[type="file"]');
                        if (fileInput) {
                          fileInput.value = '';
                        }
                      }}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ ...styles.formGroup, display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <input
                type="checkbox"
                id="hasSubcategories"
                name="hasSubcategories"
                checked={newCategory.hasSubcategories}
                onChange={handleCategoryInputChange}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="hasSubcategories" style={{ margin: 0, cursor: 'pointer', userSelect: 'none' }}>
                This category has subcategories
              </label>
            </div>

            {newCategory.hasSubcategories && (
              <div style={{ ...styles.formGroup, marginTop: '15px', padding: '15px', border: '1px solid #e9ecef', borderRadius: '6px', backgroundColor: '#fff' }}>
                <label style={{ ...styles.label, marginBottom: '10px' }}>Subcategories</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={subCategoryInput}
                    onChange={(e) => setSubCategoryInput(e.target.value)}
                    placeholder="Enter subcategory name"
                    style={styles.input}
                  />
                  <button 
                    type="button"
                    onClick={handleAddSubCategory}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Add
                  </button>
                </div>
                {newCategory.subCategories.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <p style={{ margin: '5px 0 8px 0', fontSize: '0.9rem', color: '#666' }}>Current Subcategories:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {newCategory.subCategories.map((subCat, index) => (
                        <div 
                          key={index} 
                          style={{
                            backgroundColor: '#e9ecef',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.85rem'
                          }}
                        >
                          {subCat}
                          <button 
                            type="button"
                            onClick={() => handleRemoveSubCategory(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#dc3545',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1rem',
                              lineHeight: 1
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div style={{ ...styles.formGroup, display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px', marginTop: '15px' }}>
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={newCategory.isActive}
                onChange={handleCategoryInputChange}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer', userSelect: 'none' }}>
                Active (visible to customers)
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #e9ecef' }}>
              <button
                type="button"
                onClick={() => {
                  setCategoryModalOpen(false);
                  setEditingCategory(null);
                  setNewCategory({
                    name: '',
                    isActive: true,
                    hasSubcategories: false,
                    subCategories: [],
                    imageFile: null,
                    imagePreview: null
                  });
                  setSubCategoryInput('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f8f9fa',
                  color: '#495057',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.backgroundColor = '#e9ecef'}
                onMouseOut={(e) => e.target.backgroundColor = '#f8f9fa'}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '50%', borderTopColor: '#fff', animation: 'spin 1s ease-in-out infinite' }}></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    {editingCategory ? 'Update Category' : 'Save Category'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={isMenuModalOpen} onClose={() => { setMenuModalOpen(false); setEditingItem(null); setImagePreview(null); setCurrentSubDishes([]); setHasSubDishes(false); setSelectedSubCategory(''); setSelectedRecommendationTags(new Set()); }}>
        <h3 style={{ marginBottom: '20px' }}>{editingItem ? 'Edit' : 'Add'} Menu Item</h3>
        <form onSubmit={handleMenuFormSubmit}>
          {/* Image Upload */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Menu Image</label>
            {(imagePreview || editingItem?.image) && <img src={imagePreview || editingItem.image} alt="preview" style={styles.imagePreview} />}
            <input name="image" type="file" accept="image/*" onChange={handleImageChange} style={styles.input} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Menu Name */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Menu Name</label>
              <input name="name" type="text" style={styles.input} defaultValue={editingItem?.name || ''} required />
            </div>
            {/* Category */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select
                name="category"
                style={styles.input}
                value={editingItem?.categoryId || ""}
                onChange={(e) => {
                  const newCategoryId = e.target.value;
                  const selectedCat = categories.find(c => c.id === newCategoryId);

                  // Update the editingItem state with the new category ID
                  // This is important for the form to be controlled
                  setEditingItem(prev => ({
                    ...prev,
                    categoryId: newCategoryId
                  }));

                  // Update the available subcategories
                  setCurrentSubCategories(selectedCat?.subCategories || []);

                  // Reset the selected subcategory when the category changes
                  setSelectedSubCategory('');
                }}
                required
              >
                <option value="" disabled>Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sub-category Selection (only show if category has subcategories) */}
          {currentSubCategories.length > 0 && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Sub-Category <span style={{ color: 'red' }}>*</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {currentSubCategories.map(subCat => (
                  <label
                    key={subCat}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      border: `1px solid ${selectedSubCategory === subCat ? '#3498db' : '#ddd'}`,
                      backgroundColor: selectedSubCategory === subCat ? '#ebf5fb' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      ':hover': {
                        borderColor: '#3498db',
                        backgroundColor: '#f0f8ff'
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name="subCategory"
                      value={subCat}
                      checked={selectedSubCategory === subCat}
                      onChange={() => setSelectedSubCategory(subCat)}
                      required={currentSubCategories.length > 0}
                      style={{ display: 'none' }}
                    />
                    {subCat}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Price */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Price (₹)</label>
            <input
              name="price_full"
              type="number"
              step="0.01"
              min="0"
              style={styles.input}
              value={price}
              onChange={(e) => {
                const value = e.target.value;
                // Only update if it's a valid number or an empty string
                if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                  setPrice(value);
                }
              }}
              onBlur={(e) => {
                // Format to 2 decimal places when input loses focus
                const numValue = parseFloat(e.target.value);
                if (!isNaN(numValue)) {
                  setPrice(numValue.toFixed(2));
                } else {
                  setPrice('');
                }
              }}
              required
            />
          </div>

          {/* Veg/Non-Veg Toggle */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Food Type</label>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '4px',
                border: `1px solid ${foodType === 'Veg' ? '#27ae60' : '#ddd'}`,
                backgroundColor: foodType === 'Veg' ? '#e8f8f0' : '#fff',
                transition: 'all 0.2s',
                ':hover': {
                  borderColor: foodType === 'Veg' ? '#27ae60' : '#3498db',
                  backgroundColor: foodType === 'Veg' ? '#e8f8f0' : '#f0f8ff'
                }
              }}>
                <input
                  type="radio"
                  name="foodType"
                  value="Veg"
                  checked={foodType === 'Veg'}
                  onChange={() => setFoodType('Veg')}
                  style={{ width: '18px', height: '18px' }}
                />
                <span>Veg</span>
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '4px',
                border: `1px solid ${foodType === 'Non-Veg' ? '#e74c3c' : '#ddd'}`,
                backgroundColor: foodType === 'Non-Veg' ? '#fdedec' : '#fff',
                transition: 'all 0.2s',
                ':hover': {
                  borderColor: foodType === 'Non-Veg' ? '#e74c3c' : '#3498db',
                  backgroundColor: foodType === 'Non-Veg' ? '#fdedec' : '#f0f8ff'
                }
              }}>
                <input
                  type="radio"
                  name="foodType"
                  value="Non-Veg"
                  checked={foodType === 'Non-Veg'}
                  onChange={() => setFoodType('Non-Veg')}
                  style={{ width: '18px', height: '18px' }}
                />
                <span>Non-Veg</span>
              </label>
            </div>
          </div>

          {/* Recommendation Checkboxes */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Show to User as:</label>
            <div>
              <label style={{ marginRight: '15px' }}>
                <input
                  type="checkbox"
                  checked={selectedRecommendationTags.has(RECOMMENDATION_TAGS.RECOMMENDED)}
                  onChange={() => handleRecommendationTagChange(RECOMMENDATION_TAGS.RECOMMENDED)}
                  style={{ marginRight: '5px' }}
                />
                {RECOMMENDATION_TAGS.RECOMMENDED} for You
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={selectedRecommendationTags.has(RECOMMENDATION_TAGS.MOST_LOVED)}
                  onChange={() => handleRecommendationTagChange(RECOMMENDATION_TAGS.MOST_LOVED)}
                  style={{ marginRight: '5px' }}
                />
                {RECOMMENDATION_TAGS.MOST_LOVED}
              </label>
            </div>
          </div>

          {/* Sub-dishes Section */}
          <div style={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={hasSubDishes}
                onChange={(e) => {
                  setHasSubDishes(e.target.checked);
                  if (!e.target.checked) setCurrentSubDishes([]);
                }}
                style={{ marginRight: '8px' }}
              />
              Is there any sub dishes?
            </label>
          </div>

          {hasSubDishes && (
            <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
              <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Add Sub-Dishes</h4>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="text" placeholder="Item Name" value={subDishName} onChange={(e) => setSubDishName(e.target.value)} style={{ ...styles.input, flex: 1 }} />
                <input type="number" placeholder="Price" value={subDishPrice} onChange={(e) => setSubDishPrice(e.target.value)} style={{ ...styles.input, margin: 0, width: '100px' }} />
                <button type="button" onClick={handleAddSubDish} style={{ ...styles.button, backgroundColor: '#5dade2', color: 'white' }}>Add</button>
              </div>

              <div style={{ marginTop: '15px' }}>
                {currentSubDishes.map((dish, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px', marginBottom: '5px' }}>
                    <span>{dish.name} - ₹{(Number(dish.price) || 0).toFixed(2)}</span>
                    <button type="button" onClick={() => handleRemoveSubDish(index)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea name="description" style={styles.textarea} defaultValue={editingItem?.description || ''}></textarea>
          </div>

          <button type="submit" style={{ ...styles.button, ...styles.addButton }}>Save Item</button>
        </form>
      </Modal>

      <div style={styles.gridContainer} className="responsive-grid-container">

        {/* --- Incoming Orders Card (Replaces Offers) --- */}
        {renderIncomingOrders()}

        {/* --- Ongoing Orders Card --- */}
        {renderOngoingOrders()}

        {/* --- Menu Management Card --- */}
        <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 style={styles.cardTitle}>Menu Management</h2>
            <div>
              <button style={{ ...styles.button, ...styles.addButton }} onClick={() => { setEditingItem(null); setMenuModalOpen(true); }}><FaPlus /> Add New Item</button>
              <button
                style={{ ...styles.button, ...styles.addButton, backgroundColor: '#f39c12', marginTop: '10px', marginLeft: '10px' }}
                onClick={() => setActiveSection(activeSection === 'categories' ? 'menu' : 'categories')}>
                <FaPlus /> {activeSection === 'categories' ? 'Hide Categories' : 'Manage Categories'}
              </button>
            </div>
          </div>

          {activeSection === 'menu' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                {/* <h2>Menu Management</h2> */}
                {/* <button
                  onClick={() => {
                    setEditingItem(null);
                    setMenuModalOpen(true);
                  }}
                  style={getButtonStyle('#27ae60')}
                >
                  <FaPlus /> Add Menu Item
                </button> */}
              </div>

              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Loading menu items...</div>
              ) : error ? (
                <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>{error}</div>
              ) : menuItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>No menu items found</div>
              ) : (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.tableHeader}>Image</th>
                        <th style={styles.tableHeader}>Name</th>
                        <th style={styles.tableHeader}>Category</th>
                        <th style={styles.tableHeader}>Price (₹)</th>
                        <th style={styles.tableHeader}>Type</th>
                        <th style={styles.tableHeader}>Status</th>
                        <th style={styles.tableHeader}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.map((item, index) => (
                        <tr key={`menu-item-${index}`}>
                          <td style={styles.tableCell}>
                            <img
                              src={item.image || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWVlZWUiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'}
                              alt={item.name || 'Menu item'}
                              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                              }}
                            />
                          </td>
                          <td style={styles.tableCell}>
                            <div style={{ fontWeight: 'bold' }}>{item.name || 'Unnamed Item'}</div>
                            <div style={{ fontSize: '0.8em', color: '#666' }}>{item.description || 'No description'}</div>
                          </td>
                          <td style={styles.tableCell}>
                            {(() => {
                              // Extract string ID from Firestore DocumentReference if needed
                              const categoryId = extractIdFromDocRef(item.categoryId);
                              const category = categories.find(cat => cat.id === categoryId);
                              if (category) {
                                return category.name;
                              }
                              // Fallback: if categoryId doesn't match, show the categoryId or categoryName if available
                              return item.categoryName || categoryId || 'Unknown Category';
                            })()}
                          </td>
                          <td style={styles.tableCell}>₹{item.price ? parseFloat(item.price).toFixed(2) : '0.00'}</td>
                          <td style={styles.tableCell}>
                            <span style={getFoodTypeStyle(item.isVeg)}>
                              {item.isVeg ? 'Veg' : 'Non-Veg'}
                            </span>
                          </td>
                          <td style={styles.tableCell}>
                            <span style={getStatusStyle(item.isActive)}>
                              {item.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={styles.tableCell}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  // Extract string ID from DocumentReference if needed
                                  const categoryId = extractIdFromDocRef(item.categoryId);
                                  const category = categories.find(c => c.id === categoryId);
                                  
                                  setEditingItem({
                                    ...item,
                                    categoryId: categoryId // Store as string ID for form compatibility
                                  });
                                  setImagePreview(item.image);
                                  setSelectedSubCategory(item.subCategory || '');
                                  setCurrentSubCategories(category?.subCategories || []);
                                  setHasSubDishes(item.addOns && item.addOns.length > 0);
                                  setCurrentSubDishes(item.addOns || []);
                                  setSelectedRecommendationTags(new Set(item.tags || []));
                                  setMenuModalOpen(true);
                                }}
                                style={{
                                  ...styles.button,
                                  ...styles.editButton,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '5px',
                                  fontSize: '12px',
                                  padding: '6px 12px'
                                }}
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteMenuItem(item.id)}
                                style={{
                                  ...styles.button,
                                  ...styles.deleteButton,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '5px',
                                  fontSize: '12px',
                                  padding: '6px 12px'
                                }}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSection === 'categories' && (
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={styles.cardTitle}>Menu Categories</h3>
                <div>
                  <button
                    onClick={fetchCategories}
                    style={{
                      ...styles.button,
                      marginRight: '10px',
                      backgroundColor: '#f0f0f0',
                      color: '#333',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    disabled={isLoading}
                  >
                    <span>🔄</span> Refresh
                  </button>
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setNewCategory({
                        name: '',
                        isActive: true,
                        hasSubcategories: false,
                        subCategories: []
                      });
                      setCategoryModalOpen(true);
                    }}
                    style={{
                      ...styles.button,
                      ...styles.addButton,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    disabled={isLoading}
                  >
                    <FaPlus /> Add Category
                  </button>
                </div>
              </div>

              {success && (
                <div style={{
                  backgroundColor: '#d4edda',
                  color: '#155724',
                  padding: '10px',
                  borderRadius: '4px',
                  marginBottom: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{success}</span>
                  <button
                    onClick={() => setSuccess('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#155724',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              {error && (
                <div style={{
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  padding: '10px',
                  borderRadius: '4px',
                  marginBottom: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{error}</span>
                  <button
                    onClick={() => setError('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#721c24',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              {isLoading && categories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div className="spinner">Loading categories...</div>
                </div>
              ) : categories.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '30px',
                  border: '2px dashed #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <p style={{ marginBottom: '15px', fontSize: '16px', color: '#666' }}>
                    No categories found.
                  </p>
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setNewCategory({
                        name: '',
                        isActive: true,
                        hasSubcategories: false,
                        subCategories: []
                      });
                      setCategoryModalOpen(true);
                    }}
                    style={{
                      ...styles.button,
                      ...styles.addButton,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <FaPlus /> Add Your First Category
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table} className="responsive-table">
                    <thead>
                      <tr>
                        <th style={styles.th}>Image</th>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Subcategories</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => {
                        console.log('Category:', category);
                        console.log('subCategories:', category.subCategories);
                        console.log('hasSubcategories:', category.hasSubcategories);
                        console.log('isArray:', Array.isArray(category.subCategories));

                        return (
                          <tr key={category.id || category._id}>
                            <td style={styles.td}>
                              <img
                                src={category.image || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWVlZWUiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'}
                                alt={category.name || 'Category'}
                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                                }}
                              />
                            </td>
                            <td style={styles.td}>
                              <div style={{ fontWeight: 'bold' }}>{category.name}</div>
                            </td>
                            <td style={styles.td}>
                              {category.subCategories && category.subCategories.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '200px' }}>
                                  {(Array.isArray(category.subCategories) ? category.subCategories : [category.subCategories])
                                    .filter(sub => sub)
                                    .slice(0, 3)
                                    .map((sub, idx) => (
                                      <span
                                        key={idx}
                                        style={{
                                          backgroundColor: '#e9ecef',
                                          padding: '2px 8px',
                                          borderRadius: '12px',
                                          fontSize: '0.8em',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          maxWidth: '100%',
                                          display: 'inline-block'
                                        }}
                                        title={sub}
                                      >
                                        {sub}
                                      </span>
                                    ))}
                                  {category.subCategories.length > 3 && (
                                    <span style={{
                                      backgroundColor: '#f8f9fa',
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      fontSize: '0.8em',
                                      color: '#6c757d'
                                    }}>
                                      +{category.subCategories.length - 3} more
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: '#6c757d', fontStyle: 'italic' }}>
                                  No subcategories
                                </span>
                              )}
                            </td>
                            <td style={styles.td}>
                              <span
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  backgroundColor: category.isActive ? '#d4edda' : '#f8d7da',
                                  color: category.isActive ? '#155724' : '#721c24',
                                  fontSize: '0.85em',
                                  fontWeight: 'bold',
                                  display: 'inline-block',
                                  minWidth: '80px',
                                  textAlign: 'center'
                                }}
                              >
                                {category.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => handleEditCategory(category)}
                                  style={{
                                    ...styles.button,
                                    ...styles.editButton,
                                    padding: '6px 12px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '5px',
                                    fontSize: '12px',
                                  }}
                                  disabled={isLoading}
                                >
                                  <FaEdit size={14} /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category.id || category._id)}
                                  style={{
                                    ...styles.button,
                                    ...styles.deleteButton,
                                    padding: '6px 12px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '5px',
                                    fontSize: '12px',
                                  }}
                                  disabled={isLoading}
                                >
                                  <FaTrash size={14} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- LEFT COLUMN --- */}
        <div>
          {/* Profile & Status Card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Profile & Status</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Restaurant Name</label>
              <input type="text" style={styles.input} value={profile.name} readOnly />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Delivery Time</label>
              <input type="text" style={styles.input} value={profile.deliveryTime} onChange={(e) => setProfile({ ...profile, deliveryTime: e.target.value })} />
            </div>
            <div style={{ ...styles.formGroup, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={styles.label}>Restaurant Status: {isOnline ? 'Online' : 'Offline'}</label>
              <label style={styles.toggleSwitch}>
                <input type="checkbox" style={styles.toggleInput} checked={isOnline} onChange={() => setIsOnline(!isOnline)} />
                <span style={sliderStyle(isOnline)}><span style={sliderBeforeStyle(isOnline)}></span></span>
              </label>
            </div>
            <button style={{ ...styles.button, ...styles.addButton }} onClick={handleSaveProfile}>Save Changes</button>
          </div>

          {/* Operational Hours Card */}
          <div style={{ ...styles.card, marginTop: '20px' }}>
            <h2 style={styles.cardTitle}>Operational Hours</h2>
            {Object.entries(operatingHours).map(([day, times]) => (
              <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>{day}</span>
                <div>
                  <input type="time" value={times.open} style={{ ...styles.input, width: '100px', marginRight: '10px' }} onChange={(e) => setOperatingHours({ ...operatingHours, [day]: { ...times, open: e.target.value } })} />
                  <input type="time" value={times.close} style={{ ...styles.input, width: '100px' }} onChange={(e) => setOperatingHours({ ...operatingHours, [day]: { ...times, close: e.target.value } })} />
                </div>
              </div>
            ))}
            <button style={{ ...styles.button, ...styles.addButton }} onClick={handleSaveHours}>Save Hours</button>
          </div>
        </div>

        {/* --- RIGHT COLUMN / FULL WIDTH ON MOBILE --- */}
        {/* Reviews & Ratings Card */}
        <div style={{ ...styles.card }}>
          <h2 style={styles.cardTitle}>Reviews & Ratings</h2>
          {reviews.map(review => (
            <div key={review.id} style={{ borderBottom: '1px solid #eee', padding: '15px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>{review.user}</span>
                <span style={{ color: '#f39c12' }}>
                  {[...Array(5)].map((_, i) => <FaStar key={i} color={i < review.rating ? 'inherit' : '#e0e0e0'} />)}
                </span>
              </div>
              <p style={{ margin: '10px 0 5px 0' }}>{review.comment}</p>
              <small style={{ color: '#777' }}>{new Date(review.date).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
          <h3>Something went wrong</h3>
          <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default () => (
  <ErrorBoundary>
    <RestaurantMonitoring />
  </ErrorBoundary>
);