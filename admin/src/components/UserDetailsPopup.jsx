import React from 'react';
import { FaTimes, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaShoppingBag } from 'react-icons/fa';

const UserDetailsPopup = ({ user, isOpen, onClose, userOrders = [] }) => {
  if (!isOpen || !user) return null;

  const formatDate = (dateField) => {
    try {
      if (dateField) {
        if (typeof dateField.toDate === 'function') {
          return dateField.toDate().toLocaleDateString('en-IN');
        }
        if (dateField._seconds !== undefined) {
          return new Date(dateField._seconds * 1000 + (dateField._nanoseconds || 0) / 1000000).toLocaleDateString('en-IN');
        }
        if (dateField.seconds !== undefined) {
          return new Date(dateField.seconds * 1000 + (dateField.nanoseconds || 0) / 1000000).toLocaleDateString('en-IN');
        }
        return new Date(dateField).toLocaleDateString('en-IN');
      }
      return 'N/A';
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const totalOrderValue = userOrders.reduce((sum, order) => sum + (order.orderTotal || 0), 0);

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
        maxWidth: '500px',
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
            Customer Details
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

        {/* User Avatar & Name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#3498db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '16px',
            fontSize: '24px',
            color: 'white'
          }}>
            {user.profileImage ? (
              <img 
                src={user.profileImage} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <FaUser />
            )}
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '20px' }}>
              {user.display_name || user.name || user.displayName || 'Unknown User'}
            </h3>
            <p style={{ margin: '4px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
              Customer ID: {user.id || 'N/A'}
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#2c3e50', marginBottom: '12px' }}>Contact Information</h4>
          
          <div style={{
            display: 'grid',
            gap: '12px'
          }}>
            <div style={{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FaPhone style={{ color: '#3498db' }} />
              <div>
                <strong style={{ color: '#495057' }}>Phone:</strong>
                <div style={{ color: '#2c3e50' }}>
                  {user.phone || user.phone_number || user.phoneNumber || 'N/A'}
                </div>
              </div>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FaEnvelope style={{ color: '#e74c3c' }} />
              <div>
                <strong style={{ color: '#495057' }}>Email:</strong>
                <div style={{ color: '#2c3e50', wordBreak: 'break-word' }}>
                  {user.email || 'N/A'}
                </div>
              </div>
            </div>

            {user.address && (
              <div style={{
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <FaMapMarkerAlt style={{ color: '#27ae60', marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#495057' }}>Address:</strong>
                  <div style={{ color: '#2c3e50', lineHeight: '1.4' }}>
                    {(() => {
                      const addr = user.address;
                      if (!addr) return 'N/A';
                      if (typeof addr === 'string') return addr;
                      if (typeof addr === 'object') {
                        const parts = [
                          addr.street,
                          addr.area,
                          addr.landmark,
                          addr.city,
                          addr.state,
                          addr.pincode
                        ].filter(Boolean);
                        return parts.length > 0 ? parts.join(', ') : 'N/A';
                      }
                      return 'N/A';
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#2c3e50', marginBottom: '12px' }}>Account Information</h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <div style={{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                <FaCalendarAlt style={{ color: '#f39c12' }} />
                <strong style={{ color: '#495057', fontSize: '12px' }}>Joined:</strong>
              </div>
              <div style={{ color: '#2c3e50', fontSize: '14px' }}>
                {formatDate(user.createdAt) || formatDate(user.created_at) || 'N/A'}
              </div>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                <FaShoppingBag style={{ color: '#9b59b6' }} />
                <strong style={{ color: '#495057', fontSize: '12px' }}>Total Orders:</strong>
              </div>
              <div style={{ color: '#2c3e50', fontSize: '14px', fontWeight: 'bold' }}>
                {userOrders.length}
              </div>
            </div>
          </div>
        </div>

        {/* Order Statistics */}
        {userOrders.length > 0 && (
          <div style={{
            padding: '16px',
            backgroundColor: '#e8f5e8',
            borderRadius: '8px',
            border: '2px solid #c3e6c3'
          }}>
            <h4 style={{ color: '#2d5f2d', margin: '0 0 12px 0' }}>Order Statistics</h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#2d5f2d' }}>Total Spent:</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d5f2d' }}>
                  ₹{totalOrderValue.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#2d5f2d' }}>Average Order:</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d5f2d' }}>
                  ₹{(totalOrderValue / userOrders.length).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetailsPopup;
