import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import OrderDetailsPopup from './OrderDetailsPopup';
import { MdOutlineRefresh } from "react-icons/md";

const IncomingOrders = ({
  styles,
  incomingOrders,
  filteredIncomingOrders,
  isLoadingOrders,
  ordersError,
  autoAssignPartners,
  setAutoAssignPartners,
  fetchYetToBeAcceptedOrders,
  incomingOrdersSearch,
  setIncomingOrdersSearch,
  getOrderStatusStyle,
  extractMenuItemId,
  menuItemNameCache,
  isDeliveryPartnerAssigned,
  getDeliveryPartnerInfo,
  deliveryPartners,
  handleDispatchOrder,
  activeDeliveryPartners,
  selectedPartners,
  handlePartnerSelection,
  assigningOrders,
  handleAssignPartner,
  handleAcceptOrderWithNotification,
  handleUpdateOrderStatus
}) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderPopup, setShowOrderPopup] = useState(false);

  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setShowOrderPopup(true);
  };

  const closeOrderPopup = () => {
    setShowOrderPopup(false);
    setSelectedOrder(null);
  };

  return (
    <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={styles.cardTitle}>Incoming Orders</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Auto-assignment toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
              Auto-assign Partners:
            </label>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '50px',
              height: '24px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={autoAssignPartners}
                onChange={(e) => setAutoAssignPartners(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: autoAssignPartners ? '#4CAF50' : '#ccc',
                borderRadius: '24px',
                transition: '0.3s',
                cursor: 'pointer'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: autoAssignPartners ? '29px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}></span>
              </span>
            </label>
            <span style={{
              fontSize: '12px',
              color: autoAssignPartners ? '#4CAF50' : '#999',
              fontWeight: '500',
              minWidth: '30px'
            }}>
              {autoAssignPartners ? 'ON' : 'OFF'}
            </span>
          </div>
          <button
            onClick={fetchYetToBeAcceptedOrders}
            style={{
              ...styles.button,
              backgroundColor: '#3498db',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              borderRadius: '60px',
            }}
          >
            <MdOutlineRefresh size={20} />
          </button>
        </div>
      </div>

      {/* Search bar for incoming orders */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search orders by ID, customer, items, total, date, or status..."
          value={incomingOrdersSearch}
          onChange={(e) => setIncomingOrdersSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.3s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3498db'}
          onBlur={(e) => e.target.style.borderColor = '#ddd'}
        />
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
                <th style={styles.th}>Address</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Status</th>
                <th style={{...styles.th, width: '200px', maxWidth: '200px'}}>Delivery Partner</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncomingOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ ...styles.td, textAlign: 'center', padding: '40px', color: '#666' }}>
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
                filteredIncomingOrders.map((order, index) => (
                  <tr 
                    key={`order-${order.id || index}`}
                    onClick={() => handleRowClick(order)}
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                  >
                    <td style={styles.td}>
                      <div style={{ fontWeight: 'bold' }}>#{order.orderId || order.id}</div>
                    </td>
                    <td style={styles.td}>
                      {order.userInfo?.display_name || order.userInfo?.name || 'N/A'}
                    </td>
                    <td style={styles.td}>
                      {Array.isArray(order.products) && order.products.length > 0 ? (
                        <div>
                          <p className="font-medium">
                            {order.products.map((p, idx) => {
                              console.log('IncomingOrders - Product:', p); // Debug log
                              const id = extractMenuItemId(p?.productRef);
                              console.log('IncomingOrders - Extracted ID:', id); // Debug log
                              console.log('IncomingOrders - MenuItemNameCache:', menuItemNameCache); // Debug log
                              
                              // Try to get name from cache first, then fallback to product fields
                              let name = 'Item'; // Default fallback
                              if (id && menuItemNameCache && menuItemNameCache[id]) {
                                name = menuItemNameCache[id];
                                console.log('IncomingOrders - Found name in cache:', name); // Debug log
                              } else {
                                console.log('IncomingOrders - ID not found in cache. Available cache keys:', Object.keys(menuItemNameCache).slice(0, 10)); // Debug log (first 10 keys)
                                console.log('IncomingOrders - Looking for ID:', id); // Debug log
                                console.log('IncomingOrders - ProductRef structure:', p?.productRef); // Debug log
                                
                                // Try alternative fallback approaches
                                if (p?.name) {
                                  name = p.name;
                                  console.log('IncomingOrders - Using product name:', name); // Debug log
                                } else if (p?.itemName) {
                                  name = p.itemName;
                                  console.log('IncomingOrders - Using itemName:', name); // Debug log
                                } else if (p?.menuItemName) {
                                  name = p.menuItemName;
                                  console.log('IncomingOrders - Using menuItemName:', name); // Debug log
                                } else {
                                  // Last resort: use a generic name with the ID
                                  name = `Menu Item (${id || 'Unknown'})`;
                                  console.log('IncomingOrders - Using fallback name:', name); // Debug log
                                }
                              }
                              
                              const qty = p?.quantity || 1;
                              return (
                                <span key={idx}>
                                  {name} {qty ? `x${qty}` : ''}
                                  {idx < order.products.length - 1 ? ', ' : ''}
                                </span>
                              );
                            })}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">{order.itemName}</p>
                          {order.quantity ? (
                            <p className="text-gray-600">Qty: {order.quantity}</p>
                          ) : null}
                          {order.price && order.quantity ? (
                            <p className="text-gray-600">₹{order.price * order.quantity}</p>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      ₹{order.orderTotal?.toFixed(2) || '0.00'}
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontSize: '0.85em', maxWidth: '200px', wordWrap: 'break-word' }}>
                        {order.deliveryAddress || order.customerAddress || order.address || 'N/A'}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontSize: '0.8em', color: '#666' }}>
                        {(() => {
                          try {
                            // Debug: Log all possible date fields
                            console.log('Order date fields:', {
                              createdAt: order.createdAt,
                              order_Date: order.order_Date,
                              created_at: order.created_at,
                              timestamp: order.timestamp,
                              date: order.date,
                              orderDate: order.orderDate,
                              allKeys: Object.keys(order)
                            });
                            
                            let dateToFormat = null;
                            
                            // Try all possible date field names
                            const dateFields = [
                              order.createdAt,
                              order.order_Date, 
                              order.created_at,
                              order.timestamp,
                              order.date,
                              order.orderDate
                            ];
                            
                            
                            for (const dateField of dateFields) {
                              if (dateField) {
                                console.log('Processing date field:', dateField);
                                
                                // Firestore Timestamp with toDate() method
                                if (typeof dateField.toDate === 'function') {
                                  dateToFormat = dateField.toDate();
                                  break;
                                }
                                // Firestore Timestamp with _seconds/_nanoseconds (underscore format)
                                else if (dateField._seconds !== undefined) {
                                  dateToFormat = new Date(dateField._seconds * 1000 + (dateField._nanoseconds || 0) / 1000000);
                                  break;
                                }
                                // Firestore Timestamp with seconds/nanoseconds (no underscore format)
                                else if (dateField.seconds !== undefined) {
                                  dateToFormat = new Date(dateField.seconds * 1000 + (dateField.nanoseconds || 0) / 1000000);
                                  break;
                                }
                                // Regular Date object or string
                                else {
                                  const testDate = new Date(dateField);
                                  if (!isNaN(testDate.getTime())) {
                                    dateToFormat = testDate;
                                    break;
                                  }
                                }
                              }
                            }
                            
                            if (dateToFormat && !isNaN(dateToFormat.getTime())) {
                              return dateToFormat.toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              });
                            }
                            
                            return 'No Date Found';
                          } catch (error) {
                            console.error('Date parsing error:', error, 'Order:', order);
                            return 'Date Error';
                          }
                        })()}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={getOrderStatusStyle(order.orderStatus)}>
                        {order.orderStatus || 'N/A'}
                      </span>
                    </td>
                    <td style={{...styles.td, width: '200px', maxWidth: '200px', padding: '8px'}}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                        {isDeliveryPartnerAssigned(order) ? (
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#e8f5e8',
                            borderRadius: '6px',
                            border: '1px solid #c3e6c3'
                          }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.85em', color: '#2d5f2d', wordBreak: 'break-word' }}>
                              {getDeliveryPartnerInfo(order, deliveryPartners)?.display_name || 'Partner'}
                            </div>
                            {getDeliveryPartnerInfo(order)?.phone && (
                              <div style={{ fontSize: '0.75em', color: '#666' }}>
                                📞 {getDeliveryPartnerInfo(order).phone}
                              </div>
                            )}
                            <div style={{ fontSize: '0.7em', color: '#2d5f2d', marginTop: '2px' }}>
                              ✅ Assigned
                            </div>
                            {order.orderStatus !== 'dispatched' && order.orderStatus !== 'delivered' && (
                              <button
                                onClick={() => handleDispatchOrder(order.id)}
                                style={{
                                  marginTop: '8px',
                                  padding: '6px 12px',
                                  backgroundColor: '#9b59b6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.8em',
                                  cursor: 'pointer',
                                  width: '100%'
                                }}
                              >
                                Dispatch
                              </button>
                            )}
                          </div>
                        ) : order.orderStatus === 'dispatched' ? (
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#e6e2ff',
                            borderRadius: '6px',
                            border: '1px solid #d1c7ff'
                          }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9em', color: '#6b46c1' }}>
                              {getDeliveryPartnerInfo(order, deliveryPartners)?.display_name || 'Delivery Partner'}
                            </div>
                            {getDeliveryPartnerInfo(order)?.phone && (
                              <div style={{ fontSize: '0.8em', color: '#666' }}>
                                📞 {getDeliveryPartnerInfo(order).phone}
                              </div>
                            )}
                            <div style={{ fontSize: '0.75em', color: '#6b46c1', marginTop: '4px' }}>
                              🚀 Dispatched
                            </div>
                          </div>
                        ) : order.orderStatus === 'declined' ? (
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#f8d7da',
                            borderRadius: '6px',
                            border: '1px solid #f5c6cb'
                          }}>
                            <div style={{ fontSize: '0.9em', color: '#721c24', fontWeight: 'bold' }}>
                              Order Declined
                            </div>
                            <div style={{ fontSize: '0.8em', color: '#721c24', marginTop: '2px' }}>
                              No further action required
                            </div>
                          </div>
                        ) : activeDeliveryPartners.filter(partner =>
                          partner.isActive === true && partner.isOnline === true
                        ).length > 0 ? (
                          <div>
                            <div style={{
                              padding: '8px 12px',
                              backgroundColor: '#d1ecf1',
                              borderRadius: '6px',
                              border: '1px solid #bee5eb',
                              marginBottom: '8px'
                            }}>
                              <div style={{ fontSize: '0.9em', color: '#0c5460', fontWeight: 'bold' }}>
                                ⏳ Awaiting Partner Response
                              </div>
                            </div>
                            <div style={{
                              padding: '4px 8px',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '4px',
                              border: '1px solid #dee2e6',
                              marginBottom: '6px',
                              fontSize: '0.8em',
                              color: '#6c757d'
                            }}>
                              Or assign manually:
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                              <select
                                value={selectedPartners[order.id] || ''}
                                onChange={(e) => handlePartnerSelection(order.id, e.target.value)}
                                style={{
                                  flex: 1,
                                  padding: '6px 8px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  fontSize: '0.85em',
                                  backgroundColor: 'white'
                                }}
                                disabled={assigningOrders.has(order.id)}
                              >
                                <option value="">Select Partner</option>
                                {activeDeliveryPartners
                                  .filter(partner => partner.isActive === true && partner.isOnline === true)
                                  .map(partner => (
                                    <option key={partner.id} value={partner.id}>
                                      {partner.display_name || partner.name} - {partner.phone || 'No phone'}
                                    </option>
                                  ))}
                              </select>
                              <button
                                onClick={() => handleAssignPartner(order.id)}
                                disabled={!selectedPartners[order.id] || assigningOrders.has(order.id)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: assigningOrders.has(order.id) ? '#ccc' : '#f39c12',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.8em',
                                  cursor: assigningOrders.has(order.id) ? 'not-allowed' : 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {assigningOrders.has(order.id) ? 'Assigning...' : 'Assign'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#fff3cd',
                            borderRadius: '6px',
                            border: '1px solid #ffeaa7',
                            fontSize: '0.85em',
                            color: '#856404'
                          }}>
                            No Active/Online Partners Available
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {order.orderStatus === 'yetToBeAccepted' ? (
                          <>
                            <button
                              onClick={() => handleAcceptOrderWithNotification(order.id)}
                              style={{
                                ...styles.button,
                                backgroundColor: '#2ecc71',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                padding: '6px 10px',
                                minWidth: 'auto',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <FaCheck /> Accept
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'declined')}
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
                          </>
                        ) : order.orderStatus === 'preparing' ? (
                          <>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'prepared')}
                              style={{
                                ...styles.button,
                                backgroundColor: '#3498db',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                fontSize: '12px',
                                padding: '6px 12px'
                              }}
                            >
                              Mark as Prepared
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'declined')}
                              style={{
                                ...styles.button,
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                padding: '6px 10px',
                                minWidth: 'auto',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <FaTimes /> Decline
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#666' }}>
                            {order.orderStatus === 'prepared' ? 'Ready for dispatch' :
                             order.orderStatus === 'dispatched' ? 'Order dispatched' :
                             order.orderStatus === 'delivered' ? 'Order delivered' :
                             order.orderStatus === 'declined' ? 'Order declined' : 'No actions available'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details Popup */}
      <OrderDetailsPopup
        order={selectedOrder}
        isOpen={showOrderPopup}
        onClose={closeOrderPopup}
        menuItemNameCache={menuItemNameCache}
      />
    </div>
  );
};

export default IncomingOrders;
