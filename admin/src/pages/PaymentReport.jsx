import React, { useState, useEffect } from 'react';
import { FaMoneyBillAlt, FaHandshake, FaChartLine, FaHistory, FaFileExcel, FaSave } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const PaymentCommissionReport = () => {
  
  const [reportData, setReportData] = useState({
    restaurantEarnings: 0,
    deliveryPartnerPayouts: 0,
    commissionRate: 45, 
    transactions: [],
  });

   const [editableCommissionRate, setEditableCommissionRate] = useState(15);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 const [successMessage, setSuccessMessage] = useState('');
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

  // Effect hook to fetch and process report data on component mount.
  useEffect(() => {
    const fetchReportData = () => {
      setLoading(true);
      setError(null);
      try {
        // Mock transaction data. In a real application, this would come from an API.
        const allMockTransactions = [
          { id: 'ORD001', date: '2024-07-15', orderTotal: 500, deliveryPartner: 'DP-001', deliveryPartnerName: 'Rahul Sharma' },
          { id: 'ORD005', date: '2024-07-13', orderTotal: 600, deliveryPartner: 'DP-002', deliveryPartnerName: 'Priya Singh' },
          { id: 'ORD009', date: '2024-07-11', orderTotal: 550, deliveryPartner: 'DP-001', deliveryPartnerName: 'Rahul Sharma' },
          { id: 'ORD013', date: '2024-07-09', orderTotal: 650, deliveryPartner: 'DP-003', deliveryPartnerName: 'Amit Kumar' },
          { id: 'ORD017', date: '2024-07-08', orderTotal: 700, deliveryPartner: 'DP-002', deliveryPartnerName: 'Priya Singh' },
          { id: 'ORD021', date: '2024-07-07', orderTotal: 450, deliveryPartner: 'DP-001', deliveryPartnerName: 'Rahul Sharma' },
          { id: 'ORD025', date: '2024-07-06', orderTotal: 800, deliveryPartner: 'DP-003', deliveryPartnerName: 'Amit Kumar' },
          { id: 'ORD029', date: '2024-07-05', orderTotal: 520, deliveryPartner: 'DP-002', deliveryPartnerName: 'Priya Singh' },
        ];

        // Recalculate commissions and payouts based on the initial commission rate.
        const transactionsWithCalculations = recalculateTransactions(allMockTransactions, reportData.commissionRate);

        // Calculate total restaurant earnings (sum of commissions) and delivery partner payouts.
        const totalRestaurantEarnings = transactionsWithCalculations.reduce((sum, t) => sum + t.commission, 0);
        const totalDeliveryPartnerPayouts = transactionsWithCalculations.reduce((sum, t) => sum + t.payout, 0);

        setReportData({
          restaurantEarnings: totalRestaurantEarnings,
          deliveryPartnerPayouts: totalDeliveryPartnerPayouts,
          commissionRate: reportData.commissionRate,
          transactions: transactionsWithCalculations,
        });
        setEditableCommissionRate(reportData.commissionRate); // Initialize editable rate with current rate
      } catch (e) {
        console.error("Error fetching report data:", e);
        setError("Failed to load report data.");
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
          <span style={styles.cardValue}>₹{reportData.restaurantEarnings.toFixed(2)}</span>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}><FaHandshake style={styles.cardIcon} /> Delivery Partner Payouts</h3>
          <span style={styles.cardValue}>₹{reportData.deliveryPartnerPayouts.toFixed(2)}</span>
        </div>
      </div>

      <div style={styles.commissionSettings}>
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
        {successMessage && <div style={styles.successMessage}>{successMessage}</div>}
        {error && <div style={styles.errorMessage}>{error}</div>}
      </div>

      <div style={styles.transactionHistory}>
        <h2 style={styles.sectionTitle}><FaHistory /> Transaction History</h2>
        <div style={styles.exportButtons}>
          <button
            onClick={exportToExcel}
            style={{ ...styles.exportButton, ...styles.excelButton }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = styles.excelButtonHover.backgroundColor)}
            onMouseLeave={(e) => (e.target.style.backgroundColor = styles.excelButton.backgroundColor)}
          >
            <FaFileExcel /> Export to Excel
          </button>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableTh}>Order ID</th>
              <th style={styles.tableTh}>Date</th>
              <th style={styles.tableTh}>Order Total</th>
              <th style={styles.tableTh}>Restaurant Earning</th> {/* Updated header */}
              <th style={styles.tableTh}>Delivery Partner Payout</th> {/* Updated header */}
              <th style={styles.tableTh}>Delivery Partner Name</th>
            </tr>
          </thead>
          <tbody>
            {reportData.transactions.length > 0 ? (
              reportData.transactions.map((t) => (
                <tr key={t.id}>
                  <td style={styles.tableTd}>{t.id}</td>
                  <td style={styles.tableTd}>{t.date}</td>
                  <td style={styles.tableTd}>₹{t.orderTotal.toFixed(2)}</td>
                  <td style={styles.tableTd}>₹{t.commission.toFixed(2)}</td> {/* Display commission */}
                  <td style={styles.tableTd}>₹{t.payout.toFixed(2)}</td> {/* Display payout */}
                  <td style={styles.tableTd}>{t.deliveryPartnerName}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={styles.noDataFound}>No transaction data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentCommissionReport;
