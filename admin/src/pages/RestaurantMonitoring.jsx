import React, { useState, useEffect } from 'react';
import { FaStar, FaEdit, FaTrash, FaPlus, FaUpload } from 'react-icons/fa';
import axios from 'axios';

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


const RestaurantMonitoring = () => {
  const [menuItems, setMenuItems] = useState(initialMenuItems);
  const [orders, setOrders] = useState(initialOrders);
  const [reviews] = useState(initialReviews);
  const [operatingHours, setOperatingHours] = useState(initialHours);
  const [isOnline, setIsOnline] = useState(true);
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      console.log('Categories data:', response.data);
      
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
  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API_BASE_URL}/menu-categories`,
        newCategory,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setCategories([...categories, response.data.data]);
      setNewCategory({ name: '', isActive: true, hasSubcategories: false, subCategories: [] });
      setCategoryModalOpen(false);
      setSuccess('Category added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding category:', err);
      setError(err.response?.data?.message || 'Failed to add category');
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
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(
        `${API_BASE_URL}/menu-categories/${editingCategory.id}`,
        newCategory,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id ? response.data.data : cat
      ));
      setEditingCategory(null);
      setNewCategory({ name: '', isActive: true, hasSubcategories: false, subCategories: [] });
      setCategoryModalOpen(false);
      setSuccess('Category updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.response?.data?.message || 'Failed to update category');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_BASE_URL}/menu-categories/${category.id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      setCategories(categories.filter(cat => cat.id !== category.id));
      setSuccess('Category deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.response?.data?.message || 'Failed to delete category. It might be in use by menu items.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open modal for editing a category
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      isActive: category.isActive,
      hasSubcategories: category.hasSubcategories || false,
      subCategories: category.subCategories || []
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

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
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

  const handleMenuFormSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newItemData = {
      id: editingItem ? editingItem.id : Date.now(),
      name: formData.get('name'),
      price: {
        full: parseFloat(formData.get('price_full')),
      },
      subCategory: selectedSubCategory,
      subDishes: hasSubDishes ? currentSubDishes : [],
      available: editingItem ? editingItem.available : true,
      category: formData.get('category'),
      description: formData.get('description'),
      image: imagePreview || (editingItem ? editingItem.image : 'https://via.placeholder.com/150'),
      recommendation: Array.from(selectedRecommendationTags), // Store as array
    };

    if (editingItem) {
      setMenuItems(menuItems.map(item => item.id === editingItem.id ? newItemData : item));
    } else {
      setMenuItems([...menuItems, newItemData]);
    }
    setMenuModalOpen(false);
    setEditingItem(null);
    setImagePreview(null);
    setSelectedSubCategory('');
    setHasSubDishes(false);
    setCurrentSubDishes([]);
    setSelectedRecommendationTags(new Set()); // Reset tags
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
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

  return (
    <div style={styles.pageContainer}>
      <ResponsiveStyles />

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
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubCategory())}
                    placeholder="Enter subcategory name" 
                    style={{ ...styles.input, flex: 1, margin: 0 }} 
                  />
                  <button 
                    type="button" 
                    onClick={handleAddSubCategory}
                    style={{
                      padding: '8px 15px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
                  >
                    Add
                  </button>
                </div>
                
                {newCategory.subCategories.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: '#495057' }}>Subcategories:</p>
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '8px', 
                      maxHeight: '150px', 
                      overflowY: 'auto', 
                      padding: '10px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px',
                      border: '1px solid #e9ecef'
                    }}>
                      {newCategory.subCategories.length === 0 ? (
                        <div style={{ color: '#6c757d', fontStyle: 'italic' }}>No subcategories added yet</div>
                      ) : (
                        newCategory.subCategories.map((subCat, index) => (
                          <div 
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: '#e9ecef',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '0.85em',
                              color: '#212529'
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
                                padding: '0 0 0 5px',
                                fontSize: '1.1em',
                                lineHeight: '1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseOver={(e) => e.target.style.backgroundColor = '#f1f1f1'}
                              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                              aria-label={`Remove ${subCat}`}
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
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
                defaultValue={editingItem?.category || ""}
                onChange={(e) => {
                  const selectedCat = categories.find(c => c.name === e.target.value);
                  setCurrentSubCategories(selectedCat?.subCategories || []);
                  setSelectedSubCategory('');
                }}
                required
              >
                <option value="" disabled>Select a category</option>
                {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>
          </div>

          {currentSubCategories.length > 0 && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Sub-Category</label>
              <div>
                {currentSubCategories.map(subCat => (
                  <label key={subCat} style={{ marginRight: '15px' }}>
                    <input type="radio" name="subCategory" value={subCat} checked={selectedSubCategory === subCat} onChange={(e) => setSelectedSubCategory(e.target.value)} required /> {subCat}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Price */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Price (₹)</label>
            <input name="price_full" type="number" step="0.01" style={styles.input} defaultValue={editingItem?.price?.full || ''} required />
          </div>

          {/* Recommendation Checkboxes */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Show to User as:</label>
            <div>
              <label style={{ marginRight: '15px' }}>
                <input
                  type="checkbox"
                  checked={selectedRecommendationTags.has('recommended')}
                  onChange={() => handleRecommendationTagChange('recommended')}
                  style={{ marginRight: '5px' }}
                />
                Recommended for You
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={selectedRecommendationTags.has('mostLoved')}
                  onChange={() => handleRecommendationTagChange('mostLoved')}
                  style={{ marginRight: '5px' }}
                />
                Most Loved
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
        <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
          <h2 style={styles.cardTitle}>Incoming Orders</h2>
          <table style={styles.table} className="responsive-table">
            <thead>
              <tr>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Cart Price</th>
                <th style={styles.th}>Dishes Ordered</th>
                <th style={styles.th}>User Location</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td style={styles.td} data-label="Order ID">{order.id}</td>
                  <td style={styles.td} data-label="Cart Price">₹{order.cartPrice.toFixed(2)}</td>
                  <td style={styles.td} data-label="Dishes Ordered">
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {order.dishes.map(d => <li key={d.name}>{d.name} (x{d.qty})</li>)}
                    </ul>
                  </td>
                  <td style={styles.td} data-label="User Location">{order.location}</td>
                  <td style={styles.td} data-label="Actions" className="action-cell-container">
                    {order.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button style={{ ...styles.button, backgroundColor: '#2ecc71', color: 'white' }} onClick={() => handleUpdateOrderStatus(order.id, 'Preparing')}>Accept</button>
                        <button style={{ ...styles.button, ...styles.deleteButton }} onClick={() => handleUpdateOrderStatus(order.id, 'Rejected')}>Reject</button>
                      </div>
                    )}
                    {order.status === 'Rejected' && (
                      <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>Rejected</span>
                    )}
                    {(order.status === 'Preparing' || order.status === 'Ready for Dispatch') && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          style={{
                            ...styles.input,
                            width: 'auto',
                            margin: 0,
                            backgroundColor: '#2ecc71',
                            color: 'white',
                            border: '1px solid #2ecc71'
                          }}
                        >
                          <option value="Preparing" style={{ backgroundColor: 'white', color: 'black' }}>Preparing</option>
                          <option value="Ready for Dispatch" style={{ backgroundColor: 'white', color: 'black' }}>Ready for Dispatch</option>
                        </select>
                        <button style={{ ...styles.button, backgroundColor: '#bdc3c7', color: 'black' }} onClick={() => handleUpdateOrderStatus(order.id, 'Pending')}>Cancel</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Menu Management Card --- */}
        <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 style={styles.cardTitle}>Menu Management</h2>
            <div>
              <button style={{ ...styles.button, ...styles.addButton }} onClick={() => { setEditingItem(null); setMenuModalOpen(true); }}><FaPlus /> Add New Item</button>
              <button
                style={{ ...styles.button, ...styles.addButton, backgroundColor: '#f39c12', marginTop: '10px', marginLeft: '10px' }}
                onClick={() => setCategoryModalOpen(true)}>
                <FaPlus /> Manage Categories
              </button>
            </div>
          </div>

          {Object.keys(menuByCategory).map(category => (
            <div key={category}>
              <h3 style={styles.categoryTitle}>{category}</h3>
              <table style={styles.table} className="responsive-table">
                <thead>
                  <tr>
                    <th style={styles.th}>Dish</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Recommendation</th> {/* Added column */}
                    <th style={styles.th}>Available</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menuByCategory[category].map(item => (
                    <tr key={item.id}>
                      <td style={styles.td} data-label="Dish">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <img src={item.image} alt={item.name} style={styles.menuItemImage} />
                          <div>
                            <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                            {item.subCategory && <span style={{ fontSize: '0.8rem', color: 'white', backgroundColor: item.subCategory === 'Veg' ? '#27ae60' : '#c0392b', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>{item.subCategory}</span>}
                            <p style={{ fontSize: '0.9rem', color: '#666', margin: '4px 0 0 0' }}>{item.description}</p>
                            {item.subDishes && item.subDishes.length > 0 && (
                              <div style={{ marginTop: '10px' }}>
                                <strong style={{ fontSize: '0.9rem' }}>Sub-Dishes:</strong>
                                <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', fontSize: '0.9rem' }}>
                                  {item.subDishes.map((sd, i) => <li key={i}>{sd.name} (+₹{sd.price.toFixed(2)})</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td} data-label="Price">₹{item.price.full.toFixed(2)}</td>
                      {/* Display Recommendation Tags */}
                      <td style={styles.td} data-label="Recommendation">
                        {item.recommendation && item.recommendation.map(tag => (
                          <span
                            key={tag}
                            style={{
                              ...styles.recommendationTag,
                              backgroundColor: tag === 'recommended' ? '#3498db' : '#e67e22'
                            }}
                          >
                            {tag === 'recommended' ? 'Recommended' : 'Most Loved'}
                          </span>
                        ))}
                        {(!item.recommendation || item.recommendation.length === 0) && (
                          <span style={{ color: '#7f8c8d', fontSize: '0.8em' }}>None</span>
                        )}
                      </td>
                      <td style={styles.td} data-label="Available">
                        <label style={styles.toggleSwitch}>
                          <input
                            type="checkbox"
                            style={styles.toggleInput}
                            checked={item.available}
                            onChange={() => setMenuItems(menuItems.map(menuItem => menuItem.id === item.id ? { ...menuItem, available: !menuItem.available } : menuItem))}
                          />
                          <span style={sliderStyle(item.available)}><span style={sliderBeforeStyle(item.available)}></span></span>
                        </label>
                      </td>
                      <td style={styles.td} data-label="Actions" className="action-cell-container">
                        <button
                          style={{ ...styles.button, ...styles.editButton, marginRight: '10px' }}
                          onClick={() => {
                            setEditingItem(item);
                            setImagePreview(item.image);
                            setSelectedSubCategory(item.subCategory || '');
                            setCurrentSubCategories(categories.find(c => c.name === item.category)?.subCategories || []);
                            setHasSubDishes(item.subDishes && item.subDishes.length > 0);
                            setCurrentSubDishes(item.subDishes || []);
                            // Set recommendation tags for edit
                            setSelectedRecommendationTags(new Set(item.recommendation || []));
                            setMenuModalOpen(true);
                          }}
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          style={{ ...styles.button, ...styles.deleteButton }}
                          onClick={() => handleDeleteMenuItem(item.id)}
                        >
                          <FaTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* --- Categories Section --- */}
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
                  console.log('Current categories state:', categories);
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
                {categories.length === 0 ? 'No categories found.' : `Found ${categories.length} categories but not displaying.`}
              </p>
              <button 
                onClick={() => {
                  console.log('Current categories state:', categories);
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
              <div>Debug: Found {categories.length} categories</div>
              <table style={styles.table} className="responsive-table">
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 'bold' }}>{category.name}</div>
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
                            onClick={() => handleDeleteCategory(category)}
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
                  ))}
                </tbody>
              </table>
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
      </div>
    </div>
  );
};

export default RestaurantMonitoring;