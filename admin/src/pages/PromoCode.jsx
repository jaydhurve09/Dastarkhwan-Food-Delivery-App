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
  // Modal and promo code state
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
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
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

  const handleDelete = (promo) => {
    setDeleteTarget(promo);
    setDeleteModalOpen(true);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deletePromoCode(deleteTarget.id);
      setPromoCodes(promoCodes.filter(promo => promo.id !== deleteTarget.id));
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(error.message || 'Failed to delete promo code.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setDeleteTarget(null);
    setDeleteError('');
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

  // Handle create promo code from modal
  async function handleModalSubmit(e) {
    e.preventDefault();
    setModalError('');
    // Basic validation
    if (!formData.code || !formData.startDate || !formData.discountType || !formData.discountValue) {
      setModalError('Please fill all required fields.');
      return;
    }
    setModalLoading(true);
    try {
      await createPromoCode(formData);
      // Refresh list
      const data = await getPromoCodes();
      setPromoCodes(data);
      setIsModalOpen(false);
      // Reset form
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
    } catch (err) {
      setModalError(err.message || 'Failed to create promo code.');
    } finally {
      setModalLoading(false);
    }
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
                          className="actionButton deleteButton"
                          title="Delete"
                          onClick={() => handleDelete(promo)}
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

      {/* Modal for Delete Promo Code */}
      {deleteModalOpen && (
        <div className="modalOverlay">
          <div className="modalContent">
            <button className="modalClose" onClick={cancelDelete}>&times;</button>
            <h2 className="modalTitle">Delete Promo Code</h2>
            <div style={{marginBottom:'1.5rem', fontSize:'1.05rem', color:'#374151'}}>
              Are you sure you want to delete promo code <b>{deleteTarget?.code}</b>?
            </div>
            {deleteError && <div className="errorMessage" style={{marginBottom:8}}>{deleteError}</div>}
            {deleteLoading && <div className="spinner" style={{margin:'0 auto 1rem auto'}} />}
            <div className="formActions">
              <button type="button" className="secondaryButton" onClick={cancelDelete} disabled={deleteLoading}>Cancel</button>
              <button type="button" className="primaryButton" style={{background:'#ef4444'}} onClick={confirmDelete} disabled={deleteLoading}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Create Promo Code */}
      {isModalOpen && (
        <div className="modalOverlay">
          <div className="modalContent">
            <button className="modalClose" onClick={() => setIsModalOpen(false)}>&times;</button>
            <h2 className="modalTitle">Create Promo Code</h2>
            <form className="promoForm" onSubmit={handleModalSubmit}>
              {modalError && <div className="errorMessage" style={{marginBottom: 8}}>{modalError}</div>}
              {modalLoading && <div className="spinner" style={{margin:'0 auto 1rem auto'}} />}
              <div className="formRow">
                <div className="formGroup">
                  <label>Promo Code Name</label>
                  <input type="text" className="formInput" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                </div>
                <div className="formGroup">
                  <label>Start Date</label>
                  <input type="date" className="formInput" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
              </div>
              <div className="formRow">
                <div className="formGroup">
                  <label>Expiry Date</label>
                  <input type="date" className="formInput" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
                <div className="formGroup">
                  <label>Users</label>
                  <div className="formRadioGroup">
                    <label><input type="radio" name="users" checked /> All users</label>
                    <label><input type="radio" name="users" /> First-time users</label>
                    <label><input type="radio" name="users" /> Specific users</label>
                  </div>
                </div>
              </div>
              <div className="formRow">
                <div className="formGroup">
                  <label>Usage Limit Per User</label>
                  <input type="number" min="1" className="formInput" value={formData.usageLimit} onChange={e => setFormData({ ...formData, usageLimit: e.target.value })} />
                </div>
                <div className="formGroup">
                  <label>Discount Type</label>
                  <select className="formInput" value={formData.discountType} onChange={e => setFormData({ ...formData, discountType: e.target.value })}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>
              <div className="formRow">
                <div className="formGroup">
                  <label>Discount Value</label>
                  <input type="number" min="0" className="formInput" value={formData.discountValue} onChange={e => setFormData({ ...formData, discountValue: e.target.value })} />
                </div>
                <div className="formGroup">
                  <label>Minimum Order Value</label>
                  <input type="number" min="0" className="formInput" value={formData.minOrderValue} onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })} />
                </div>
              </div>
              <div className="formRow">
                <div className="formGroup">
                  <label>Apply On</label>
                  <div className="formCheckboxGroup">
                    <label><input type="checkbox" /> Total Order</label>
                    <label><input type="checkbox" /> Menu Items</label>
                    <label><input type="checkbox" /> Specific Categories</label>
                  </div>
                </div>
              </div>
              <div className="formActions">
                <button type="button" className="secondaryButton" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primaryButton">Save Promo Code</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCode;
