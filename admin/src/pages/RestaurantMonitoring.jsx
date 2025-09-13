import React, { useState, useEffect, useContext } from 'react';
import { FaStar } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AdminContext } from '../contexts/adminContext';
import api from '../config/axios';
import IncomingOrders from '../components/IncomingOrders';
import OngoingOrders from '../components/OngoingOrders';
import MenuManagement from '../components/MenuManagement';

// Helper function to check if delivery partner is assigned
const isDeliveryPartnerAssigned = (order) => {
  // Check deliveryProgress field first (new logic)
  if (order.deliveryProgress && order.deliveryProgress !== 'partner_not_assigned') {
    return true;
  }
  
  // Fallback to old logic for backward compatibility
  if (order.deliveryPartnerId && typeof order.deliveryPartnerId === 'object' && 
      order.deliveryPartnerId._firestore && order.deliveryPartnerId._path) {
    return true;
  }
  return order.partnerAssigned ? true : false;
};

// Helper function to get delivery partner info
const getDeliveryPartnerInfo = (order, deliveryPartners = []) => {
  if (order.deliveryPartnerId && typeof order.deliveryPartnerId === 'object' && order.deliveryPartnerId._path) {
    const partnerId = order.deliveryPartnerId._path.segments[order.deliveryPartnerId._path.segments.length - 1];
    const partner = deliveryPartners.find(p => p.id === partnerId);
    if (partner) {
      return {
        id: partner.id,
        display_name: partner.display_name || partner.name || 'Delivery Partner',
        phone: partner.phone || null
      };
    }
  }

  if (order.partnerAssigned) {
    return {
      id: order.partnerAssigned.partnerId || order.partnerAssigned.id,
      display_name: order.partnerAssigned.display_name || order.partnerAssigned.partnerName || 'Delivery Partner',
      phone: order.partnerAssigned.phone || null
    };
  }
  
  return null;
};

// Helper function to extract string ID from Firestore DocumentReference
const extractIdFromDocRef = (docRef) => {
  if (typeof docRef === 'object' && docRef._path) {
    return docRef._path.segments[docRef._path.segments.length - 1];
  }
  return docRef;
};

const extractMenuItemId = (ref) => {
  if (!ref) return null;
  
  // Handle string path like "/menuItems/FjyqKzgkLlhQuewZyEV"
  if (typeof ref === 'string') {
    if (ref.startsWith('/menuItems/')) {
      return ref.replace('/menuItems/', '');
    }
    const parts = ref.split('/');
    return parts[parts.length - 1];
  }

  if (ref && ref._path && ref._path.segments) {
    const segments = ref._path.segments;
    return segments[segments.length - 1];
  }

  if (ref && ref.id) {
    return ref.id;
  }

  if (ref && ref.path && typeof ref.path === 'string') {
    const parts = ref.path.split('/');
    return parts[parts.length - 1];
  }

  return null;
};

const RestaurantMonitoring = () => {
  const { deliveryPartners, activeDeliveryPartners, fetchActiveDeliveryPartners } = useContext(AdminContext);
  const [reviews] = useState([
    { id: 1, user: 'John Doe', rating: 4, comment: 'Great pizza, fast delivery!', date: '2024-07-20' },
    { id: 2, user: 'Jane Smith', rating: 5, comment: 'The best pasta in town.', date: '2024-07-18' },
  ]);
  const [operatingHours, setOperatingHours] = useState({
    Monday: { open: '09:00', close: '22:00' },
    Tuesday: { open: '09:00', close: '22:00' },
    Wednesday: { open: '09:00', close: '22:00' },
    Thursday: { open: '09:00', close: '22:00' },
    Friday: { open: '09:00', close: '23:00' },
    Saturday: { open: '10:00', close: '23:00' },
    Sunday: { open: '10:00', close: '21:00' },
  });
  const [isOnline, setIsOnline] = useState(true);
  const [profile, setProfile] = useState({
    name: 'Dastarkhwan Restaurant',
    deliveryTime: '30-45 min',
    logo: null,
  });

  // State for orders
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [ongoingOrders, setOngoingOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingOngoing, setIsLoadingOngoing] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [autoAssignPartners, setAutoAssignPartners] = useState(true);

  // Search state variables
  const [incomingOrdersSearch, setIncomingOrdersSearch] = useState('');
  const [ongoingOrdersSearch, setOngoingOrdersSearch] = useState('');
  const [deliveryPartnerFilter, setDeliveryPartnerFilter] = useState('all');

  // State for delivery partner assignment
  const [selectedPartners, setSelectedPartners] = useState({});
  const [assigningOrders, setAssigningOrders] = useState(new Set());
  const [menuItemNameCache, setMenuItemNameCache] = useState({});

  // State for menu management
  const [activeSection, setActiveSection] = useState('menu');
  const [editingItem, setEditingItem] = useState(null);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [currentSubCategories, setCurrentSubCategories] = useState([]);
  const [hasSubDishes, setHasSubDishes] = useState(false);
  const [currentSubDishes, setCurrentSubDishes] = useState([]);
  const [selectedRecommendationTags, setSelectedRecommendationTags] = useState(new Set());
  const [success, setSuccess] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({});
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

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
    if (deliveryPartnerFilter === 'assigned' && !order.assigningPartner && !isDeliveryPartnerAssigned(order)) {
      return false;
    }
    if (deliveryPartnerFilter === 'unassigned' && (order.assigningPartner || isDeliveryPartnerAssigned(order))) {
      return false;
    }

    if (!ongoingOrdersSearch.trim()) return true;

    const searchTerm = ongoingOrdersSearch.toLowerCase();
    const orderId = (order.orderId || order.id || '').toString().toLowerCase();
    const customerName = (order.userInfo?.display_name || order.userInfo?.name || '').toLowerCase();
    const status = (order.orderStatus || '').toLowerCase();
    const total = (order.orderTotal || 0).toString();
    const date = order.order_Date ? new Date(order.order_Date.seconds * 1000).toLocaleDateString().toLowerCase() : '';
    const items = order.products ? order.products.map(p => (p.name || '').toLowerCase()).join(' ') : '';
    const partnerInfo = getDeliveryPartnerInfo(order, deliveryPartners);
    const partnerName = partnerInfo?.display_name?.toLowerCase() || '';

    return orderId.includes(searchTerm) ||
      customerName.includes(searchTerm) ||
      status.includes(searchTerm) ||
      total.includes(searchTerm) ||
      date.includes(searchTerm) ||
      items.includes(searchTerm) ||
      partnerName.includes(searchTerm);
  });

  // Fetch orders functions
  const fetchYetToBeAcceptedOrders = async () => {
    try {
      setIsLoadingOrders(true);
      setOrdersError(null);
      const response = await api.get('/orders/yet-to-be-accepted');
      if (response.data) {
        setIncomingOrders(response.data);
      } else {
        setIncomingOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrdersError('Failed to fetch orders');
      setIncomingOrders([]);
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchOngoingOrders = async () => {
    try {
      setIsLoadingOngoing(true);
      setOrdersError(null);
      const response = await api.get('/orders/ongoing');
      if (response.data) {
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

  // Order handling functions
  const handleAcceptOrderWithNotification = async (orderId) => {
    try {
      const response = await api.patch(`/orders/${orderId}/accept-and-notify`);
      if (response.data.success) {
        const acceptedOrder = incomingOrders.find(order => order.id === orderId);
        if (acceptedOrder) {
          const updatedOrder = {
            ...acceptedOrder,
            orderStatus: 'preparing',
            assigningPartner: false
          };
          setOngoingOrders(prev => [...prev, updatedOrder]);
          setIncomingOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
          toast.success(`${response.data.message} - Order moved to preparing!`);
        }
        await fetchYetToBeAcceptedOrders();
        await fetchOngoingOrders();
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Failed to accept order and send notifications');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status: newStatus });

      if (newStatus === 'preparing') {
        const acceptedOrder = incomingOrders.find(order => order.id === orderId);
        if (acceptedOrder) {
          setOngoingOrders(prev => [...prev, { ...acceptedOrder, orderStatus: 'preparing' }]);
          toast.success('Order accepted and moved to ongoing');
        }
        setIncomingOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      } else if (newStatus === 'prepared') {
        toast.success('Order marked as prepared - ready for dispatch');
      } else if (newStatus === 'dispatched') {
        setOngoingOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
        toast.success('Order dispatched');
      } else if (newStatus === 'declined') {
        setIncomingOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
        setOngoingOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
        toast.success('Order declined');
      }

      await fetchYetToBeAcceptedOrders();
      await fetchOngoingOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handlePartnerSelection = (orderId, partnerId) => {
    setSelectedPartners(prev => ({
      ...prev,
      [orderId]: partnerId
    }));
  };

  const handleAssignPartner = async (orderId) => {
    const partnerId = selectedPartners[orderId];
    if (!partnerId) {
      toast.error('Please select a delivery partner first');
      return;
    }

    const availablePartners = activeDeliveryPartners.filter(partner =>
      partner.isActive === true && partner.isOnline === true
    );

    const selectedPartner = availablePartners.find(p => p.id === partnerId);
    if (!selectedPartner) {
      toast.error('Selected delivery partner is not available');
      return;
    }

    try {
      setAssigningOrders(prev => new Set([...prev, orderId]));
      const response = await api.patch(`/orders/${orderId}/assign-partner`, {
        partnerId: partnerId,
        partnerName: selectedPartner.display_name || selectedPartner.name,
        phone: selectedPartner.phone
      });

      if (response.data.success) {
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
              assigningPartner: false
            };
          }
          return order;
        }));

        toast.success(`${selectedPartner.display_name || selectedPartner.name} assigned!`);
        await fetchYetToBeAcceptedOrders();
        await fetchOngoingOrders();
        setSelectedPartners(prev => {
          const updated = { ...prev };
          delete updated[orderId];
          return updated;
        });
      }
    } catch (error) {
      console.error('Error assigning delivery partner:', error);
      toast.error('Failed to assign delivery partner');
    } finally {
      setAssigningOrders(prev => {
        const updated = new Set(prev);
        updated.delete(orderId);
        return updated;
      });
    }
  };

  const handleDispatchOrder = async (orderId) => {
    try {
      const response = await api.patch(`/orders/${orderId}/dispatch`);
      if (response.data.success) {
        toast.success('Order dispatched successfully!');
        await fetchYetToBeAcceptedOrders();
        await fetchOngoingOrders();
      }
    } catch (error) {
      console.error('Error dispatching order:', error);
      toast.error('Failed to dispatch order');
    }
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

  const handleSaveProfile = () => {
    toast.success('Profile changes saved!');
  };

  const handleSaveHours = () => {
    toast.success('Operational hours updated!');
  };

  // Menu management helper functions
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

  const handleDeleteMenuItem = async (id) => {
    try {
      toast.success('Menu item deleted successfully!');
      setMenuItems(prevItems => prevItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item');
    }
  };

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/menu-categories');
      if (response.data && response.data.data) {
        setCategories(response.data.data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/menu-items');
      
      let items = [];
      if (Array.isArray(response.data)) {
        items = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        items = response.data.data;
      } else if (response.data && response.data.items) {
        items = Array.isArray(response.data.items) ? response.data.items : [];
      }

      setMenuItems(items || []);
      
      // Build menu item name and price cache
      const cache = {};
      console.log('Building menuItemNameCache from items:', items); // Debug log
      items.forEach(item => {
        if (item.id) {
          console.log(`Processing item - original ID:`, item.id, `type:`, typeof item.id); // Debug log
          
          // More robust ID extraction
          let stringId;
          if (typeof item.id === 'string') {
            stringId = item.id;
          } else if (item.id && typeof item.id === 'object') {
            // Handle Firestore DocumentReference
            if (item.id._path && item.id._path.segments) {
              stringId = item.id._path.segments[item.id._path.segments.length - 1];
            } else if (item.id.id) {
              stringId = item.id.id;
            } else {
              // Fallback: try to convert to string and extract
              const idStr = String(item.id);
              if (idStr !== '[object Object]') {
                stringId = idStr;
              } else {
                console.warn('Could not extract string ID from:', item.id);
                stringId = `item_${Math.random().toString(36).substr(2, 9)}`;
              }
            }
          } else {
            stringId = String(item.id);
          }
          
          console.log(`Extracted string ID:`, stringId); // Debug log
          
          cache[stringId] = item.name || 'Unknown Item';
          cache[stringId + '_price'] = item.price || 0;
          console.log(`Added to cache: ${stringId} -> ${item.name}`); // Debug log
        }
      });
      console.log('Final menuItemNameCache:', cache); // Debug log
      setMenuItemNameCache(cache);
      
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load menu items');
      setMenuItems([]);
      setMenuItemNameCache({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (id) => {
    try {
      toast.success('Category deleted successfully!');
      setCategories(prevCategories => prevCategories.filter(category => category.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  // Fetch orders on component mount
  useEffect(() => {
    fetchYetToBeAcceptedOrders();
    fetchOngoingOrders();
    fetchActiveDeliveryPartners();
    fetchMenuItems();
    fetchCategories();
  }, []);

  // Styles
  const styles = {
    pageContainer: { padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9f9f9' },
    gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(700px, 1fr))', gap: '20px' },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    cardTitle: { fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#333' },
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
  };

  const sliderStyle = (isChecked) => ({ ...styles.toggleSlider, backgroundColor: isChecked ? '#2ecc71' : '#ccc' });
  const sliderBeforeStyle = (isChecked) => ({ ...styles.toggleSliderBefore, transform: isChecked ? 'translateX(26px)' : 'translateX(0)' });

  return (
    <div style={styles.pageContainer}>
      <ToastContainer />
      
      <div style={styles.gridContainer}>
        {/* Incoming Orders Component */}
        <IncomingOrders
          styles={styles}
          incomingOrders={incomingOrders}
          filteredIncomingOrders={filteredIncomingOrders}
          isLoadingOrders={isLoadingOrders}
          ordersError={ordersError}
          autoAssignPartners={autoAssignPartners}
          setAutoAssignPartners={setAutoAssignPartners}
          fetchYetToBeAcceptedOrders={fetchYetToBeAcceptedOrders}
          incomingOrdersSearch={incomingOrdersSearch}
          setIncomingOrdersSearch={setIncomingOrdersSearch}
          getOrderStatusStyle={getOrderStatusStyle}
          extractMenuItemId={extractMenuItemId}
          menuItemNameCache={menuItemNameCache}
          isDeliveryPartnerAssigned={isDeliveryPartnerAssigned}
          getDeliveryPartnerInfo={getDeliveryPartnerInfo}
          deliveryPartners={deliveryPartners}
          handleDispatchOrder={handleDispatchOrder}
          activeDeliveryPartners={activeDeliveryPartners}
          selectedPartners={selectedPartners}
          handlePartnerSelection={handlePartnerSelection}
          assigningOrders={assigningOrders}
          handleAssignPartner={handleAssignPartner}
          handleAcceptOrderWithNotification={handleAcceptOrderWithNotification}
          handleUpdateOrderStatus={handleUpdateOrderStatus}
        />

        {/* Ongoing Orders Component */}
        <OngoingOrders
          styles={styles}
          ongoingOrders={ongoingOrders}
          filteredOngoingOrders={filteredOngoingOrders}
          isLoadingOngoing={isLoadingOngoing}
          ordersError={ordersError}
          fetchOngoingOrders={fetchOngoingOrders}
          deliveryPartnerFilter={deliveryPartnerFilter}
          setDeliveryPartnerFilter={setDeliveryPartnerFilter}
          ongoingOrdersSearch={ongoingOrdersSearch}
          setOngoingOrdersSearch={setOngoingOrdersSearch}
          getOrderStatusStyle={getOrderStatusStyle}
          extractMenuItemId={extractMenuItemId}
          menuItemNameCache={menuItemNameCache}
          isDeliveryPartnerAssigned={isDeliveryPartnerAssigned}
          getDeliveryPartnerInfo={getDeliveryPartnerInfo}
          deliveryPartners={deliveryPartners}
          handleDispatchOrder={handleDispatchOrder}
          activeDeliveryPartners={activeDeliveryPartners}
          selectedPartners={selectedPartners}
          handlePartnerSelection={handlePartnerSelection}
          assigningOrders={assigningOrders}
          handleAssignPartner={handleAssignPartner}
          handleAcceptOrderWithNotification={handleAcceptOrderWithNotification}
          handleUpdateOrderStatus={handleUpdateOrderStatus}
        />

        {/* Menu Management Component */}
        <MenuManagement 
          styles={styles}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          setEditingItem={setEditingItem}
          setMenuModalOpen={setMenuModalOpen}
          menuItems={menuItems}
          isLoading={isLoading}
          error={error}
          categories={categories}
          extractIdFromDocRef={extractIdFromDocRef}
          getFoodTypeStyle={getFoodTypeStyle}
          getStatusStyle={getStatusStyle}
          setImagePreview={setImagePreview}
          setSelectedSubCategory={setSelectedSubCategory}
          setCurrentSubCategories={setCurrentSubCategories}
          setHasSubDishes={setHasSubDishes}
          setCurrentSubDishes={setCurrentSubDishes}
          setSelectedRecommendationTags={setSelectedRecommendationTags}
          handleDeleteMenuItem={handleDeleteMenuItem}
          success={success}
          setSuccess={setSuccess}
          setError={setError}
          fetchCategories={fetchCategories}
          setEditingCategory={setEditingCategory}
          setNewCategory={setNewCategory}
          setCategoryModalOpen={setCategoryModalOpen}
          handleEditCategory={handleEditCategory}
          handleDeleteCategory={handleDeleteCategory}
        />

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
        <div style={styles.card}>
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

        {/* Reviews & Ratings Card */}
        {/* <div style={styles.card}>
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
        </div> */}
      </div>
    </div>
  );
};

export default RestaurantMonitoring;
