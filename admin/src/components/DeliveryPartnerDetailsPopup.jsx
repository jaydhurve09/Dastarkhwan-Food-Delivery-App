import React from 'react';
import { FaTimes, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaTruck, FaStar, FaMotorcycle } from 'react-icons/fa';

const DeliveryPartnerDetailsPopup = ({ partner, isOpen, onClose, partnerOrders = [] }) => {
  if (!isOpen || !partner) return null;

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

  const getStatusColor = (status) => {
    const statusColors = {
      'active': '#27ae60',
      'online': '#27ae60',
      'offline': '#e74c3c',
      'busy': '#f39c12',
      'available': '#27ae60'
    };
    return statusColors[status?.toLowerCase()] || '#95a5a6';
  };

  const completedOrders = partnerOrders.filter(order => order.orderStatus === 'delivered').length;
  const totalEarnings = partnerOrders
    .filter(order => order.orderStatus === 'delivered')
    .reduce((sum, order) => sum + (order.deliveryFee || 0), 0);

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
            Delivery Partner Details
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

        {/* Partner Avatar & Name */}
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
            backgroundColor: '#e67e22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '16px',
            fontSize: '24px',
            color: 'white'
          }}>
            {partner.profileImage || partner.avatar ? (
              <img 
                src={partner.profileImage || partner.avatar} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <FaMotorcycle />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '20px' }}>
              {partner.display_name || partner.name || partner.displayName || 'Unknown Partner'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
                ID: {partner.id || 'N/A'}
              </p>
              <span style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: getStatusColor(partner.status),
                color: 'white'
              }}>
                {partner.status || partner.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
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
                  {partner.phone || partner.phoneNumber || 'N/A'}
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
                  {partner.email || 'N/A'}
                </div>
              </div>
            </div>

            {partner.vehicleInfo && (
              <div style={{
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <FaTruck style={{ color: '#9b59b6' }} />
                <div>
                  <strong style={{ color: '#495057' }}>Vehicle:</strong>
                  <div style={{ color: '#2c3e50' }}>
                    {partner.vehicleInfo.type || 'N/A'} - {partner.vehicleInfo.number || 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#2c3e50', marginBottom: '12px' }}>Performance</h4>
          
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
                <FaStar style={{ color: '#f39c12' }} />
                <strong style={{ color: '#495057', fontSize: '12px' }}>Rating:</strong>
              </div>
              <div style={{ color: '#2c3e50', fontSize: '16px', fontWeight: 'bold' }}>
                {partner.rating ? `${partner.rating.toFixed(1)}/5` : 'N/A'}
              </div>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                <FaTruck style={{ color: '#3498db' }} />
                <strong style={{ color: '#495057', fontSize: '12px' }}>Completed:</strong>
              </div>
              <div style={{ color: '#2c3e50', fontSize: '16px', fontWeight: 'bold' }}>
                {completedOrders} orders
              </div>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                <FaCalendarAlt style={{ color: '#27ae60' }} />
                <strong style={{ color: '#495057', fontSize: '12px' }}>Joined:</strong>
              </div>
              <div style={{ color: '#2c3e50', fontSize: '14px' }}>
                {formatDate(partner.createdAt) || formatDate(partner.created_at) || 'N/A'}
              </div>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                <FaMapMarkerAlt style={{ color: '#e74c3c' }} />
                <strong style={{ color: '#495057', fontSize: '12px' }}>Location:</strong>
              </div>
              <div style={{ color: '#2c3e50', fontSize: '14px' }}>
                {partner.currentLocation || partner.location || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Summary */}
        {partnerOrders.length > 0 && (
          <div style={{
            padding: '16px',
            backgroundColor: '#e8f5e8',
            borderRadius: '8px',
            border: '2px solid #c3e6c3'
          }}>
            <h4 style={{ color: '#2d5f2d', margin: '0 0 12px 0' }}>Earnings Summary</h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#2d5f2d' }}>Total Earnings:</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d5f2d' }}>
                  ₹{totalEarnings.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#2d5f2d' }}>Avg per Order:</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d5f2d' }}>
                  ₹{completedOrders > 0 ? (totalEarnings / completedOrders).toFixed(2) : '0.00'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryPartnerDetailsPopup;
