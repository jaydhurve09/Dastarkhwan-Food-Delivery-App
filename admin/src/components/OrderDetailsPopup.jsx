import React from 'react';
import { FaTimes, FaCalendarAlt, FaMapMarkerAlt, FaRupeeSign, FaUtensils } from 'react-icons/fa';

const OrderDetailsPopup = ({ order, isOpen, onClose, menuItemNameCache }) => {
  if (!isOpen || !order) return null;

  const formatDate = (dateField) => {
    try {
      if (dateField) {
        if (typeof dateField.toDate === 'function') {
          return dateField.toDate().toLocaleString('en-IN');
        }
        if (dateField._seconds !== undefined) {
          return new Date(dateField._seconds * 1000 + (dateField._nanoseconds || 0) / 1000000).toLocaleString('en-IN');
        }
        if (dateField.seconds !== undefined) {
          return new Date(dateField.seconds * 1000 + (dateField.nanoseconds || 0) / 1000000).toLocaleString('en-IN');
        }
        return new Date(dateField).toLocaleString('en-IN');
      }
      return 'N/A';
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const extractMenuItemId = (ref) => {
    if (!ref) return null;
    
    // Handle string path like "/menuItems/FjyqKzgkLlhQuewZyEV"
    if (typeof ref === 'string') {
      if (ref.startsWith('/menuItems/')) {
        return ref.replace('/menuItems/', '');
      }
      return ref;
    }
    
    // Handle object with id property
    if (ref.id) return ref.id;
    
    // Handle Firestore DocumentReference
    if (ref._path && ref._path.segments) {
      return ref._path.segments[ref._path.segments.length - 1];
    }
    
    // Handle other reference formats
    if (ref.path) {
      const pathParts = ref.path.split('/');
      return pathParts[pathParts.length - 1];
    }
    
    return null;
  };

  const getOrderStatusColor = (status) => {
    const statusColors = {
      'yetToBeAccepted': '#f39c12',
      'preparing': '#3498db',
      'prepared': '#9b59b6',
      'dispatched': '#e67e22',
      'delivered': '#27ae60',
      'declined': '#e74c3c'
    };
    return statusColors[status] || '#95a5a6';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #f1f2f6',
          paddingBottom: '15px'
        }}>
          <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '24px' }}>
            Order Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#7f8c8d',
              padding: '5px'
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Order Info */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            marginBottom: '15px'
          }}>
            <div style={{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <strong style={{ color: '#495057' }}>Order ID:</strong>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>
                #{order.orderId || order.id}
              </div>
            </div>
            <div style={{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <strong style={{ color: '#495057' }}>Status:</strong>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: getOrderStatusColor(order.orderStatus),
                textTransform: 'capitalize'
              }}>
                {order.orderStatus || 'N/A'}
              </div>
            </div>
          </div>

          <div style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            marginBottom: '15px'
          }}>
            <strong style={{ color: '#495057', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FaCalendarAlt /> Order Date:
            </strong>
            <div style={{ fontSize: '14px', color: '#2c3e50' }}>
              {formatDate(order.createdAt) || formatDate(order.order_Date)}
            </div>
          </div>

          <div style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <strong style={{ color: '#495057', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FaMapMarkerAlt /> Delivery Address:
            </strong>
            <div style={{ fontSize: '14px', color: '#2c3e50', lineHeight: '1.4' }}>
              {order.deliveryAddress || order.customerAddress || order.address || 'N/A'}
            </div>
          </div>
        </div>

        {/* Items */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{
            color: '#2c3e50',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaUtensils /> Order Items
          </h3>
          <div style={{
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {Array.isArray(order.products) && order.products.length > 0 ? (
              order.products.map((product, index) => {
                console.log('Product data:', product); // Debug log
                const id = extractMenuItemId(product?.productRef);
                console.log('Extracted ID:', id); // Debug log
                console.log('MenuItemNameCache:', menuItemNameCache); // Debug log
                
                // Try to get name and price from cache first, then fallback to product fields
                let name = 'Item'; // Default fallback
                let price = 0; // Default price
                
                if (id && menuItemNameCache && menuItemNameCache[id]) {
                  name = menuItemNameCache[id];
                }
                
                // Get price from menuItemNameCache or product
                if (id && menuItemNameCache && menuItemNameCache[id + '_price']) {
                  price = menuItemNameCache[id + '_price'];
                } else if (product?.price) {
                  price = product.price;
                }
                
                // Fallback name sources
                if (name === 'Item') {
                  if (product?.name) {
                    name = product.name;
                  } else if (product?.itemName) {
                    name = product.itemName;
                  } else if (product?.menuItemName) {
                    name = product.menuItemName;
                  }
                }
                
                const qty = product?.quantity || 1;

                return (
                  <div key={index} style={{
                    padding: '12px 16px',
                    borderBottom: index < order.products.length - 1 ? '1px solid #e9ecef' : 'none',
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{name}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>Quantity: {qty}</div>
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#27ae60' }}>
                        ₹{(price * qty).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', color: '#6c757d' }}>
                No items found
              </div>
            )}
          </div>
        </div>

        {/* Total */}
        <div style={{
          padding: '16px',
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          border: '2px solid #c3e6c3'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <strong style={{
              color: '#2d5f2d',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <FaRupeeSign /> Total Amount:
            </strong>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#2d5f2d'
            }}>
              ₹{order.orderTotal?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPopup;
