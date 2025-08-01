import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaFileExport, 
  FaEdit, 
  FaTrash, 
  FaChevronLeft, 
  FaChevronRight,
  FaTimesCircle,
  FaCheckCircle,
  FaClock
} from 'react-icons/fa';

import { 
  getPromoCodes, 
  createPromoCode, 
  updatePromoCode, 
  deletePromoCode 
} from '../services/promoCodeService';

// Container styles
const containerStyles = {
  padding: '1.5rem',
  maxWidth: '1200px',
  margin: '0 auto'
};

// Header styles
const headerStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
  flexWrap: 'wrap',
  gap: '1rem'
};

// Button styles
const buttonStyles = {
  primary: {
    backgroundColor: '#3B82F6',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    border: 'none',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#2563EB'
    }
  },
  danger: {
    backgroundColor: '#EF4444',
    color: 'white',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.25rem',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.75rem',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#DC2626'
    }
  },
  secondary: {
    backgroundColor: '#E5E7EB',
    color: '#374151',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.25rem',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.75rem',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#D1D5DB'
    }
  }
};

// Table styles
const tableStyles = {
  container: {
    width: '100%',
    overflowX: 'auto',
    borderRadius: '0.5rem',
    border: '1px solid #E5E7EB',
    marginTop: '1.5rem'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.875rem'
  },
  thead: {
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB'
  },
  th: {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontWeight: 500,
    color: '#6B7280',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid #E5E7EB',
    verticalAlign: 'middle'
  },
  tr: {
    ':hover': {
      backgroundColor: '#F9FAFB'
    }
  }
};

// Modal styles
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #E5E7EB'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#111827',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6B7280',
    fontSize: '1.25rem',
    ':hover': {
      color: '#374151'
    }
  },
  formGroup: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #E5E7EB'
  }
};

// Input styles
const inputStyles = {
  base: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.375rem',
    width: '100%',
    fontSize: '0.875rem',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    ':focus': {
      outline: 'none',
      borderColor: '#3B82F6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2)'
    }
  },
  search: {
    paddingLeft: '2.5rem',
    maxWidth: '300px',
    position: 'relative'
  }
};

// Status badge styles
const statusBadgeStyles = {
  active: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    marginRight: '0.25rem'
  },
  upcoming: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    marginRight: '0.25rem'
  },
  expired: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    marginRight: '0.25rem'
  },
  inactive: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    marginRight: '0.25rem'
  },
  icon: {
    marginRight: '0.25rem'
  }
};

// Status constants
const STATUS = {
  ACTIVE: 'active',
  UPCOMING: 'upcoming',
  EXPIRED: 'expired',
  INACTIVE: 'inactive'
};

const PromoCode = () => {
  // Search input style with icon
  const searchInputStyle = {
    ...inputStyles.base,
    ...inputStyles.search,
    paddingLeft: '2.5rem',
    position: 'relative'
  };

  // Search icon container style
  const searchIconStyle = {
    position: 'absolute',
    left: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9CA3AF',
    pointerEvents: 'none'
  };

  // Search container style
  const searchContainerStyle = {
    position: 'relative',
    maxWidth: '300px',
    width: '100%'
  };
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [discountTypeFilter, setDiscountTypeFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderValue: '',
    maxDiscount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    usageLimit: '',
    isActive: true
  });

  const ITEMS_PER_PAGE = 10;

    // Data fetching and utility functions
    useEffect(() => {
      fetchPromoCodes();
    }, []);
  
    const fetchPromoCodes = async () => {
      try {
        setLoading(true);
        const data = await getPromoCodes();
        setPromoCodes(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch promocodes:', err);
        setError('Failed to load promo codes. Please try again later.');
      
      } finally {
        setLoading(false);
      }
    };
  
    const getPromoStatus = (promo) => {
      const now = new Date();
      const startDate = new Date(promo.startDate);
      const endDate = promo.endDate ? new Date(promo.endDate) : null;
  
      if (!promo.isActive) return STATUS.INACTIVE;
      if (now < startDate) return STATUS.UPCOMING;
      if (endDate && now > endDate) return STATUS.EXPIRED;
      return STATUS.ACTIVE;
    };
  
    const getStatusBadge = (status) => {
    const statusConfig = {
      [STATUS.ACTIVE]: { 
        style: statusBadgeStyles.active,
        icon: <FaCheckCircle style={statusBadgeStyles.icon} /> 
      },
      [STATUS.UPCOMING]: { 
        style: statusBadgeStyles.upcoming,
        icon: <FaClock style={statusBadgeStyles.icon} /> 
      },
      [STATUS.EXPIRED]: { 
        style: statusBadgeStyles.expired,
        icon: <FaTimesCircle style={statusBadgeStyles.icon} /> 
      },
      [STATUS.INACTIVE]: { 
        style: statusBadgeStyles.inactive,
        icon: <FaTimesCircle style={statusBadgeStyles.icon} /> 
      }
    };

    const config = statusConfig[status] || statusConfig[STATUS.INACTIVE];
    
    return (
      <span style={config.style}>
        {config.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
      // Filtering and pagination
  const filteredPromos = useMemo(() => {
    return promoCodes.filter(promo => {
      const searchMatch = 
        promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (promo.description && promo.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const statusMatch = statusFilter === 'All' || 
                         getPromoStatus(promo) === statusFilter.toLowerCase();
      
      const typeMatch = discountTypeFilter === 'All' || 
                       promo.discountType === discountTypeFilter.toLowerCase();

      return searchMatch && statusMatch && typeMatch;
    });
  }, [promoCodes, searchTerm, statusFilter, discountTypeFilter]);

  const totalPages = Math.ceil(filteredPromos.length / ITEMS_PER_PAGE);
  const paginatedPromos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPromos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPromos, currentPage]);

  // CRUD Operations
  const handleAddPromo = () => {
    setSelectedPromo(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderValue: '',
      maxDiscount: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      usageLimit: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleEditPromo = (promo) => {
    setSelectedPromo(promo);
    setFormData({
      ...promo,
      startDate: promo.startDate.split('T')[0],
      endDate: promo.endDate ? promo.endDate.split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this promo code?')) {
      try {
        await deletePromoCode(id);
        setPromoCodes(promoCodes.filter(promo => promo.id !== id));
        
      } catch (error) {
        console.error('Error deleting promo code:', error);
        
      }
    }
  };
    // Form handling
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      try {
        // Convert string values to numbers
        const discountValue = parseFloat(formData.discountValue);
        const minOrderValue = parseFloat(formData.minOrderValue) || 0;
        
        // Validate discount value
        if (isNaN(discountValue) || discountValue <= 0) {
       
          return;
        }
        
        // Additional validation for percentage discount
        if (formData.discountType === 'percentage' && discountValue > 100) {
         
          return;
        }

        // Validate dates
        const startDate = new Date(formData.startDate);
        const endDate = formData.endDate ? new Date(formData.endDate) : null;
        
        if (endDate && endDate <= startDate) {
          
          return;
        }
        
        // Prepare promo data
        const promoData = {
          ...formData,
          discountValue,
          minOrderValue,
          startDate: startDate.toISOString(),
          endDate: endDate ? endDate.toISOString() : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          isActive: formData.isActive ?? true
        };
        
        // Save or update promo
        if (selectedPromo) {
          const updatedPromo = await updatePromoCode(selectedPromo.id, promoData);
          setPromoCodes(promoCodes.map(p => 
            p.id === selectedPromo.id ? { ...p, ...updatedPromo } : p
          ));
         
        } else {
          const newPromo = await createPromoCode(promoData);
          setPromoCodes([...promoCodes, newPromo]);
          
        }
        
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error saving promo code:', error);
     
      }
    };
  
    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    };
  
    // Modal component
    const PromoModal = () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-2xl">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedPromo ? 'Edit Promo Code' : 'Add New Promo Code'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Code Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="promo-code">Code *</label>
                <input
                  id="promo-code"
                  name="code"
                  type="text"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              {/* Discount Type */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="discount-type">Discount Type *</label>
                <select
                  id="discount-type"
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed_amount">Fixed Amount</option>
                </select>
              </div>

              {/* Discount Value */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="discount-value">
                  {formData.discountType === 'percentage' ? 'Discount Percentage *' : 'Discount Amount *'}
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">
                      {formData.discountType === 'percentage' ? '%' : '₹'}
                    </span>
                  </div>
                  <input
                    id="discount-value"
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleChange}
                    min="0"
                    step={formData.discountType === 'percentage' ? '0.01' : '1'}
                    max={formData.discountType === 'percentage' ? '100' : ''}
                    className="block w-full pl-8 pr-12 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                    placeholder={formData.discountType === 'percentage' ? '0.00' : '0'}
                    required
                  />
                </div>
              </div>

              {/* Min Order Value */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="min-order">Minimum Order Value</label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    id="min-order"
                    type="number"
                    name="minOrderValue"
                    value={formData.minOrderValue}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="block w-full pl-3 pr-12 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="start-date">Start Date *</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="start-date"
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="end-date">End Date *</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="end-date"
                    type="date"
                    name="endDate"
                    value={formData.endDate || ''}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                </div>
                {formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate) && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    End date must be after start date
                  </p>
                )}
              </div>

              {/* Usage Limit */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="usage-limit">Usage Limit</label>
                <input
                  id="usage-limit"
                  type="number"
                  name="usageLimit"
                  value={formData.usageLimit}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Leave empty for unlimited usage"
                />
              </div>

              {/* Active Status */}
              <div className="space-y-2 flex items-center">
                <input
                  id="is-active"
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is-active" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter promo code description (optional)"
              />
            </div>
            
            {/* Add more form fields here */}
  
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {selectedPromo ? 'Update' : 'Create'} Promo Code
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  // Main component render
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

// Container style
const containerStyle = {
  minHeight: '100vh',
  backgroundColor: '#F9FAFB',
  padding: '2rem',
  maxWidth: '100%',
  margin: '0 auto'
};

// Header style
const headerStyle = {
  display: 'flex',
  flexDirection: 'column',
  marginBottom: '1.5rem',
  gap: '1rem'
};

// Responsive header container
const headerContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

// Title style
const titleStyle = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#111827',
  margin: 0
};

// Controls container
const controlsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  width: '100%'
};

// Search input container
const searchContainerStyle = {
  position: 'relative',
  flex: '1 1 0%',
  minWidth: '200px'
};

// Search icon style
const searchIconStyle = {
  position: 'absolute',
  left: '0.75rem',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#9CA3AF',
  pointerEvents: 'none'
};

// Input base style
const inputBaseStyle = {
  display: 'block',
  width: '100%',
  padding: '0.5rem 0.75rem 0.5rem 2.25rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: '#111827',
  backgroundColor: '#FFFFFF',
  backgroundClip: 'padding-box',
  border: '1px solid #D1D5DB',
  borderRadius: '0.375rem',
  transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
  ':focus': {
    borderColor: '#3B82F6',
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)'
  }
};

// Select style
const selectStyle = {
  ...inputBaseStyle,
  padding: '0.5rem 2rem 0.5rem 0.75rem',
  appearance: 'none',
  backgroundImage: "url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");",
  backgroundPosition: 'right 0.5rem center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '1.5em 1.5em',
  paddingRight: '2.5rem',
  printColorAdjust: 'exact'
};

// Primary button style
const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#FFFFFF',
  backgroundColor: '#3B82F6',
  border: '1px solid transparent',
  borderRadius: '0.375rem',
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  cursor: 'pointer',
  transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
  ':hover': {
    backgroundColor: '#2563EB'
  },
  ':focus': {
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)'
  }
};

return (
  <div style={containerStyle}>
    <div style={headerContainerStyle}>
      <h1 style={titleStyle}>Promo Codes</h1>
      <div style={controlsStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={searchContainerStyle}>
            <div style={searchIconStyle}>
              <FaSearch size={16} />
            </div>
            <input
              type="text"
              placeholder="Search promos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={inputBaseStyle}
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Expired">Expired</option>
            <option value="Inactive">Inactive</option>
          </select>
          
          <select
            value={discountTypeFilter}
            onChange={(e) => setDiscountTypeFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="All">All Types</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
          
          <button
            onClick={handleAddPromo}
            style={primaryButtonStyle}
          >
            <FaPlus style={{ marginRight: '0.5rem' }} /> Add Promo Code
          </button>
        </div>
      </div>
    </div>

    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      overflow: 'hidden'
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Promo Code
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Discount Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Discount Value
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Min Order Value
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPromos.length > 0 ? (
              filteredPromos.map((promo) => (
                <tr key={promo.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {promo.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {promo.discountType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `₹${promo.discountValue}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{promo.minOrderValue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditPromo(promo)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ ...tableStyles.td, textAlign: 'center', color: '#6B7280' }}>
                  No promo codes found
                </td>
              </tr>
            )}
          </tbody>
        </table>
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#4B5563' }}>
                Showing <span style={{ fontWeight: 500 }}>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                <span style={{ fontWeight: 500 }}>
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredPromos.length)}
                </span>{' '}
                of <span style={{ fontWeight: 500 }}>{filteredPromos.length}</span> results
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.25rem 0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.375rem',
                    backgroundColor: 'white',
                    color: currentPage === 1 ? '#9CA3AF' : '#374151',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ':hover': currentPage === 1 ? {} : { backgroundColor: '#F9FAFB' },
                    opacity: currentPage === 1 ? 0.7 : 1
                  }}
                >
                  <FaChevronLeft style={{ display: 'inline-block' }} />
                </button>
                <span style={{ padding: '0.25rem 0.75rem', color: '#374151' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.25rem 0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.375rem', 
                    backgroundColor: 'white',
                    color: currentPage === totalPages ? '#9CA3AF' : '#374151',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ':hover': currentPage === totalPages ? {} : { backgroundColor: '#F9FAFB' },
                    opacity: currentPage === totalPages ? 0.7 : 1
                  }}
                >
                  <FaChevronRight style={{ display: 'inline-block' }} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && <PromoModal />}
    </div>
  );
};

export default PromoCode;