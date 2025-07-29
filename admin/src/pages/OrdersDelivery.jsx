import React, { useState, useMemo,useContext } from 'react';
import { FaSearch, FaEye, FaMotorcycle, FaMapMarkerAlt, FaEdit, FaTimes, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

// --- Mock Data (Self-Contained) ---
const mockOrders = [
    { id: '#12345', customerName: 'John', date: '22/06/2025', status: 'Delivered', paymentStatus: 'Paid', items: ['Pizza', 'Coke'], deliveryAgent: 'Albus' },
    { id: '#12346', customerName: 'Smith', date: '22/06/2025', status: 'Delivered', paymentStatus: 'Paid', items: ['Burger', 'Fries'], deliveryAgent: 'Melvin' },
    { id: '#12347', customerName: 'Ken', date: '22/06/2025', status: 'Out for Delivery', paymentStatus: 'Paid', items: ['Pasta'], deliveryAgent: 'Tom', agentLocation: { lat: 34.0522, lng: -118.2437 } }, // Added mock location for tracking
    { id: '#12348', customerName: 'Bob', date: '22/06/2025', status: 'Assigned', paymentStatus: 'Paid', items: ['Salad', 'Water'], deliveryAgent: 'Cross' },
    { id: '#12349', customerName: 'Alice', date: '22/06/2025', status: 'Delivered', paymentStatus: 'Inview', items: ['Sandwich'], deliveryAgent: 'Alas' },
    { id: '#12350', customerName: 'Charlie', date: '23/06/2025', status: 'Cancelled', paymentStatus: 'Refunded', items: ['Steak'], deliveryAgent: null },
];

const mockDeliveryAgents = ['Albus', 'Melvin', 'Tom', 'Cross', 'Alas', 'Zane', 'Duke'];

// --- Helper Components (Self-Contained) ---
import { AdminContext } from '../contexts/adminContext.jsx'; // Import the AdminContext
const OrderDetailsModal = ({ order, onClose, onAssign, onCancel, onUpdate, onTrack }) => {

    const { deliveryPartners, users } = useContext(AdminContext); // Only get deliveryPartners if needed
    const [isEditing, setIsEditing] = useState(false);
    const [editedItems, setEditedItems] = useState(() =>
        order && Array.isArray(order.items) ? [...order.items] : []
    );

    const canModify = order && order.status !== 'Delivered' && order.status !== 'Cancelled';

    const handleUpdate = () => {
        onUpdate(order.id, editedItems); // Send back the modified array of item objects
        setIsEditing(false);
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...editedItems];
        updated[index][field] = value;
        setEditedItems(updated);
    };

    // Move isDeliveryAgentAssigned above deliveryAgentName
    const isDeliveryAgentAssigned = order && order.deliveryPartnerId && deliveryPartners.some(dp => dp.id === order.deliveryPartnerId);
    //store the name of the delivery agent
    const deliveryAgentName = isDeliveryAgentAssigned ? deliveryPartners.find(dp => dp.id === order.deliveryPartnerId)?.name : '';
const userName = users.find(user => user.id === order.userId)?.name || 'Unknown User';
    const styles = {
        modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 },
        modalContent: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '500px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' },
        modalHeader: { fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' },
        detailRow: { marginBottom: '0.8rem', fontSize: '1.1rem' },
        actions: { marginTop: '2rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' },
        button: { padding: '0.6rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', color: 'white' },
    };

    if (!order) return null;
    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <h2 style={styles.modalHeader}>Order No: {order.orderNumber}</h2>
                <div style={styles.detailRow}><strong>Customer:</strong> {userName}</div>
                <div style={styles.detailRow}><strong>Status:</strong> {order.status}</div>
                <div style={styles.detailRow}><strong>Delivery Agent:</strong> {deliveryAgentName || 'Not Assigned'}</div>
                <div style={styles.detailRow}>
                    <strong>Items:</strong>
            {isEditing ? (
                Array.isArray(editedItems) && editedItems.map((item, index) => (
                    <div key={index} style={{ marginBottom: '1rem' }}>
                        <input
                            type="text"
                            value={item.name}
                            placeholder="Name"
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            style={{ width: '30%', marginRight: '0.5rem' }}
                        />
                        <input
                            type="number"
                            value={item.quantity}
                            placeholder="Qty"
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                            style={{ width: '20%', marginRight: '0.5rem' }}
                        />
                        <input
                            type="text"
                            value={item.specialInstructions || ''}
                            placeholder="Special Instructions"
                            onChange={(e) => handleItemChange(index, 'specialInstructions', e.target.value)}
                            style={{ width: '25%' }}
                        />
                    </div>
                ))
            ) : (
                <ul>{Array.isArray(order.items) ? order.items.map((item, i) => <li key={i}>{typeof item === 'string' ? item : item.name || JSON.stringify(item)}</li>) : null}</ul>
            )}
        </div>

                <div style={styles.actions}>
                    <div>
                        {canModify && (
                            <>
                                <button style={{ ...styles.button, backgroundColor: '#3b82f6' }} onClick={() => onAssign(order)}><FaMotorcycle /> (Re)Assign</button>
                                <button style={{ ...styles.button, backgroundColor: '#ef4444', marginLeft: '10px' }} onClick={() => onCancel(order.id)}><FaTimes /> Cancel</button>
                                {isEditing ? (
                                    <button style={{ ...styles.button, backgroundColor: '#10b981', marginLeft: '10px' }} onClick={handleUpdate}>Save</button>
                                ): (
                                    <button style={{ ...styles.button, backgroundColor: '#eab308', marginLeft: '10px' }} onClick={() => setIsEditing(true)}><FaEdit /> Update</button>
                                )}
                            </>
                        )}
                        {order.status === 'Out for Delivery' && <button style={{...styles.button, backgroundColor: '#8b5cf6', marginLeft: '10px'}} onClick={() => onTrack(order)}><FaMapMarkerAlt /> Track</button>}
                    </div>
                    <button style={{ ...styles.button, backgroundColor: '#6b7280' }} onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

const AssignAgentModal = ({ onClose, onSave, currentAgent, orderId }) => {
    const { deliveryPartners } = useContext(AdminContext); // Get delivery partners
    // Initialize selectedAgentId to current agent's ID or first delivery partner's ID
    const initialAgentId = currentAgent
        ? (deliveryPartners.find(dp => dp.name === currentAgent)?.id || '')
        : (deliveryPartners.length > 0 ? deliveryPartners[0].id : '');
    const [selectedAgentId, setSelectedAgentId] = useState(initialAgentId);

return (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1002
  }}>
    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px' }}>
      <h3 style={{ marginTop: 0 }}>Assign Delivery Agent</h3>

      <select
        value={selectedAgentId}
        onChange={e => setSelectedAgentId(e.target.value)}
        style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
      >
        {deliveryPartners.map(agent => (
          <option key={agent.id} value={agent.id}>{agent.name}</option>
        ))}
      </select>

      <div style={{
        marginTop: '1.5rem',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem'
      }}>
        <button
          onClick={onClose}
          style={{ padding: '0.5rem 1rem', border: '1px solid #ccc' }}
        >
          Cancel
        </button>

        <button
          onClick={() => {
            console.log(`Assigned agent ID: ${selectedAgentId}`);
            onSave({ selectedAgentId, orderId }); // Pass only the agent ID

          }}  // ✅ Pass only the agent ID
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            color: 'white',
            backgroundColor: '#2563eb'
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

};


const TrackingModal = ({ orders, onClose }) => {

    const mapPlaceholderStyle = {
        width: '100%',
        height: '250px',
        backgroundColor: '#e0e0e0',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '1.2rem',
        color: '#666',
        border: '1px dashed #aaa',
        marginBottom: '1rem',
        flexDirection: 'column',
        gap: '0.5rem',
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1002 }}>
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', textAlign: 'center', maxWidth: '500px', width: '90%' }}>
                <h3 style={{marginTop: 0}}>Tracking Order {orders.id}</h3>
                <p>Delivery Agent: <strong>{orders.deliveryAgent}</strong></p>
                {orders.status === 'Out for Delivery' && orders.agentLocation ? (
                    <>
                        <div style={mapPlaceholderStyle}>
                            <FaMapMarkerAlt size={40} color="#3b82f6" />
                            <span>Live Map Placeholder</span>
                            <span>(Agent Location: Lat: {orders.agentLocation.lat}, Lng: {orders.agentLocation.lng})</span>
                            <p style={{fontSize: '0.9rem', color: '#888', marginTop: '0.5rem'}}>
                                In a real app, this would be an interactive map (e.g., Google Maps API)
                                showing the live location of {orders.deliveryAgent}.
                            </p>
                        </div>
                        <p style={{marginTop: '1rem'}}>Current Location: Lat: {orders.agentLocation.lat}, Lng: {orders.agentLocation.lng}</p>
                    </>
                ) : (
                    <p>Tracking information not available for this order status.</p>
                )}
                <button onClick={onClose} style={{marginTop: '1rem', padding: '0.5rem 1.5rem', borderRadius: '6px', border: 'none', backgroundColor: '#6b7280', color: 'white', cursor: 'pointer'}}>Close</button>
            </div>
        </div>
    );
};

// --- Main Component ---
export default function OrdersDelivery() {
    const { orders, deliveryPartners , users } = useContext(AdminContext); // Use context to access orders
    const [activeTab, setActiveTab] = useState('Orders'); // 'Orders' or 'Delivery'
    
    const [statusFilter, setStatusFilter] = useState('All'); // All, Delivered, Cancelled
    const [selectedOrder, setSelectedOrder] = useState(null); // For modals
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // State for profile dropdown visibility
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    // Mock logged-in user data for OrdersDelivery
    const [loggedInUser, setLoggedInUser] = useState({
        name: 'Delivery Manager',
        role: 'CRM Manager',
    });

    // Handle logout functionality
    const handleLogout = () => {
        console.log('User logged out from Orders/Delivery!');
        // In a real application, you would clear authentication tokens, redirect to login, etc.
        alert('You have been successfully logged out from Orders/Delivery.');
        setShowProfileDropdown(false); // Close dropdown after logout
    };

    const filteredData = useMemo(() => {
        let data = activeTab === 'Orders'
            ? orders
            : orders.filter(o => o.deliveryAgent && o.status !== 'Cancelled');

        if (statusFilter !== 'All') {
            data = data.filter(o => o.status === statusFilter);
        }
        
        if (searchTerm) {
            if (activeTab === 'Orders') {
                data = data.filter(o => o.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
            } else {
                data = data.filter(o => o.deliveryAgent.toLowerCase().includes(searchTerm.toLowerCase()));
            }
        }

        return data;
    }, [orders, activeTab, statusFilter, searchTerm]);

    // --- Handlers ---
    const handleUpdateOrderItems = (orderId, newItems) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: newItems } : o));
    };
    
    const handleCancelOrder = (orderId) => {
        setOrders(prev => prev.map(o => o.id === orderId ? {...o, status: 'Cancelled'} : o));
        setSelectedOrder(null);
    };
    
    const handleAssignAgent = (agentId,orderId) => {
        // Find the agent object by ID
        console.log(agentId);
        const agentObj = deliveryPartners.find(dp => dp.id === agentId);
        
        const agentName = agentObj ? agentObj.name : '';
        setOrders(prev => prev.map(o =>
            o.id === selectedOrder.id
                ? { ...o, deliveryAgent: agentName, deliveryPartnerId: agentId, status: 'Assigned' }
                : o
        ));
        setIsAssignModalOpen(false);
        setSelectedOrder(null);
    };
 function convertFirestoreTimestampToIST(timestamp) {
  if (!timestamp || typeof timestamp._seconds !== 'number') return '';

  const utcDate = new Date(timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1e6));

        // Add 5.5 hours for IST
        const istOffsetMs = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(utcDate.getTime() + istOffsetMs);

        const day = String(istDate.getDate()).padStart(2, '0');
        const month = String(istDate.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = istDate.getFullYear();

        return `${day}/${month}/${year}`;
    }

  



    // --- Inline Styles ---
    const styles = {
        container: { padding: '2rem', backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', position: 'relative' }, // Added relative for dropdown
        searchBar: { display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '20px', width: '300px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
        searchInput: { border: 'none', outline: 'none', marginLeft: '0.5rem', fontSize: '1rem', width: '100%' },
        tabContainer: { display: 'flex', borderBottom: '2px solid #ccc', marginBottom: '1rem' },
        tab: { padding: '0.8rem 1.5rem', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', background: 'none', transition: 'color 0.2s, border-bottom 0.2s' },
        activeTab: { borderBottom: '3px solid #1a2c3e', color: '#1a2c3e' },
        tableContainer: { backgroundColor: 'white', borderRadius: '8px', padding: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
        tableRow: { display: 'grid', gridTemplateColumns: activeTab === 'Orders' ? '1fr 1fr 1fr 1fr 1fr 1fr' : '1fr 1fr 1fr 1fr 1fr', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #e0e0e0' },
        tableHeader: { fontWeight: 'bold', padding: '1rem', textAlign: 'left', backgroundColor: '#f5f7fa', borderBottom: '1px solid #eee', textTransform: 'uppercase', fontSize: '0.9rem', color: '#666' },
        filterButtons: { marginBottom: '1rem', display: 'flex', gap: '1rem' },
        filterButton: { padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer', backgroundColor: '#fff', transition: 'background-color 0.2s, color 0.2s' },
        activeFilter: { backgroundColor: '#1a2c3e', color: 'white', borderColor: '#1a2c3e' },
        actionButton: { cursor: 'pointer', background: 'none', border: 'none', color: '#3b82f6', fontSize: '1.2rem', transition: 'color 0.2s' },
        
        // Profile Dropdown Styles (copied from AdminSettings for consistency)
        iconButton: {
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: '#666',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            transition: 'background-color 0.2s',
        },
        profileDropdown: {
            position: 'absolute',
            top: '40px', // Adjust based on header height
            right: '0',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            minWidth: '200px',
            zIndex: 999,
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            border: '1px solid #eee',
        },
        dropdownUserInfo: {
            paddingBottom: '10px',
            borderBottom: '1px solid #eee',
            marginBottom: '10px',
        },
        dropdownUserName: {
            fontSize: '18px',
            fontWeight: '600',
            color: '#333',
        },
        dropdownUserRole: {
            fontSize: '14px',
            color: '#777',
        },
        dropdownButton: {
            width: '100%',
            padding: '10px 15px',
            border: 'none',
            borderRadius: '5px',
            backgroundColor: '#007bff',
            color: '#fff',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.2s',
        },
    };

    const OrdersTab = () => (
        <>
            <div style={{ ...styles.tableRow, ...styles.tableHeader }}>
                <span>Order ID</span><span>Customer Name</span><span>Date</span><span>Status</span><span>Payment Status</span><span>Actions</span>
            </div>
            {filteredData.map(order => {
                const istCreatedAt = convertFirestoreTimestampToIST(order.createdAt);
                const userName = users.find(user => user.id === order.userId)?.name || 'Unknown User'; // Get user name from users context
                return (
                    <div style={styles.tableRow} key={order.id}>
                        <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{order.orderNumber}</span>
                        <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',paddingLeft:'8px'}}>{userName}</span>
                        <span>{istCreatedAt ? istCreatedAt.toLocaleString('en-IN') : 'N/A'}</span>
                        <span>{order.status}</span>
                        <span>{order.paymentStatus}</span>
                        <span><button style={styles.actionButton} onClick={() => setSelectedOrder(order)}><FaEye /></button></span>
                    </div>
                );
            })}
        </>
    );

    const DeliveryTab = () => (
        <>
            <div style={{ ...styles.tableRow, ...styles.tableHeader }}>
                <span>Order ID</span><span>Delivery Agent</span><span>Date</span><span>Status</span><span>Actions</span>
            </div>
            {filteredData.map(order => {
                const istCreatedAt = convertFirestoreTimestampToIST(order.createdAt);
                return (
                    <div style={styles.tableRow} key={order.id}>
                     <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{order.orderNumber}</span>
                        <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',paddingLeft:'8px'}}>{userName}</span>
                        <span>{istCreatedAt ? istCreatedAt.toLocaleString('en-IN') : 'N/A'}</span>
                        <span>{order.status}</span>
                        <span>{order.paymentStatus}</span>
                        <span><button style={styles.actionButton} onClick={() => setSelectedOrder(order)}><FaEye /></button></span>
                    </div>
                );
            })}
        </>
    );

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.searchBar}>
                    <FaSearch color="#888" />
                    <input type="text" placeholder={activeTab === 'Orders' ? "Search for customer..." : "Search for delivery agent..."} style={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                {/* Profile Icon and Dropdown */}
                <div style={{ position: 'relative' }}>
                    <button
                        style={styles.iconButton}
                        title="User Profile"
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    >
                        <FaUserCircle />
                    </button>
                    {showProfileDropdown && loggedInUser && (
                        <div style={styles.profileDropdown}>
                            <div style={styles.dropdownUserInfo}>
                                <p style={styles.dropdownUserName}>{loggedInUser.name}</p>
                                <p style={styles.dropdownUserRole}>{loggedInUser.role}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                style={styles.dropdownButton}
                            >
                                <FaSignOutAlt /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div style={styles.tabContainer}>
                <button style={{ ...styles.tab, ...(activeTab === 'Orders' ? styles.activeTab : {}) }} onClick={() => setActiveTab('Orders')}>ORDERS</button>
                <button style={{ ...styles.tab, ...(activeTab === 'Delivery' ? styles.activeTab : {}) }} onClick={() => setActiveTab('Delivery')}>DELIVERY</button>
            </div>

            <div style={styles.filterButtons}>
                <button style={{...styles.filterButton, ...(statusFilter === 'All' ? styles.activeFilter : {})}} onClick={() => setStatusFilter('All')}>All</button>
                <button style={{...styles.filterButton, ...(statusFilter === 'Delivered' ? styles.activeFilter : {})}} onClick={() => setStatusFilter('Delivered')}>Delivered</button>
                <button style={{...styles.filterButton, ...(statusFilter === 'Cancelled' ? styles.activeFilter : {})}} onClick={() => setStatusFilter('Cancelled')}>Cancelled</button>
            </div>

            <div style={styles.tableContainer}>
                {activeTab === 'Orders' ? <OrdersTab /> : <DeliveryTab />}
            </div>
            
            {selectedOrder && (
                <OrderDetailsModal 
                    order={selectedOrder} 
                
                    onClose={() => setSelectedOrder(null)} 
                    onAssign={() => setIsAssignModalOpen(true)}
                    onCancel={handleCancelOrder}
                    onUpdate={handleUpdateOrderItems}
                    onTrack={() => setIsTrackingModalOpen(true)}
                />
            )}

            {isAssignModalOpen && selectedOrder && (
                <AssignAgentModal
                    currentAgent={selectedOrder.deliveryPartnerId}
                    orderId={selectedOrder.id}
                    onClose={() => setIsAssignModalOpen(false)}
                    onSave={handleAssignAgent}
                />
            )}
            
            {isTrackingModalOpen && selectedOrder && (
                <TrackingModal
                    order={selectedOrder}
                    onClose={() => setIsTrackingModalOpen(false)}
                />
            )}
        </div>
    );
}
