import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaPlus, 
  FaSearch, 
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
import './PromoCode.css';

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

  // Fetch promocodes on component mount
  useEffect(() => {
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

    fetchPromoCodes();
  }, []);

  // Get promo status based on dates and active state
  const getPromoStatus = (promo) => {
    const now = new Date();
    const startDate = new Date(promo.startDate);
    const endDate = promo.endDate ? new Date(promo.endDate) : null;

    if (!promo.isActive) return STATUS.INACTIVE;
    if (now < startDate) return STATUS.UPCOMING;
    if (endDate && now > endDate) return STATUS.EXPIRED;
    return STATUS.ACTIVE;
  };

  // Get status badge component
  const getStatusBadge = (status) => {
    const statusConfig = {
      [STATUS.ACTIVE]: { 
        className: 'statusBadge statusActive',
        icon: <FaCheckCircle size={12} />
      },
      [STATUS.UPCOMING]: { 
        className: 'statusBadge statusUpcoming',
        icon: <FaClock size={12} />
      },
      [STATUS.EXPIRED]: { 
        className: 'statusBadge statusExpired',
        icon: <FaTimesCircle size={12} />
      },
      [STATUS.INACTIVE]: { 
        className: 'statusBadge statusInactive',
        icon: <FaTimesCircle size={12} />
      }
    };

    const config = statusConfig[status] || statusConfig[STATUS.INACTIVE];
    
    return (
      <span className={config.className}>
        {config.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Filter and paginate promos
  const filteredPromos = useMemo(() => {
    return promoCodes.filter(promo => {
      const matchesSearch = 
        promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (promo.description && promo.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'All' || 
                         getPromoStatus(promo) === statusFilter.toLowerCase();
      
      const matchesType = discountTypeFilter === 'All' || 
                        promo.discountType === discountTypeFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [promoCodes, searchTerm, statusFilter, discountTypeFilter]);

  const totalPages = Math.ceil(filteredPromos.length / ITEMS_PER_PAGE);
  const paginatedPromos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPromos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPromos, currentPage]);

  // Handle pagination
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Handle promo actions
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

  // Loading state
  if (loading) {
    return (
      <div className="loadingContainer">
        <div className="spinner" />
        <p>Loading promo codes...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="errorContainer">
        <p className="errorMessage">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="primaryButton"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="promoContainer">
      <div className="promoHeader">
        <h1 className="title">Promo Codes</h1>
        <div className="controls">
          <div className="searchBox">
            <FaSearch className="searchIcon" />
            <input
              type="text"
              placeholder="Search promos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="searchInput"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filterSelect"
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
            className="filterSelect"
          >
            <option value="All">All Types</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
          <button
            onClick={handleAddPromo}
            className="primaryButton"
          >
            <FaPlus /> Add Promo Code
          </button>
        </div>
      </div>

      <div className="tableContainer">
        <table className="promoTable">
          <thead>
            <tr>
              <th className="tableHeader">Code</th>
              <th className="tableHeader">Description</th>
              <th className="tableHeader">Discount</th>
              <th className="tableHeader">Status</th>
              <th className="tableHeader">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPromos.length > 0 ? (
              paginatedPromos.map((promo) => {
                const status = getPromoStatus(promo);
                return (
                  <tr key={promo.id} className="tableRow">
                    <td className="tableCell">
                      <div className="promoCode">{promo.code}</div>
                    </td>
                    <td className="tableCell">
                      <div className="promoDescription">{promo.description || '-'}</div>
                    </td>
                    <td className="tableCell">
                      <div className="discountValue">
                        {promo.discountType === 'percentage' 
                          ? `${promo.discountValue}%` 
                          : `$${parseFloat(promo.discountValue).toFixed(2)}`}
                        {promo.maxDiscount && promo.discountType === 'percentage' && (
                          <span className="maxDiscount">
                            (max ${parseFloat(promo.maxDiscount).toFixed(2)})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="tableCell">
                      {getStatusBadge(status)}
                    </td>
                    <td className="tableCell">
                      <div className="actions">
                        <button
                          onClick={() => handleEditPromo(promo)}
                          className="actionButton editButton"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="actionButton deleteButton"
                          title="Delete"
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
                <td colSpan="5" className="emptyState">
                  No promo codes found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <div className="paginationInfo">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredPromos.length)} of {filteredPromos.length} results
          </div>
          <div className="paginationControls">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="pageButton"
            >
              <FaChevronLeft />
            </button>
            <span className="pageInfo">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="pageButton"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCode;
