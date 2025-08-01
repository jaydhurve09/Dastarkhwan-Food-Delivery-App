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
  deletePromoCode, 
  getAllUsers, 
  getAllMenuItems, 
  getAllCategories, 
  togglePromoCodeActive
} from '../services/promoCodeService';
import './PromoCode.css';

// Status constants
const STATUS = {
  ACTIVE: 'active',
  UPCOMING: 'upcoming',
  EXPIRED: 'expired',
  INACTIVE: 'inactive'
};

// Helper to format date as dd-mm-yyyy
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

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
    isActive: true,
    userType: 'all',
    specificUsers: [],
    appliesTo: 'total',
    menuItems: [],
    categories: []
  });
  const [allUsers, setAllUsers] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
// Loading and error states for dropdowns
const [usersLoading, setUsersLoading] = useState(false);
const [usersError, setUsersError] = useState("");
const [menuLoading, setMenuLoading] = useState(false);
const [menuError, setMenuError] = useState("");
const [catLoading, setCatLoading] = useState(false);
const [catError, setCatError] = useState("");
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

  // Fetch users, menu items, categories when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setUsersLoading(true); setUsersError("");
      setMenuLoading(true); setMenuError("");
      setCatLoading(true); setCatError("");
      getAllUsers()
        .then(setAllUsers)
        .catch(e => setUsersError(e.toString()))
        .finally(() => setUsersLoading(false));
      getAllMenuItems()
        .then(setAllMenuItems)
        .catch(e => setMenuError(e.toString()))
        .finally(() => setMenuLoading(false));
      getAllCategories()
        .then(setAllCategories)
        .catch(e => setCatError(e.toString()))
        .finally(() => setCatLoading(false));
    }
  }, [isModalOpen]);

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
      isActive: true,
      userType: 'all',
      specificUsers: [],
      appliesTo: 'total',
      menuItems: [],
      categories: []
    });
    setIsModalOpen(true);
  };

  const handleEditPromo = (promo) => {
    setSelectedPromo(promo);
    setFormData({
      ...promo,
      userType:
        promo.userSpecific?.type === 'specific_users'
          ? 'specific'
          : promo.userSpecific?.type === 'new_users'
          ? 'first-time'
          : 'all',
      specificUsers: Array.isArray(promo.userSpecific?.userIds) ? promo.userSpecific.userIds : [],
      appliesTo:
        promo.applicableOn?.type === 'menu_item'
          ? 'menu'
          : promo.applicableOn?.type === 'category'
          ? 'categories'
          : 'total',
      menuItems: Array.isArray(promo.applicableOn?.items) && promo.applicableOn.type === 'menu_item' ? promo.applicableOn.items : [],
      categories: Array.isArray(promo.applicableOn?.items) && promo.applicableOn.type === 'category' ? promo.applicableOn.items : [],
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
      <div className="promoContainer">
        <div className="errorContainer">
          <p className="errorMessage">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="primaryButton"
          >
            Retry
          </button>
        </div>
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
      // Map discountType to backend expected values
// Map userType and appliesTo to backend structure
const userSpecific = {
  type: formData.userType === 'first-time' ? 'new_users' : (formData.userType === 'specific' ? 'specific_users' : 'all'),
  userIds: formData.userType === 'specific' ? formData.specificUsers : []
};
const applicableOn = {
  type: formData.appliesTo === 'menu' ? 'menu_item' : (formData.appliesTo === 'categories' ? 'category' : 'all'),
  items: formData.appliesTo === 'menu' ? formData.menuItems : (formData.appliesTo === 'categories' ? formData.categories : [])
};
const mappedFormData = {
  ...formData,
  discountType: formData.discountType === 'fixed' ? 'fixed_amount' : formData.discountType,
  userSpecific,
  applicableOn
};
if (selectedPromo && selectedPromo.id) {
  await updatePromoCode(selectedPromo.id, mappedFormData);
} else {
  await createPromoCode(mappedFormData);
}
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
      <table className="promoTable">
        <thead>
          <tr>
  <th className="tableHeader">PROMO CODE</th>
  <th className="tableHeader">DISCOUNT</th>
  <th className="tableHeader">VALIDITY</th>
  <th className="tableHeader">USAGE/USER</th>
  <th className="tableHeader">STATUS</th>
  <th className="tableHeader">UPDATE</th>
  <th className="tableHeader">DELETE</th>
</tr>
        </thead>
        <tbody>
          {filteredPromos.length === 0 && (
            <tr>
              <td colSpan="9" className="emptyState">
                No promo codes found
              </td>
            </tr>
          )}
          {filteredPromos.map(promo => (
  <tr key={promo.id}>
    {/* PROMO CODE */}
    <td className="promoCodeCell">{promo.code}</td>
    {/* DISCOUNT */}
    <td className="discountCell">
      {promo.discountType === 'percentage' ? (
        <span>{promo.discountValue}%</span>
      ) : promo.discountType === 'fixed' ? (
        <span>&#8377;{parseFloat(promo.discountValue).toFixed(0)}</span>
      ) : promo.discountType === 'free_shipping' ? (
        <span>Free Shipping</span>
      ) : (
        <span>{promo.discountValue}</span>
      )}
    </td>
    {/* VALIDITY */}
    <td className="validityCell">
  {promo.startDate && promo.endDate ? (
    <div>{formatDate(promo.startDate)} - {formatDate(promo.endDate)}</div>
  ) : (
    '-'
  )}
</td>
    {/* USAGE/USER */}
    <td className="usageCell">{promo.usageLimit || '-'}</td>
    {/* STATUS with toggle */}
    <td className="statusCell">
  <label className="switch">
    <input
      type="checkbox"
      checked={promo.isActive}
      onChange={async () => {
        try {
          await togglePromoCodeActive(promo.id);
          const data = await getPromoCodes();
          setPromoCodes(data);
        } catch (err) {
          alert(err);
        }
      }}
      aria-label={promo.isActive ? 'Deactivate promo code' : 'Activate promo code'}
    />
    <span className="slider round"></span>
  </label>
</td>
    {/* UPDATE */}
    <td className="actionsCell">
      <button
        onClick={() => handleEditPromo(promo)}
        className="actionButton editButton"
        title="Edit"
      >
        <FaEdit />
      </button>
    </td>
    {/* DELETE */}
    <td className="actionsCell">
      <button
        onClick={() => handleDelete(promo)}
        className="actionButton deleteButton"
        title="Delete"
      >
        <FaTrash />
      </button>
    </td>
  </tr>
))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="pagination">
          <div>
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
    <div className="modalContent deleteModalContent">
      <button className="modalClose" onClick={cancelDelete}>&times;</button>
      <div className="deleteWarningIcon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#fff3cd" stroke="#f59e42" strokeWidth="2"/><path d="M12 7v5" stroke="#f59e42" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="16" r="1" fill="#f59e42"/></svg>
      </div>
      <h2 className="modalTitle" style={{color:'#b45309'}}>Delete Promo Code?</h2>
      <div className="deleteModalText">
        <p>This action <b>cannot be undone</b>. Deleting will permanently remove the promo code and all its data.</p>
        <div className="deletePromoDetails">
          <div><b>Code:</b> {deleteTarget?.code}</div>
          {deleteTarget?.description && <div><b>Description:</b> {deleteTarget.description}</div>}
        </div>
        <p style={{marginTop:8, color:'#b45309'}}><b>Are you sure you want to proceed?</b></p>
      </div>
      {deleteError && <div className="errorMessage" style={{marginBottom:8}}>{deleteError}</div>}
      {deleteLoading && <div className="spinner" style={{margin:'0 auto 1rem auto'}} />}
      <div className="formActions deleteModalActions">
       
        <button type="button" className="dangerButton" onClick={confirmDelete} disabled={deleteLoading}>Delete</button>
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
  {/* 1st line: Promo Code Name (full width) */}
  <div className="formRow">
    <div className="formGroup" style={{flex: 1}}>
      <label>Promo Code Name</label>
      <input type="text" className="formInput" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
    </div>
  </div>
  {/* 2nd line: Dates */}
  <div className="formRow">
    <div className="formGroup">
      <label>Start Date</label>
      <input type="date" className="formInput" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
    </div>
    <div className="formGroup">
      <label>Expiry Date</label>
      <input type="date" className="formInput" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
    </div>
  </div>
  {/* 3rd line: User Type & Apply On */}
  <div className="formRow">
    <div className="formGroup">
      <label>User Type</label>
      <div className="formRadioGroup">
        <label>
          <input type="radio" name="userType" value="all" checked={formData.userType === 'all'} onChange={e => setFormData({ ...formData, userType: 'all', specificUsers: [] })} /> All users
        </label>
        <label>
          <input type="radio" name="userType" value="first-time" checked={formData.userType === 'first-time'} onChange={e => setFormData({ ...formData, userType: 'first-time', specificUsers: [] })} /> First-time users
        </label>
        <label>
          <input type="radio" name="userType" value="specific" checked={formData.userType === 'specific'} onChange={e => setFormData({ ...formData, userType: 'specific' })} /> Specific users
        </label>
      </div>
      {formData.userType === 'specific' && (
  <div className="checkboxList">
    {usersLoading ? (
      <div style={{ color:'#2563eb' }}>Loading users...</div>
    ) : usersError ? (
      <div className="errorMessage">{usersError}</div>
    ) : allUsers && allUsers.length > 0 ? (
      allUsers.map(u => (
        <label key={u.id || u._id} className="checkboxItem">
          <input
            type="checkbox"
            value={u.id || u._id}
            checked={Array.isArray(formData.specificUsers) && formData.specificUsers.includes(u.id || u._id)}
            onChange={e => {
              const val = u.id || u._id;
              setFormData(prev => ({
                ...prev,
                specificUsers: e.target.checked
                  ? [...prev.specificUsers, val]
                  : prev.specificUsers.filter(id => id !== val)
              }));
            }}
          />
          {u.email || u.name || u.phone}
        </label>
      ))
    ) : (
      <div style={{ color: '#888' }}>No users found</div>
    )}
  </div>
)}
    </div>
    <div className="formGroup">
      <label>Apply On</label>
      <select className="formInput" value={formData.appliesTo} onChange={e => setFormData({ ...formData, appliesTo: e.target.value, menuItems: [], categories: [] })}>
        <option value="total">Total Order (All Menu Items)</option>
        <option value="menu">Menu Items</option>
        <option value="categories">Specific Categories</option>
      </select>
      {formData.appliesTo === 'menu' && (
  <div className="checkboxList">
    {menuLoading ? (
      <div style={{ color:'#2563eb' }}>Loading menu items...</div>
    ) : menuError ? (
      <div className="errorMessage">{menuError}</div>
    ) : allMenuItems && allMenuItems.length > 0 ? (
      allMenuItems.map(item => (
        <label key={item.id || item._id} className="checkboxItem">
          <input
            type="checkbox"
            value={item.id || item._id}
            checked={formData.menuItems.includes(item.id || item._id)}
            onChange={e => {
              const val = item.id || item._id;
              setFormData(prev => ({
                ...prev,
                menuItems: e.target.checked
                  ? [...prev.menuItems, val]
                  : prev.menuItems.filter(id => id !== val)
              }));
            }}
          />
          {item.name}
        </label>
      ))
    ) : (
      <div style={{ color: '#888' }}>No menu items found</div>
    )}
  </div>
)}
      {formData.appliesTo === 'categories' && (
  <div className="checkboxList">
    {catLoading ? (
      <div style={{ color:'#2563eb' }}>Loading categories...</div>
    ) : catError ? (
      <div className="errorMessage">{catError}</div>
    ) : allCategories && allCategories.length > 0 ? (
      allCategories.map(cat => (
        <label key={cat.id || cat._id} className="checkboxItem">
          <input
            type="checkbox"
            value={cat.id || cat._id}
            checked={formData.categories.includes(cat.id || cat._id)}
            onChange={e => {
              const val = cat.id || cat._id;
              setFormData(prev => ({
                ...prev,
                categories: e.target.checked
                  ? [...prev.categories, val]
                  : prev.categories.filter(id => id !== val)
              }));
            }}
          />
          {cat.name}
        </label>
      ))
    ) : (
      <div style={{ color: '#888' }}>No categories found</div>
    )}
  </div>
)}
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
                  <div className="formActions" style={{display:'flex',flexDirection:'row',gap:'0.75rem',width:'100%',justifyContent:'flex-end'}}>
  <button 
    type="button" 
    className="secondaryButton" 
    onClick={() => setIsModalOpen(false)}
  >
    Cancel
  </button>
    
  <button 
    type="submit" 
    className="primaryButton"
  >
    {selectedPromo && selectedPromo.id ? 'Update' : 'Save'}
  </button>
</div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCode;
