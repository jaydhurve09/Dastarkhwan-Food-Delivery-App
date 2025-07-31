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
import { toast } from 'react-toastify';
import { 
  getPromoCodes, 
  createPromoCode, 
  updatePromoCode, 
  deletePromoCode 
} from '../services/promoCodeService';

// Status constants
const STATUS = {
  ACTIVE: 'active',
  UPCOMING: 'upcoming',
  EXPIRED: 'expired',
  INACTIVE: 'inactive'
};

const PromoCode = () => {
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
        toast.error('Failed to load promo codes');
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
          bg: 'bg-green-100 text-green-800', 
          icon: <FaCheckCircle className="inline mr-1" /> 
        },
        [STATUS.UPCOMING]: { 
          bg: 'bg-blue-100 text-blue-800', 
          icon: <FaClock className="inline mr-1" /> 
        },
        [STATUS.EXPIRED]: { 
          bg: 'bg-red-100 text-red-800', 
          icon: <FaTimesCircle className="inline mr-1" /> 
        },
        [STATUS.INACTIVE]: { 
          bg: 'bg-gray-100 text-gray-800', 
          icon: <FaTimesCircle className="inline mr-1" /> 
        }
      };
  
      const config = statusConfig[status] || statusConfig[STATUS.INACTIVE];
      
      return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg}`}>
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
        toast.success('Promo code deleted successfully');
      } catch (error) {
        console.error('Error deleting promo code:', error);
        toast.error(error.message || 'Failed to delete promo code');
      }
    }
  };
    // Form handling
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      try {
        const promoData = {
          code: formData.code,
          description: formData.description,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          minOrderValue: parseFloat(formData.minOrderValue) || 0,
          maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit, 10) : null,
          isActive: formData.isActive
        };
  
        if (selectedPromo) {
          const updatedPromo = await updatePromoCode(selectedPromo.id, promoData);
          setPromoCodes(promoCodes.map(p => 
            p.id === selectedPromo.id ? { ...p, ...updatedPromo } : p
          ));
          toast.success('Promo code updated successfully');
        } else {
          const newPromo = await createPromoCode(promoData);
          setPromoCodes([...promoCodes, newPromo]);
          toast.success('Promo code created successfully');
        }
  
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error saving promo code:', error);
        toast.error(error.message || 'Failed to save promo code');
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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Code *</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Discount Type *</label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
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
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Promo Codes</h2>
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search promo codes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="All">All Status</option>
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="expired">Expired</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={discountTypeFilter}
                  onChange={(e) => setDiscountTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="All">All Types</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <button
                onClick={handleAddPromo}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaPlus className="mr-2" /> Add Promo Code
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPromos.length > 0 ? (
                  paginatedPromos.map((promo) => {
                    const status = getPromoStatus(promo);
                    return (
                      <tr key={promo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {promo.code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {promo.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {promo.discountType === 'percentage' 
                            ? `${promo.discountValue}%` 
                            : `$${parseFloat(promo.discountValue).toFixed(2)}`}
                          {promo.maxDiscount && promo.discountType === 'percentage' && (
                            <span className="text-xs text-gray-500 ml-1">(max ${parseFloat(promo.maxDiscount).toFixed(2)})</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditPromo(promo)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(promo.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No promo codes found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredPromos.length)}
                </span>{' '}
                of <span className="font-medium">{filteredPromos.length}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 border rounded-md ${
                    currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FaChevronLeft className="inline" />
                </button>
                <span className="px-3 py-1">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 border rounded-md ${
                    currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FaChevronRight className="inline" />
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