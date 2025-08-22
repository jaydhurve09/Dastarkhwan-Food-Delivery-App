import React, { useState, useEffect, useContext } from 'react';
import { FaStar, FaEdit, FaTrash, FaPlus, FaUpload, FaCheck, FaTimes, FaMotorcycle } from 'react-icons/fa';
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
      @media (max-width: 768px) {
        .responsive-grid-container {
          grid-template-columns: 1fr !important;
        }

        .responsive-table thead {
          display: none;
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

const DEFAULT_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

const RestaurantMonitoring = () => {
  const { deliveryPartners, orders, users, fetchOrders } = useContext(AdminContext);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews] = useState(initialReviews);
  const [operatingHours, setOperatingHours] = useState(initialHours);
  const [isOnline, setIsOnline] = useState(true);

  const [preparingOrders, setPreparingOrders] = useState([]);
 
  const [profile, setProfile] = useState({
    name: 'Dastarkhwan Restaurant',
    deliveryTime: '30-45 min',
    logo: null,
  });

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
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  // Fetch all orderedProduct documents from users subcollection
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
      console.error('Error fetching orderedProduct documents:', error);
      setOrdersError('Failed to fetch orders');
      setIncomingOrders([]);
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Handle order status update (static for now)
  const handleOrderStatusUpdate = (orderId, newStatus) => {
    toast.info(`Order ${orderId} would be ${newStatus} (static button)`);
  };

  // Fetch orders on component mount
  useEffect(() => {
    fetchYetToBeAcceptedOrders();
  }, []);


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

      setMenuItems(items || []);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load menu items');
      setMenuItems([]);
      toast.error('Failed to load menu items', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Call fetchMenuItems when the component mounts
  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Handle input change for category form
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
  const handleAddCategory = async () => {
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
  
      const categoryData = {
        name: newCategory.name,
        isActive: newCategory.isActive,
        hasSubcategories: newCategory.hasSubcategories,
        subCategories: formattedSubCategories,
        // Removed the image part to simplify, as the form doesn't handle image upload for categories
      };
  
      const response = await axios.post(
        `${API_BASE_URL}/menu-categories`,
        categoryData,
        {
          headers: {
            'Content-Type': 'application/json', // Change content type to application/json
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );
  
      setCategories([...categories, response.data]);
      setSuccess('Category added successfully!');
      setCategoryModalOpen(false);
      setNewCategory({
        name: '',
        isActive: true,
        hasSubcategories: false,
        subCategories: []
      });
    } catch (error) {
      console.error('Error adding category:', error);
      setError(error.response?.data?.message || 'Failed to add category');
    } finally {
      setIsLoading(false);
    }
  };

  // Update category
  const handleUpdateCategory = async () => {
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

      const response = await axios.put(
        `${API_BASE_URL}/menu-categories/${editingCategory.id}`,
        {
          name: newCategory.name,
          isActive: newCategory.isActive,
          hasSubcategories: newCategory.hasSubcategories,
          subCategories: formattedSubCategories,
          // ... include image handling if needed
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );

      setCategories(categories.map(cat =>
        cat.id === editingCategory.id ? response.data : cat
      ));
      setSuccess('Category updated successfully!');
      setCategoryModalOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
      setError(error.response?.data?.message || 'Failed to update category');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        setIsLoading(true);
        setError('');

        await axios.delete(`${API_BASE_URL}/menu-categories/${categoryId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });

        // Remove the category from the local state
        setCategories(categories.filter(cat => cat.id !== categoryId));
        setSuccess('Category deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Error deleting category:', err);
        setError(err.response?.data?.message || 'Failed to delete category. It might be in use by menu items.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Open modal for editing a category
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    const hasSubs = category.subCategories && category.subCategories.length > 0;
    setNewCategory({
      name: category.name,
      isActive: category.isActive,
      hasSubcategories: hasSubs, // Set based on whether there are subcategories
      subCategories: Array.isArray(category.subCategories)
        ? [...category.subCategories]
        : (category.subCategories || '').split(',').map(s => s.trim()).filter(Boolean),
      // ... include image handling if needed
    });
    setCategoryModalOpen(true);
  };

  // Reset form and close modal
  const handleCloseModal = () => {
    setCategoryModalOpen(false);
    setEditingCategory(null);
    setNewCategory({ name: '', isActive: true, hasSubcategories: false, subCategories: [] });
    setError('');
  };

  // --- Handlers ---
  const handleDeleteMenuItem = (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      setMenuItems(menuItems.filter(item => item.id !== id));
    }
  };

  const handleSaveProfile = () => {
    alert('Profile changes saved!');
  };

  const handleSaveHours = () => {
    alert('Operational hours updated!');
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(
        `${API_BASE_URL}/ordered-products/${orderId}/status`,
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );
      
      // Update the local state to reflect the change
      setIncomingOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, orderStatus: newStatus } 
            : order
        )
      );
      
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
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
      case 'declined':
        return { ...baseStyle, backgroundColor: '#e74c3c', color: 'white' };
      default:
        return { ...baseStyle, backgroundColor: '#95a5a6', color: 'white' };
    }
  };

  const renderIncomingOrders = () => (
    <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={styles.cardTitle}>Incoming Orders</h2>
        <button 
          onClick={fetchYetToBeAcceptedOrders}
          style={{
            ...styles.button,
            backgroundColor: '#3498db',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span>🔄</span> Refresh
        </button>
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
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incomingOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ ...styles.td, textAlign: 'center', padding: '40px', color: '#666' }}>
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
                incomingOrders.map((order, index) => (
                  <tr key={`order-${order.id || index}`}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 'bold' }}>#{order.orderId || order.id}</div>
                    </td>
                    <td style={styles.td}>
                      {order.userInfo?.displayName || order.userInfo?.name || 'N/A'}
                    </td>
                    <td style={styles.td}>
                      {order.products && order.products.map((product, itemIndex) => (
                        <div key={`${order.id}-item-${itemIndex}`} style={{ marginBottom: '5px' }}>
                          {product.quantity || 1}x {product.name || 'Unknown Item'}
                          {product.notes && (
                            <div style={{ fontSize: '0.8em', color: '#666' }}>
                              Note: {product.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </td>
                    <td style={styles.td}>
                      ₹{order.orderValue?.toFixed(2) || '0.00'}
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button
                          onClick={() => handleOrderStatusUpdate(order.id, 'accepted')}
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
                          <FaCheck /> Accept
                        </button>
                        <button
                          onClick={() => handleOrderStatusUpdate(order.id, 'declined')}
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

    // Prepare the request data
    const menuItemData = {
      name: formData.get('name'),
      categoryId: formData.get('category'),
      subCategory: subCategory,
      isVeg: foodType === 'Veg' ? 'true' : 'false',
      price: parseFloat(price) || 0, // Send price as a single number
      description: formData.get('description') || '',
      tags: formattedTags,
      isActive: true,
      addOns: hasSubDishes && currentSubDishes.length > 0 ? currentSubDishes : []
    };

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

    try {
      let response;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      if (editingItem && editingItem.id) {
        // Update existing menu item
        response = await axios.put(
          `${API_BASE_URL}/menu-items/${editingItem.id}`,
          menuItemData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        toast.success('Menu item updated successfully!', { /* ... */ });
      } else {
        // Create new menu item
        response = await axios.post(
          `${API_BASE_URL}/menu-items`,
          menuItemData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
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
    backgroundColor: isActive ? '#e8f8f0' : '#f5f5f5',
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

  useEffect(() => {
    if (editingItem) {
      // Set the current subcategories based on the selected category
      const selectedCategory = categories.find(cat => cat.id === editingItem.categoryId);
      if (selectedCategory) {
        setCurrentSubCategories(selectedCategory.subCategories || []);
        
        // If the category has subcategories and the editing item has a subcategory, select it
        if (selectedCategory.subCategories && selectedCategory.subCategories.length > 0 && editingItem.subCategory) {
          setSelectedSubCategory(editingItem.subCategory);
        }
      } else {
        // If no category is found (e.g., new item), ensure subcategories are reset
        setCurrentSubCategories([]);
        setSelectedSubCategory('');
      }
    } else {
      // Reset when not editing
      setCurrentSubCategories([]);
      setSelectedSubCategory('');
    }
  }, [editingItem, categories]);

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
  }, [editingItem, categories]);

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
            subCategories: []
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
                    subCategories: []
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
                    <span>{dish.name} - ₹{dish.price.toFixed(2)}</span>
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
                      {menuItems.map((item) => (
                        <tr key={item.id || Math.random().toString(36).substr(2, 9)}>
                          <td style={styles.tableCell}>
                            <img
                              src={item.image || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWVlZWUiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg=='}
                              alt={item.name || 'Menu item'}
                              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWVlZWUiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==';
                              }}
                            />
                          </td>
                          <td style={styles.tableCell}>
                            <div style={{ fontWeight: 'bold' }}>{item.name || 'Unnamed Item'}</div>
                            <div style={{ fontSize: '0.8em', color: '#666' }}>{item.description || 'No description'}</div>
                          </td>
                          <td style={styles.tableCell}>
                            {categories.find(cat => cat.id === item.categoryId)?.name || 'N/A'}
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
                                  setEditingItem(item);
                                  setImagePreview(item.image);
                                  setSelectedSubCategory(item.subCategory || '');
                                  setCurrentSubCategories(categories.find(c => c.id === item.categoryId)?.subCategories || []);
                                  setHasSubDishes(item.subDishes && item.subDishes.length > 0);
                                  setCurrentSubDishes(item.subDishes || []);
                                  setSelectedRecommendationTags(new Set(item.recommendation || []));
                                  setMenuModalOpen(true);
                                }}
                                style={getButtonStyle('#3498db')}
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteMenuItem(item.id)}
                                style={getButtonStyle('#e74c3c')}
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
                    <span>🔄</span> {isLoading ? 'Refreshing...' : 'Refresh'}
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
                                    gap: '5px'
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
                                    gap: '5px'
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
              <small style={{ color: '#777' }}>{review.date}</small>
            </div>
          ))}
        </div>

        {/* Incoming Orders Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Incoming Orders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incomingOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Order #{order.orderId}</h3>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    {order.orderStatus}
                  </span>
                </div>
                
                <div className="mb-4">
                  <p className="font-medium">{order.itemName}</p>
                  <p className="text-gray-600">Qty: {order.quantity}</p>
                  <p className="text-gray-600">₹{order.price * order.quantity}</p>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    Accept Order
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order.id, 'declined')}
                    className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
            
            {incomingOrders.length === 0 && (
              <p className="text-gray-500">No new incoming orders</p>
            )}
          </div>
        </div>

        {/* Preparing Orders Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Preparing Orders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {preparingOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Order #{order.orderId}</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {order.orderStatus}
                  </span>
                </div>
                
                <div className="mb-4">
                  <p className="font-medium">{order.itemName}</p>
                  <p className="text-gray-600">Qty: {order.quantity}</p>
                  <p className="text-gray-600">₹{order.price * order.quantity}</p>
                </div>
                
                <button
                  onClick={() => updateOrderStatus(order.id, 'prepared')}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Mark as Prepared
                </button>
              </div>
            ))}
            
            {preparingOrders.length === 0 && (
              <p className="text-gray-500">No orders in preparation</p>
            )}
          </div>
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