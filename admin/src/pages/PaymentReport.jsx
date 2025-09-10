import React, { useState, useEffect } from 'react';
import { FaMoneyBillAlt, FaHandshake, FaChartLine, FaHistory, FaFileExcel, FaSave, FaFilter, FaSort, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import api from '../config/axios';

const PaymentCommissionReport = () => {
  
  const [reportData, setReportData] = useState({
    restaurantEarnings: 0,
    deliveryPartnerPayouts: 0,
    commissionRate: 15, 
    transactions: [],
    orderCount: 0,
  });

   const [editableCommissionRate, setEditableCommissionRate] = useState(15);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 const [successMessage, setSuccessMessage] = useState('');

  // Filter and sort states
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    deliveryPartner: '',
    customerName: '',
    minAmount: '',
    maxAmount: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });
  const [filteredTransactions, setFilteredTransactions] = useState([]);
// based on a new commission rate.
  const recalculateTransactions = (transactions, newRate) => {
    return transactions.map(t => {
      const commission = t.orderTotal * (newRate / 100);
      const payout = t.orderTotal - commission;
      return {
        ...t,
        commission: commission,
        payout: payout,
      };
    });
  };

  // Filter and sort functions
  const applyFiltersAndSort = (transactions) => {
    let filtered = [...transactions];

    // Date filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date.split('/').reverse().join('-')); // Convert DD/MM/YYYY to YYYY-MM-DD
        return transactionDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date.split('/').reverse().join('-'));
        return transactionDate <= toDate;
      });
    }

    // Delivery partner filter
    if (filters.deliveryPartner) {
      filtered = filtered.filter(t => 
        t.deliveryPartnerName.toLowerCase().includes(filters.deliveryPartner.toLowerCase())
      );
    }

    // Customer name filter
    if (filters.customerName) {
      filtered = filtered.filter(t => 
        t.customerName.toLowerCase().includes(filters.customerName.toLowerCase())
      );
    }

    // Amount range filter
    if (filters.minAmount) {
      filtered = filtered.filter(t => t.orderTotal >= parseFloat(filters.minAmount));
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(t => t.orderTotal <= parseFloat(filters.maxAmount));
    }

    // Sort
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle date sorting
        if (sortConfig.key === 'date') {
          aValue = new Date(a.date.split('/').reverse().join('-'));
          bValue = new Date(b.date.split('/').reverse().join('-'));
        }

        // Handle numeric sorting
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Handle string sorting
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }

        return 0;
      });
    }

    return filtered;
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      deliveryPartner: '',
      customerName: '',
      minAmount: '',
      maxAmount: ''
    });
  };

  // Update filtered transactions when data or filters change
  useEffect(() => {
    if (reportData.transactions.length > 0) {
      const filtered = applyFiltersAndSort(reportData.transactions);
      setFilteredTransactions(filtered);
    }
  }, [reportData.transactions, filters, sortConfig]);

  // Effect hook to fetch and process report data on component mount.
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching restaurant earnings from API...');
        
        // Fetch real data from the new API endpoint
        const response = await api.get('/orders/restaurant-earnings');
        console.log('Restaurant earnings API response:', response.data);
        
        if (response.data.success) {
          const { totalEarnings, totalDeliveryFees, orderCount, orders } = response.data.data;
          
          // Date formatting function (same as OrderDetailsPopup)
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

          // Transform orders into transactions format for display
          const transactions = orders.map(order => {
            const orderTotal = parseFloat(order.orderTotal) || 0; // Use orderTotal field
            const restaurantEarning = parseFloat(order.orderValue) || 0; // Use orderValue field for restaurant earnings
            const deliveryFee = parseFloat(order.deliveryFee) || 0;
            const deliveryPayout = deliveryFee; // Delivery partner gets the delivery fee
            
            return {
              id: order.orderId || order.id || 'N/A',
              date: formatDate(order.createdAt),
              orderTotal: orderTotal,
              commission: restaurantEarning,
              payout: deliveryPayout,
              deliveryFee: deliveryFee,
              deliveryPartner: order.deliveryPartnerId || 'N/A',
              deliveryPartnerName: order.deliveryBoyName || 'Not Assigned',
              customerName: order.userInfo?.display_name || order.userInfo?.name || 'Unknown Customer'
            };
          });
          
          setReportData({
            restaurantEarnings: totalEarnings,
            deliveryPartnerPayouts: totalDeliveryFees,
            commissionRate: reportData.commissionRate,
            transactions: transactions,
            orderCount: orderCount,
            totalOrderValue: totalEarnings
          });
          setEditableCommissionRate(reportData.commissionRate);
        } else {
          throw new Error(response.data.message || 'Failed to fetch restaurant earnings');
        }
      } catch (e) {
        console.error("Error fetching report data:", e);
        setError("Failed to load report data: " + (e.response?.data?.message || e.message));
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []); // Empty dependency array means this effect runs once on mount.

  // Handler for changing the editable commission rate input.
  const handleCommissionRateChange = (e) => {
    setEditableCommissionRate(parseFloat(e.target.value));
  };

  // Handler for applying the new commission rate.
  const applyNewCommissionRate = () => {
    // Clear any previous success message
    setSuccessMessage('');
    // Validate the input
    if (isNaN(editableCommissionRate) || editableCommissionRate < 0 || editableCommissionRate > 100) {
      setError("Commission rate must be a number between 0 and 100.");
      return;
    }
    setError(null); // Clear previous errors

    // Recalculate all transactions with the new rate.
    const updatedTransactions = recalculateTransactions(reportData.transactions, editableCommissionRate);

    // Recalculate total earnings and payouts based on the updated transactions.
    const totalRestaurantEarnings = updatedTransactions.reduce((sum, t) => sum + t.commission, 0);
    const totalDeliveryPartnerPayouts = updatedTransactions.reduce((sum, t) => sum + t.payout, 0);

    // Update the main report data state.
    setReportData({
      restaurantEarnings: totalRestaurantEarnings,
      deliveryPartnerPayouts: totalDeliveryPartnerPayouts,
      commissionRate: editableCommissionRate,
      transactions: updatedTransactions,
    });

    setSuccessMessage('Commission rate updated successfully!');
    // Hide the success message after a few seconds
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Function to export transaction data to an Excel file.
  const exportToExcel = () => {
    const fileName = "Payment_Commission_Report";
    const sheetName = "Transactions";

    // Prepare data for export, ensuring numerical values are formatted.
    const dataToExport = reportData.transactions.map(t => ({
      'Order ID': t.id,
      'Date': t.date,
      'Order Total (₹)': t.orderTotal.toFixed(2),
      'Restaurant Earning (₹)': t.commission.toFixed(2), // Changed to Restaurant Earning
      'Delivery Partner Payout (₹)': t.payout.toFixed(2),
      'Delivery Partner ID': t.deliveryPartner,
      'Delivery Partner Name': t.deliveryPartnerName,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate Excel file and trigger download using file-saver.
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(dataBlob, `${fileName}.xlsx`);
  };

  // Inline styles for the component.
  const styles = {
    container: {
      flexGrow: 1,
      padding: '20px 40px',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Inter, sans-serif',
      minHeight: '100vh', // Ensure it takes full viewport height
    },
    transactionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 25px',
      borderBottom: '1px solid #eee',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      paddingBottom: '20px',
      borderBottom: '1px solid #e0e0e0',
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
    },
    headerH1: {
      fontSize: '28px',
      color: '#333',
      marginBottom: '5px',
    },
    headerP: {
      fontSize: '14px',
      color: '#777',
    },
    headerIcon: {
      fontSize: '32px',
      color: '#28a745',
    },
    overviewCards: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      padding: '25px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    cardTitle: {
      fontSize: '16px',
      color: '#666',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    cardValue: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#333',
    },
    cardIcon: {
      fontSize: '24px',
      color: '#007bff',
    },
    commissionSettings: {
      backgroundColor: '#fff',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      padding: '25px',
      marginBottom: '30px',
    },
    sectionTitle: {
      fontSize: '22px',
      color: '#333',
      marginBottom: '20px',
      borderBottom: '1px solid #eee',
      paddingBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    commissionInputGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginTop: '15px',
    },
    commissionInput: {
      padding: '10px 15px',
      borderRadius: '8px',
      border: '1px solid #ccc',
      fontSize: '16px',
      width: '100px',
      textAlign: 'right',
    },
    commissionSaveButton: {
      padding: '10px 20px',
      backgroundColor: '#007bff',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.3s ease',
    },
    commissionSaveButtonHover: {
      backgroundColor: '#0056b3',
    },
    successMessage: {
      backgroundColor: '#d4edda',
      color: '#155724',
      padding: '10px 20px',
      borderRadius: '8px',
      marginTop: '15px',
      textAlign: 'center',
      fontSize: '14px',
    },
    errorMessage: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      padding: '10px 20px',
      borderRadius: '8px',
      marginTop: '15px',
      textAlign: 'center',
      fontSize: '14px',
    },
    transactionHistory: {
      backgroundColor: '#fff',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      overflowX: 'auto',
      marginBottom: '30px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px',
    },
    tableTh: {
      padding: '15px',
      textAlign: 'left',
      borderBottom: '1px solid #eee',
      backgroundColor: '#f5f7fa',
      color: '#666',
      fontWeight: '600',
      textTransform: 'uppercase',
      fontSize: '12px',
    },
    tableTd: {
      padding: '15px',
      textAlign: 'left',
      borderBottom: '1px solid #eee',
      color: '#444',
    },
    noDataFound: {
      textAlign: 'center',
      padding: '20px',
      color: '#777',
    },
    exportButtons: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '15px',
      marginBottom: '20px',
      padding: '0 25px', // Add padding to align with section title
    },
    exportButton: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.3s ease',
    },
    excelButton: {
      backgroundColor: '#217346',
      color: '#fff',
    },
    excelButtonHover: {
      backgroundColor: '#1a5937',
    },
    filtersContainer: {
      backgroundColor: '#fff',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      padding: '20px',
      marginBottom: '20px',
    },
    filtersGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '15px',
    },
    filterInput: {
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '14px',
    },
    filterButtons: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
    },
    filterButton: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
    },
    clearButton: {
      backgroundColor: '#6c757d',
      color: 'white',
    },
    compactFilters: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      padding: '15px 20px',
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #eee',
      alignItems: 'center',
    },
    compactInput: {
      padding: '6px 10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '13px',
      minWidth: '120px',
    },
    compactClearButton: {
      padding: '6px 12px',
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '13px',
      cursor: 'pointer',
    },
    filterCount: {
      fontSize: '12px',
      color: '#666',
      marginLeft: 'auto',
    },
  };

  // Render loading message if data is still being fetched.
  if (loading) return <div style={{ ...styles.container, textAlign: 'center', padding: '50px' }}>Loading report data...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <FaMoneyBillAlt style={styles.headerIcon} />
          <div>
            <h1 style={styles.headerH1}>Payment & Commission Report</h1>
            <p style={styles.headerP}>Overview of earnings and delivery partner payouts</p>
          </div>
        </div>
      </header>

      <div style={styles.overviewCards}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}><FaChartLine style={styles.cardIcon} /> Restaurant Earnings Overview</h3>
          <span style={styles.cardValue}>₹{(reportData.totalOrderValue || reportData.restaurantEarnings).toFixed(2)}</span>
          <p style={{fontSize: '14px', color: '#666', marginTop: '8px'}}>
            From {reportData.orderCount || 0} delivered orders
          </p>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}><FaHandshake style={styles.cardIcon} /> Delivery Partner Payouts</h3>
          <span style={styles.cardValue}>₹{reportData.deliveryPartnerPayouts.toFixed(2)}</span>
        </div>
      </div>


      {/* <div style={styles.commissionSettings}>
        <h2 style={styles.sectionTitle}><FaChartLine /> Commission Settings</h2>
        <div style={styles.commissionInputGroup}>
          <label htmlFor="commission-rate" style={{ fontSize: '18px', color: '#555' }}>
            Delivery Partner commission rate:
          </label>
          <input
            id="commission-rate"
            type="number"
            value={editableCommissionRate}
            onChange={handleCommissionRateChange}
            min="0"
            max="100"
            step="0.1"
            style={styles.commissionInput}
          />
          <span style={{ fontSize: '18px', color: '#555', marginRight: '10px' }}>%</span>
          <button
            onClick={applyNewCommissionRate}
            style={{ ...styles.commissionSaveButton }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = styles.commissionSaveButtonHover.backgroundColor)}
            onMouseLeave={(e) => (e.target.style.backgroundColor = styles.commissionSaveButton.backgroundColor)}
          >
            <FaSave /> Save Rate
          </button>
        </div>
      </div> */}

      <div style={styles.transactionHistory}>
        <div style={styles.transactionHeader}>
          <h2 style={styles.sectionTitle}><FaHistory /> Transaction History</h2>
          <button
            onClick={exportToExcel}
            style={{ ...styles.exportButton, ...styles.excelButton }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = styles.excelButtonHover.backgroundColor)}
            onMouseLeave={(e) => (e.target.style.backgroundColor = styles.excelButton.backgroundColor)}
          >
            <FaFileExcel /> Export to Excel
          </button>
        </div>
        
        {/* Compact Filters */}
        <div style={styles.compactFilters}>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            style={styles.compactInput}
            title="From Date"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            style={styles.compactInput}
            title="To Date"
          />
          <input
            type="text"
            placeholder="Delivery Partner"
            value={filters.deliveryPartner}
            onChange={(e) => handleFilterChange('deliveryPartner', e.target.value)}
            style={styles.compactInput}
          />
          <input
            type="text"
            placeholder="Customer Name"
            value={filters.customerName}
            onChange={(e) => handleFilterChange('customerName', e.target.value)}
            style={styles.compactInput}
          />
          <input
            type="number"
            placeholder="Min Amount (₹)"
            value={filters.minAmount}
            onChange={(e) => handleFilterChange('minAmount', e.target.value)}
            style={styles.compactInput}
          />
          <input
            type="number"
            placeholder="Max Amount (₹)"
            value={filters.maxAmount}
            onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
            style={styles.compactInput}
          />
          <button
            onClick={clearFilters}
            style={styles.compactClearButton}
            title="Clear Filters"
          >
            Clear Filters
          </button>
          <span style={styles.filterCount}>
            Showing {filteredTransactions.length} of {reportData.transactions.length}
          </span>
        </div>
        <table style={styles.table}>
          <thead>
            <tr><th style={styles.tableTh}>Order ID</th><th style={styles.tableTh}>Date</th><th style={styles.tableTh}>Order Total</th><th style={styles.tableTh}>Restaurant Earning</th><th style={styles.tableTh}>Delivery Partner Payout</th><th style={styles.tableTh}>Delivery Partner</th><th style={styles.tableTh}>Customer Name</th></tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t) => (
                <tr key={t.id}><td style={styles.tableTd}>{t.id}</td><td style={styles.tableTd}>{t.date}</td><td style={styles.tableTd}>₹{t.orderTotal.toFixed(2)}</td><td style={styles.tableTd}>₹{t.commission.toFixed(2)}</td><td style={styles.tableTd}>₹{t.payout.toFixed(2)}</td><td style={styles.tableTd}>{t.deliveryPartnerName}</td><td style={styles.tableTd}>{t.customerName}</td></tr>
              ))
            ) : (
              <tr><td colSpan="7" style={styles.noDataFound}>
                {reportData.transactions.length === 0 ? 'No transaction data available.' : 'No transactions match the current filters.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentCommissionReport;
