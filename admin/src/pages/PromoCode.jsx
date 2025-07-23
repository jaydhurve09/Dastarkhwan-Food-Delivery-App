import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaSearch, FaFilter, FaFileExport, FaCheckCircle, FaTimesCircle, FaClock, FaEdit, FaTrash } from 'react-icons/fa';

// --- Mock data for form dropdowns ---
const mockUsers = ['user1@example.com', 'user2@example.com', 'user3@example.com', 'user4@example.com'];
const mockCategories = ['Appetizers', 'Main Course', 'Desserts', 'Beverages'];
const mockMenuItems = ['Pizza', 'Burger', 'Pasta', 'Salad'];

// --- PromoCodeModal Component ---
function PromoCodeModal({ promo, onSave, onClose }) {
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    startDate: '',
    expiryDate: '',
    userLimit: 'First-time users',
    specificUsers: [],
    discountType: 'Percentage',
    discountValue: 0,
    minOrderValue: 0,
    applyOn: [],
    usageLimitPerUser: 1,
    selectedCategories: [],
    selectedMenuItems: [],
  });

  useEffect(() => {
    if (promo) {
      setFormData({
        id: promo.id,
        name: promo.name || '',
        startDate: promo.startDate || '',
        expiryDate: promo.expiryDate || '',
        userLimit: promo.userLimit || 'First-time users',
        specificUsers: promo.specificUsers || [],
        discountType: promo.discountType || 'Percentage',
        discountValue: promo.discountValue || 0,
        minOrderValue: promo.minOrderValue || 0,
        applyOn: promo.applyOn || [],
        usageLimitPerUser: promo.usageLimitPerUser || 1,
        selectedCategories: promo.selectedCategories || [],
        selectedMenuItems: promo.selectedMenuItems || [],
      });
    } else {
      setFormData({
        id: null,
        name: '',
        startDate: '',
        expiryDate: '',
        userLimit: 'First-time users',
        specificUsers: [],
        discountType: 'Percentage',
        discountValue: 0,
        minOrderValue: 0,
        applyOn: [],
        usageLimitPerUser: 1,
        selectedCategories: [],
        selectedMenuItems: [],
      });
    }
  }, [promo]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => {
      let newState = { ...prev };

      if (type === 'checkbox') {
        const currentApplyOn = prev.applyOn;
        if (checked) {
          newState.applyOn = [...currentApplyOn, value];
        } else {
          newState.applyOn = currentApplyOn.filter(item => item !== value);
          if (value === 'Specific Categories') newState.selectedCategories = [];
          if (value === 'Menu Items') newState.selectedMenuItems = [];
        }
      } else {
        newState[name] = value;
      }

      if (name === 'userLimit') {
        if (value === 'All users' || value === 'First-time users') {
          newState.specificUsers = [];
        }
      }
      return newState;
    });
  };

  const handleMultiSelectChange = (name, e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, [name]: selectedOptions }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const styles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)', display: 'flex', flexDirection: 'column', },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' },
    modalTitle: { fontSize: '1.5rem', fontWeight: 'bold', color: '#333' },
    closeButton: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280', '&:hover': { color: '#333' } },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', flexGrow: 1, },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem', },
    label: { fontWeight: 500, color: '#333', fontSize: '0.9rem' },
    input: { padding: '0.8rem', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '1rem', width: '100%', boxSizing: 'border-box', },
    select: { padding: '0.8rem', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '1rem', width: '100%', boxSizing: 'border-box', backgroundColor: 'white', },
    multiSelect: { minHeight: '100px', height: 'auto', overflowY: 'auto', },
    radioGroup: { display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' },
    radioLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    checkboxGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.8rem', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: 'white', minHeight: '100px', overflowY: 'auto', },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    formActions: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' },
    button: { padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', border: 'none', fontWeight: 'bold', transition: 'background-color 0.2s ease-in-out' },
    saveButton: { backgroundColor: '#1a2c3e', color: 'white', '&:hover': { backgroundColor: '#0f1a25' } },
    cancelButton: { backgroundColor: '#e5e7eb', color: '#374151', '&:hover': { backgroundColor: '#d1d5db' } },
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{promo ? 'Edit Promo Code' : 'Create Promo Code'}</h2>
          <button onClick={onClose} style={styles.closeButton}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Promo Code Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} style={styles.input} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Start Date</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} style={styles.input} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Expiry Date</label>
              <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} style={styles.input} required />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Users</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input type="radio" name="userLimit" value="All users" checked={formData.userLimit === 'All users'} onChange={handleChange} /> All users
                </label>
                <label style={styles.radioLabel}>
                  <input type="radio" name="userLimit" value="First-time users" checked={formData.userLimit === 'First-time users'} onChange={handleChange} /> First-time users
                </label>
                <label style={styles.radioLabel}>
                  <input type="radio" name="userLimit" value="Specific users" checked={formData.userLimit === 'Specific users'} onChange={handleChange} /> Specific users
                </label>
              </div>
              {formData.userLimit === 'Specific users' && (
                <select multiple name="specificUsers" value={formData.specificUsers} onChange={(e) => handleMultiSelectChange('specificUsers', e)} style={{ ...styles.select, ...styles.multiSelect }}>
                  {mockUsers.map(user => <option key={user} value={user}>{user}</option>)}
                </select>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Usage Limit Per User</label>
              <input
                type="number"
                name="usageLimitPerUser"
                value={formData.usageLimitPerUser}
                onChange={handleChange}
                min="1"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Discount Type</label>
              <select name="discountType" value={formData.discountType} onChange={handleChange} style={styles.select}>
                <option value="Percentage">Percentage</option>
                <option value="Flat">Flat</option>
                <option value="Free Shipping">Free Shipping</option>
              </select>
            </div>
            {formData.discountType !== 'Free Shipping' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Discount Value</label>
                <input type="number" name="discountValue" value={formData.discountValue} onChange={handleChange} style={styles.input} />
              </div>
            )}
            <div style={styles.formGroup}>
              <label style={styles.label}>Minimum Order Value</label>
              <input type="number" name="minOrderValue" value={formData.minOrderValue} onChange={handleChange} style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Apply On</label>
              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" name="applyOn" value="Total Order" checked={formData.applyOn.includes('Total Order')} onChange={handleChange} /> Total Order
                </label>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" name="applyOn" value="Menu Items" checked={formData.applyOn.includes('Menu Items')} onChange={handleChange} /> Menu Items
                </label>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" name="applyOn" value="Specific Categories" checked={formData.applyOn.includes('Specific Categories')} onChange={handleChange} /> Specific Categories
                </label>
              </div>
            </div>

            {formData.applyOn.includes('Specific Categories') && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Select Categories</label>
                <select multiple name="selectedCategories" value={formData.selectedCategories} onChange={(e) => handleMultiSelectChange('selectedCategories', e)} style={{ ...styles.select, ...styles.multiSelect }}>
                  {mockCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            )}

            {formData.applyOn.includes('Menu Items') && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Select Menu Items</label>
                <select multiple name="selectedMenuItems" value={formData.selectedMenuItems} onChange={(e) => handleMultiSelectChange('selectedMenuItems', e)} style={{ ...styles.select, ...styles.multiSelect }}>
                  {mockMenuItems.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            )}
          </div>
          <div style={styles.formActions}>
            <button type="button" onClick={onClose} style={{ ...styles.button, ...styles.cancelButton }}>Cancel</button>
            <button type="submit" style={{ ...styles.button, ...styles.saveButton }}>Save Promo Code</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- AdvancedFilterModal Component ---
const AdvancedFilterModal = ({ filters: initialFilters, onApply, onClose }) => {
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFilters(prev => {
      const newApplyOn = checked
        ? [...prev.applyOn, name]
        : prev.applyOn.filter(item => item !== name);
      return { ...prev, applyOn: newApplyOn };
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const styles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '500px' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' },
    modalTitle: { fontSize: '1.5rem', fontWeight: 'bold' },
    form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    label: { fontWeight: 500 },
    input: { padding: '0.8rem', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '1rem' },
    checkboxGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    formActions: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' },
    applyButton: { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' },
    cancelButton: { backgroundColor: '#6b7280', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' },
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Advanced Filters</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>
        <div style={styles.form}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>Start Date</label>
              <input type="date" name="startDate" value={filters.startDate} onChange={handleChange} style={styles.input} />
            </div>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>End Date</label>
              <input type="date" name="endDate" value={filters.endDate} onChange={handleChange} style={styles.input} />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Minimum Order Value</label>
            <input type="number" name="minOrderValue" value={filters.minOrderValue} onChange={handleChange} style={styles.input} placeholder="e.g., 500" />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Apply On</label>
            <div style={styles.checkboxGroup}>
              <label><input type="checkbox" name="Total Order" checked={filters.applyOn.includes('Total Order')} onChange={handleCheckboxChange} /> Total Order</label>
              <label><input type="checkbox" name="Menu Items" checked={filters.applyOn.includes('Menu Items')} onChange={handleCheckboxChange} /> Menu Items</label>
              <label><input type="checkbox" name="Specific Categories" checked={filters.applyOn.includes('Specific Categories')} onChange={handleCheckboxChange} /> Specific Categories</label>
            </div>
          </div>
          <div style={styles.formActions}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>Cancel</button>
            <button type="button" onClick={handleApply} style={styles.applyButton}>Apply Filters</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Initial Mock Data
const initialPromoCodes = [
  {
    id: 1,
    name: 'SUMMER20',
    startDate: '2024-06-01',
    expiryDate: '2024-08-31',
    userLimit: 'First-time users',
    specificUsers: [],
    discountType: 'Percentage',
    discountValue: 20,
    minOrderValue: 500,
    applyOn: ['Total Order'],
    usageLimitPerUser: 1,
    selectedCategories: [],
    selectedMenuItems: [],
  },
  {
    id: 2,
    name: 'Dastar40',
    startDate: '2024-07-01',
    expiryDate: '2025-01-01',
    userLimit: 'Specific users',
    specificUsers: ['user1@example.com', 'user3@example.com'],
    discountType: 'Flat',
    discountValue: 40,
    minOrderValue: 1000,
    applyOn: ['Menu Items'],
    usageLimitPerUser: 3,
    selectedCategories: [],
    selectedMenuItems: ['Pizza', 'Burger'],
  },
  {
    id: 3,
    name: 'FREESHIP',
    startDate: '2023-01-01',
    expiryDate: '2023-12-31',
    userLimit: 'First-time users',
    specificUsers: [],
    discountType: 'Free Shipping',
    discountValue: 0,
    minOrderValue: 200,
    applyOn: ['Total Order'],
    usageLimitPerUser: 1,
    selectedCategories: [],
    selectedMenuItems: [],
  },
  {
    id: 4, name: 'WINTERSALE', startDate: '2024-12-01', expiryDate: '2024-12-31', userLimit: 'All users', specificUsers: [], discountType: 'Percentage', discountValue: 15, minOrderValue: 300, applyOn: ['Specific Categories'],
    usageLimitPerUser: 5,
    selectedCategories: ['Desserts', 'Beverages'],
    selectedMenuItems: [],
  },
  { id: 5, name: 'NEWBIE10', startDate: '2024-01-01', expiryDate: '2024-12-31', userLimit: 'First-time users', specificUsers: [], discountType: 'Flat', discountValue: 10, minOrderValue: 100, applyOn: ['Total Order'], usageLimitPerUser: 1, selectedCategories: [], selectedMenuItems: [], },
  { id: 6, name: 'FASTFOOD5', startDate: '2024-06-01', expiryDate: '2024-07-31', userLimit: 'All users', specificUsers: [], discountType: 'Flat', discountValue: 5, minOrderValue: 50, applyOn: ['Menu Items'], usageLimitPerUser: 10, selectedCategories: [], selectedMenuItems: ['Salad'], },
  { id: 7, name: 'BIGORDER', startDate: '2024-01-01', expiryDate: '2025-01-01', userLimit: 'All users', specificUsers: [], discountType: 'Percentage', discountValue: 25, minOrderValue: 2000, applyOn: ['Total Order'], usageLimitPerUser: 2, selectedCategories: [], selectedMenuItems: [], },
];

const ITEMS_PER_PAGE = 5;

// --- Main PromoCode Component ---
export default function PromoCode() {
  const [promos, setPromos] = useState(initialPromoCodes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [discountTypeFilter, setDiscountTypeFilter] = useState('All');
  const [advancedFilters, setAdvancedFilters] = useState({
    startDate: '',
    endDate: '',
    minOrderValue: '',
    applyOn: [],
  });

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);

  const getStatus = (promo) => {
    const now = new Date();
    const startDate = new Date(promo.startDate);
    const expiryDate = new Date(promo.expiryDate);

    if (now < startDate) return 'Upcoming';
    if (now > expiryDate) return 'Expired';
    return 'Active';
  };

  // Memoized filtered promos
  const filteredPromos = useMemo(() => {
    return promos.filter(promo => {
      // Search filter
      const searchMatch = promo.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const currentStatus = getStatus(promo);
      const statusMatch = statusFilter === 'All' || currentStatus === statusFilter;

      // Discount type filter
      const discountTypeMatch = discountTypeFilter === 'All' || promo.discountType === discountTypeFilter;

      // Advanced Filters
      const promoStartDate = new Date(promo.startDate);
      const promoExpiryDate = new Date(promo.expiryDate);

      const advancedStartDateMatch = !advancedFilters.startDate || promoStartDate >= new Date(advancedFilters.startDate);
      const advancedEndDateMatch = !advancedFilters.endDate || promoExpiryDate <= new Date(advancedFilters.endDate);

      const minOrderMatch = !advancedFilters.minOrderValue || promo.minOrderValue >= parseInt(advancedFilters.minOrderValue, 10);
      const applyOnMatch = advancedFilters.applyOn.length === 0 || advancedFilters.applyOn.some(filterItem => promo.applyOn.includes(filterItem));

      return searchMatch && statusMatch && discountTypeMatch && advancedStartDateMatch && advancedEndDateMatch && minOrderMatch && applyOnMatch;
    });
  }, [promos, searchTerm, statusFilter, discountTypeFilter, advancedFilters]);

  // Memoized paginated promos
  const paginatedPromos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPromos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPromos, currentPage]);

  const totalPages = Math.ceil(filteredPromos.length / ITEMS_PER_PAGE);

  // CRUD Handlers
  const handleAddPromo = () => {
    setSelectedPromo(null);
    setIsModalOpen(true);
  };

  const handleEditPromo = (promo) => {
    setSelectedPromo(promo);
    setIsModalOpen(true);
  };

  const handleDeletePromo = (promoId) => {
    if (window.confirm('Are you sure you want to delete this promo code?')) {
      setPromos(promos.filter(p => p.id !== promoId));
    }
  };

  const handleSavePromo = (promoData) => {
    if (promoData.id) {
      // Update existing promo
      setPromos(prevPromos => prevPromos.map(p => p.id === promoData.id ? promoData : p));
    } else {
      // Add new promo
      const newPromo = {
        ...promoData,
        id: Date.now(), // Generate a unique ID for new promos
        usageLimitPerUser: promoData.usageLimitPerUser || 1,
        selectedCategories: promoData.selectedCategories || [],
        selectedMenuItems: promoData.selectedMenuItems || [],
      };
      setPromos(prevPromos => [...prevPromos, newPromo]);
    }
    setIsModalOpen(false);

    // --- FIX: Reset all filters and pagination to ensure visibility of the new/updated promo ---
    setSearchTerm('');
    setStatusFilter('All');
    setDiscountTypeFilter('All');
    setAdvancedFilters({
      startDate: '',
      endDate: '',
      minOrderValue: '',
      applyOn: [],
    });
    setCurrentPage(1); // Go to the first page
    // --- END FIX ---
  };

  // Filter and Pagination Handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleExport = () => {
    const headers = ["ID", "Name", "Start Date", "Expiry Date", "Discount Type", "Discount Value", "Min Order", "Status", "User Limit", "Usage Limit Per User", "Specific Users", "Apply On", "Selected Categories", "Selected Menu Items"];
    const csvContent = [
      headers.join(','),
      ...filteredPromos.map(p => [
        p.id,
        p.name,
        p.startDate,
        p.expiryDate,
        p.discountType,
        p.discountValue,
        p.minOrderValue,
        getStatus(p),
        p.userLimit,
        p.usageLimitPerUser,
        `"${(p.specificUsers || []).join(';')}"`,
        `"${(p.applyOn || []).join(';')}"`,
        `"${(p.selectedCategories || []).join(';')}"`,
        `"${(p.selectedMenuItems || []).join(';')}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = `promo_codes_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyAdvancedFilters = (filters) => {
    setAdvancedFilters(filters);
    setCurrentPage(1);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active':
        return <FaCheckCircle style={{ color: '#10b981', fontSize: '1.5rem' }} />;
      case 'Expired':
        return <FaTimesCircle style={{ color: '#ef4444', fontSize: '1.5rem' }} />;
      case 'Upcoming':
        return <FaClock style={{ fontSize: '1.5rem' }} />;
      default:
        return null;
    }
  };

  const styles = {
    promoCodePage: { padding: '2rem', backgroundColor: '#f9fafb' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    headerDiv: { flexGrow: 1 },
    headerH1: { fontSize: '1.8rem', fontWeight: 'bold' },
    headerP: { fontSize: '1rem', color: '#6b7280' },
    createPromoBtn: { backgroundColor: '#1a2c3e', color: 'white', border: 'none', padding: '0.8rem 1.2rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.9rem' },
    createPromoBtnSvg: { marginRight: '0.5rem' },
    searchAndFilters: { marginBottom: '2rem' },
    searchBar: { position: 'relative', width: '100%', marginBottom: '1rem', border: '1px solid #d1d5db', borderRadius: '8px', display: 'flex', alignItems: 'center' },
    searchInput: { width: '100%', padding: '0.8rem 0.8rem 0.8rem 2.5rem', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', outline: 'none' },
    searchIcon: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' },
    filters: { display: 'flex', justifyContent: 'space-between', width: '100%' },
    leftFilters: { display: 'flex', gap: '1rem', alignItems: 'center' },
    rightFilters: { display: 'flex', gap: '1rem' },
    filterButton: { backgroundColor: 'white', border: '1px solid #d1d5db', padding: '0.8rem 1.2rem', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' },
    filterSelect: { padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' },
    promoTableContainer: { backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '1.2rem 1.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', backgroundColor: '#374151', color: 'white', fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase' },
    td: { padding: '1.2rem 1.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 500, verticalAlign: 'middle' },
    actionCell: { display: 'flex', gap: '1rem', alignItems: 'center' },
    actionButton: { cursor: 'pointer', background: 'none', border: 'none' },
    pagination: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '2rem' },
    paginationButton: { backgroundColor: '#1a2c3e', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', marginLeft: '1rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center' },
  };

  return (
    <div style={styles.promoCodePage}>
      <div style={styles.header}>
        <div style={styles.headerDiv}>
          <h1 style={styles.headerH1}>Promo Code Management</h1>
          <p style={styles.headerP}>Manage all users in one place. Control access, assign roles, and monitor activity across your platform.</p>
        </div>
        <button style={styles.createPromoBtn} onClick={handleAddPromo}><FaPlus style={styles.createPromoBtnSvg} /> Create Promo Code</button>
      </div>

      <div style={styles.searchAndFilters}>
        <div style={styles.searchBar}>
          <FaSearch style={styles.searchIcon} />
          <input type="text" placeholder="Search by promo code name..." style={styles.searchInput} value={searchTerm} onChange={handleSearchChange} />
        </div>
        <div style={styles.filters}>
          <div style={styles.leftFilters}>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} style={styles.filterSelect}>
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Upcoming">Upcoming</option>
            </select>
            <select value={discountTypeFilter} onChange={e => { setDiscountTypeFilter(e.target.value); setCurrentPage(1); }} style={styles.filterSelect}>
              <option value="All">All Discount Types</option>
              <option value="Percentage">Percentage</option>
              <option value="Flat">Flat</option>
              <option value="Free Shipping">Free Shipping</option>
            </select>
          </div>
          <div style={styles.rightFilters}>
            <button style={styles.filterButton} onClick={handleExport}><FaFileExport style={{ marginRight: '0.5rem' }} /> Export</button>
            <button style={styles.filterButton} onClick={() => setIsFilterModalOpen(true)}><FaFilter style={{ marginRight: '0.5rem' }} /> Filters</button>
          </div>
        </div>
      </div>

      <div style={styles.promoTableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Promo Code</th>
              <th style={styles.th}>Discount</th>
              <th style={styles.th}>Validity</th>
              <th style={styles.th}>User Limit</th>
              <th style={styles.th}>Usage/User</th>
              <th style={styles.th}>Min Order</th>
              <th style={styles.th}>Applies To</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPromos.map((promo) => {
              const status = getStatus(promo);
              return (
                <tr key={promo.id}>
                  <td style={styles.td}>{promo.name}</td>
                  <td style={styles.td}>{promo.discountType === 'Percentage' ? `${promo.discountValue}%` : (promo.discountType === 'Flat' ? `₹${promo.discountValue}` : 'Free Shipping')}</td>
                  <td style={styles.td}>{new Date(promo.startDate).toLocaleDateString()} - {new Date(promo.expiryDate).toLocaleDateString()}</td>
                  <td style={styles.td}>{promo.userLimit === 'Specific users' && promo.specificUsers.length > 0 ? `Specific: ${promo.specificUsers.join(', ')}` : promo.userLimit}</td>
                  <td style={styles.td}>{promo.usageLimitPerUser}</td>
                  <td style={styles.td}>₹{promo.minOrderValue}</td>
                  <td style={styles.td}>
                    {promo.applyOn.join(', ')}
                    {promo.selectedCategories && promo.selectedCategories.length > 0 && ` (${promo.selectedCategories.join(', ')})`}
                    {promo.selectedMenuItems && promo.selectedMenuItems.length > 0 && ` (${promo.selectedMenuItems.join(', ')})`}
                  </td>
                  <td style={styles.td}>{getStatusIcon(status)}</td>
                  <td style={styles.td}>
                    <div style={styles.actionCell}>
                      <button style={styles.actionButton} onClick={() => handleEditPromo(promo)}><FaEdit color="#3b82f6" size="1.2em" /></button>
                      <button style={styles.actionButton} onClick={() => handleDeletePromo(promo.id)}><FaTrash color="#ef4444" size="1.2em" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <span style={{ marginRight: '1rem', color: '#6b7280' }}>Page {currentPage} of {totalPages}</span>
        <button onClick={handlePrevPage} disabled={currentPage === 1} style={styles.paginationButton}>Previous</button>
        <button onClick={handleNextPage} disabled={currentPage === totalPages} style={styles.paginationButton}>Next</button>
      </div>

      {isModalOpen && (
        <PromoCodeModal
          promo={selectedPromo}
          onSave={handleSavePromo}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {isFilterModalOpen && (
        <AdvancedFilterModal
          filters={advancedFilters}
          onApply={handleApplyAdvancedFilters}
          onClose={() => setIsFilterModalOpen(false)}
        />
      )}
    </div>
  );
}