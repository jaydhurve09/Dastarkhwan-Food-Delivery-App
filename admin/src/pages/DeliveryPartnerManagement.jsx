import React, { useState, useMemo } from "react";
import { useContext } from "react";
import { AdminContext } from "../contexts/adminContext";
import {updateDeliveryPartner, blockDeliveryPartner , resetPassword , approveDeliveryPartner} from "../services/deliveryPatnerService";


const initialPendingApprovals = [
  { id: 1, name: "Rahul Singh", mobile: "9876543210", vehicle: "Honda Goldwing", vehicleNo: "DL5SAF0001", documents: ["Aadhar.pdf", "DL.pdf"], appliedDate: "2025-07-20" },
  { id: 2, name: "Priya Sharma", mobile: "9123456780", vehicle: "TVS Apache", vehicleNo: "MH12BC5678", documents: ["Aadhar.pdf"], appliedDate: "2025-07-20" },
  { id: 3, name: "Arjun Verma", mobile: "9988776655", vehicle: "Bajaj Pulsar", vehicleNo: "RJ14WV5555", documents: ["Passport.pdf", "DL.pdf"], appliedDate: "2025-07-21" },
];

const initialPartners = [
  {
    id: 101, name: "Amit Patel", mobile: "9000000001", vehicle: "Kawasaki Zx10r", vehicleNo: "MH49A9999", online: true,
    deliveries: 150, rating: 4.7, earnings: 45000, blocked: false,
    documents: ["Aadhar.pdf", "DL.pdf"],
    lastOrders: [
      { id: "ORD101", amount: 320, date: "2025-07-19" }, { id: "ORD112", amount: 210, date: "2025-07-19" },
      { id: "ORD115", amount: 435, date: "2025-07-20" }, { id: "ORD117", amount: 280, date: "2025-07-20" },
      { id: "ORD120", amount: 190, date: "2025-07-21" },
    ],
  },
  {
    id: 102, name: "Sunita Rao", mobile: "9000000002", vehicle: "TVS Jupiter", vehicleNo: "MH12BC5678", online: false,
    deliveries: 120, rating: 4.5, earnings: 38000, blocked: false,
    documents: ["Aadhar.pdf"],
    lastOrders: [
      { id: "ORD121", amount: 180, date: "2025-07-19" }, { id: "ORD122", amount: 200, date: "2025-07-20" },
      { id: "ORD125", amount: 240, date: "2025-07-21" }, { id: "ORD127", amount: 310, date: "2025-07-21" },
      { id: "ORD130", amount: 150, date: "2025-07-22" },
    ],
  },
  {
    id: 103, name: "Rahul Singh", mobile: "9876543210", vehicle: "Honda Activa", vehicleNo: "DL5SAF1345", online: false,
    deliveries: 57, rating: 4.2, earnings: 21500, blocked: true,
    documents: ["Aadhar.pdf", "DL.pdf"],
    lastOrders: [
      { id: "ORD139", amount: 290, date: "2025-07-20" }, { id: "ORD140", amount: 170, date: "2025-07-20" },
      { id: "ORD141", amount: 310, date: "2025-07-20" }, { id: "ORD142", amount: 150, date: "2025-07-20" },
      { id: "ORD143", amount: 110, date: "2025-07-21" },
    ],
  },
  {
    id: 104, name: "Manish Kumar", mobile: "9000212300", vehicle: "Suzuki Access", vehicleNo: "RJ14WV5555", online: true,
    deliveries: 210, rating: 5, earnings: 51000, blocked: false,
    documents: ["Aadhar.pdf", "DL.pdf"],
    lastOrders: [
      { id: "ORD105", amount: 350, date: "2025-07-19" }, { id: "ORD111", amount: 420, date: "2025-07-20" },
      { id: "ORD113", amount: 250, date: "2025-07-20" }, { id: "ORD119", amount: 310, date: "2025-07-21" },
      { id: "ORD126", amount: 150, date: "2025-07-21" },
    ],
  },
  {
    id: 105, name: "Priya Verma", mobile: "9000899000", vehicle: "Bajaj Pulsar", vehicleNo: "WB24AC9999", online: false,
    deliveries: 88, rating: 4, earnings: 17560, blocked: false,
    documents: ["Aadhar.pdf", "DL.pdf"],
    lastOrders: [
      { id: "ORD151", amount: 190, date: "2025-07-20" }, { id: "ORD152", amount: 245, date: "2025-07-20" },
      { id: "ORD153", amount: 170, date: "2025-07-21" }, { id: "ORD154", amount: 210, date: "2025-07-21" },
      { id: "ORD155", amount: 315, date: "2025-07-22" },
    ],
  },
];

// Styles object: professional and spaced
const styles = {
  container: { padding: 30, background: "#f7f8fa", minHeight: "100vh", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
  heading: { fontSize: 26, fontWeight: 700, marginBottom: 24, color: "#222" },
  infoCardRow: { display: "flex", gap: 24, marginBottom: 36 },
  infoCard: {
    backgroundColor: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 8px #ccc",
    minWidth: 180, display: "flex", justifyContent: "space-between", alignItems: "center"
  },
  badge: {
    background: "#e84118", color: "#fff",
    borderRadius: "50%", width: 30, height: 30,
    fontWeight: "bold", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 16,
    userSelect: "none"
  },
  btnShow: {
    marginLeft: 12, cursor: "pointer",
    backgroundColor: "#2563eb", color: "#fff",
    border: "none", borderRadius: 8,
    padding: "6px 18px", fontWeight: 600,
    fontSize: 14, transition: "background-color 0.3s"
  },
  tableBlock: {
    backgroundColor: "#fff", padding: 24,
    borderRadius: 12, boxShadow: "0 2px 12px #ccc",
    marginBottom: 48, overflowX: "auto"
  },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: "0 10px" },
  th: {
    background: "#f4f6fa", fontWeight: 700, fontSize: 15,
    padding: "16px", border: "none", textAlign: "center", color: "#333"
  },
  td: {
    background: "#fff", fontSize: 15, padding: "18px 12px",
    borderRadius: 9, border: "none", verticalAlign: "middle",
    textAlign: "center", color: "#222"
  },
  online: { color: "#198754", fontWeight: 600, userSelect: "none" },
  offline: { color: "#6c757d", fontWeight: 600, fontStyle: "italic", userSelect: "none" },
  actionRow: {
    display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 8
  },
  btn: {
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    padding: "8px 16px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    margin: "4px",
    minWidth: "100px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1.5,
    ":hover": {
      opacity: 0.9,
      transform: "translateY(-1px)",
      boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
    },
    ":active": {
      transform: "translateY(0)",
      boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
    }
  },
  btnView: { 
    backgroundColor: "#10b981",
    ":hover": {
      backgroundColor: "#0d9f6e"
    }
  },
  btnEdit: { 
    backgroundColor: "#0ea5e9",
    ":hover": {
      backgroundColor: "#0c8ecb"
    }
  },
  btnBlock: { 
    backgroundColor: "#ef4444",
    ":hover": {
      backgroundColor: "#dc2626"
    }
  },
  btnUnblock: { 
    backgroundColor: "#22c55e",
    ":hover": {
      backgroundColor: "#16a34a"
    }
  },
  btnReset: { 
    backgroundColor: "#8b5cf6",
    ":hover": {
      backgroundColor: "#7c3aed"
    }
  },

 

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 1000 },
  modal: {
    background: "#fff", borderRadius: 16, padding: 36,
    maxWidth: 480, width: "90%", maxHeight: "75vh",
    overflowY: "auto", boxShadow: "0 12px 36px rgba(0,0,0,0.25)",
    position: "fixed", left: "50%", top: "50%",
    transform: "translate(-50%, -50%)", zIndex: 1010,
    animation: "fadeIn 0.3s ease"
  },
  modalHeader: { marginBottom: 20, fontWeight: 700, fontSize: 24, color: "#121212" },
  closeBtn: {
    position: "absolute", top: 16, right: 20,
    background: "none", border: "none", fontSize: 32,
    cursor: "pointer", color: "#333",
  },
  label: { fontWeight: 700, marginTop: 15 },
  docList: { fontSize: 15, color: "#2563eb", margin: "5px 0 15px 18px" },
  docItem: { cursor: "pointer", marginBottom: 6 },
  lastOrdersContainer: { marginTop: 20 },
  lastOrderItem: {
    backgroundColor: "#f3f4f8", borderRadius: 8,
    padding: 10, marginBottom: 8, fontSize: 14, lineHeight: 1.4
  },
  inputField: {
    width: "100%", 
    padding: 12, 
    margin: "8px 0 16px", 
    borderRadius: 6, 
    border: "1.5px solid #ccc",
    fontSize: 15
  },
  passwordMatchError: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: -10,
    marginBottom: 10
  }
};

export default function DeliveryPartnerManagement() {
  const {fetchOrders,fetchDeliveryPartners ,deliveryPartners ,orders} = useContext(AdminContext);
  const [pendingApprovals, setPendingApprovals] = useState(deliveryPartners);
  const [partners, setPartners] = useState(deliveryPartners);
  const [showPending, setShowPending] = useState(false);
  const [pendingDetail, setPendingDetail] = useState(null);

  const [partnerDetail, setPartnerDetail] = useState(null);
  const [editPartner, setEditPartner] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", mobile: "", vehicle: "", vehicleNo: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [resetPasswordPartner, setResetPasswordPartner] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");

  // Filter to search delivery partners by name
  const filteredPartners = useMemo(() => {
    let s = searchTerm.trim().toLowerCase();
    if (!s) return partners;
    return partners.filter(p => p.name.toLowerCase().includes(s));
  }, [searchTerm, partners]);



  // Approve pending partner & move to partners list
  const approvePending = async (id) => {

    await approveDeliveryPartner(id);
    await fetchDeliveryPartners();
    setPendingDetail(null);
  }

  // Reject pending partner & remove
  const rejectPending = async (id) => {
    await approveDeliveryPartner(id);
    await fetchDeliveryPartners();
    setPendingDetail(null);
  }

  // Block/Unblock toggle
const toggleBlockPartner = async (id) => {

    await blockDeliveryPartner(id);
    await fetchDeliveryPartners();
    setPartnerDetail(null);
  }

  // Reset password action
  function handleResetPasswordClick(partner) {
    setResetPasswordPartner(partner);
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setPasswordError("");
  }

  // Handle password form changes
  function handlePasswordChange(e) {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (passwordError) {
      setPasswordError("");
    }
  }

  // Submit password reset
  const submitPasswordReset = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    
    // In a real app, you would call an API here to update the password
   await resetPassword(resetPasswordPartner.id, passwordForm.newPassword); 
    await fetchDeliveryPartners();
    alert("Password reset successfully");
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setPasswordError("");
  }

  // Open edit modal and populate form
  function openEditModal(partner) {
    setEditPartner(partner);
    setEditForm({
      name: partner.name,
      phone: partner.phone, // <-- use phone, not mobile
      vehicle: partner.vehicle.name,
      vehicleNo: partner.vehicle.number
    });
  }

  // Close edit modal
  function closeEditModal() {
    setEditPartner(null);
  }

  // Handle input changes in edit form
  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
  }

  // Save edited info
  const saveEditChanges = async (id) => {
   await updateDeliveryPartner(id , editForm);
   await fetchDeliveryPartners();
    closeEditModal();
    setPartnerDetail(null);
  }

  // Calculate commission = 15% of order amount
  const commission = (amount) => (amount * 0.15).toFixed(2);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Delivery Partner Management</h1>

      {/* Info cards */}
      <div style={styles.infoCardRow}>
        <div style={styles.infoCard}>
          <div>Pending Approvals <span style={styles.badge}>{deliveryPartners.filter(p => !p.isVerified).length}</span></div>
          <button style={styles.btnShow} onClick={() => setShowPending(!showPending)}>{showPending ? "Hide" : "Show"}</button>
        </div>
        <div style={styles.infoCard}>
          <div>Total Active Partners <br /> <strong style={{ fontSize: 22 }}>{deliveryPartners.filter(p => p.isOnline).length}</strong></div>
        </div>
      </div>

      {/* Pending Approvals List */}
      {showPending && (
        <div style={styles.tableBlock}>
          <h3>Pending Approvals</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Name", "Mobile", "Vehicle Info", "Applied Date", "Actions"].map((t) => (
                  <th key={t} style={styles.th}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deliveryPartners.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 20 }}>No Pending Approvals.</td></tr>
              ) : 
              deliveryPartners.filter(p => !p.isVerified).map(p => (
                <tr key={p.id}>
                  <td style={styles.td}>{p.name}</td>
                  <td style={styles.td}>{p.phone}</td>
                  <td style={styles.td}>{p.vehicle?.name || 'N/A'} | {p.vehicle?.number || 'N/A'}</td>
                  <td style={styles.td}>{p.appliedDate}</td>
                  <td style={{ ...styles.td, color: "#2563eb" }}>
                    <button style={{...styles.btn, ...styles.btnView}} onClick={() => setPendingDetail(p)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Search */}
      <input
        style={{
          width: "100%",
          padding: "12px 16px",
          marginBottom: "24px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          fontSize: "16px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
        }}
        placeholder="Search delivery partner by name..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        aria-label="Search delivery partner"
      />

      {/* Delivery Partners Table */}
      <div style={styles.tableBlock}>
        <h3>All Delivery Partners</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Name", "Mobile", "Vehicle Info", "Online/Offline", "Total Deliveries", "Ratings", "Actions"].map((t) => (
                <th key={t} style={styles.th}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deliveryPartners.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 20 }}>No delivery partners found.</td>
              </tr>
            ) : deliveryPartners.map(p => (
              <tr key={p.id}>
                <td style={styles.td}>{p.name || 'N/A'}</td>
                <td style={styles.td}>{p.phone || p.mobile || 'N/A'}</td>
                <td style={styles.td}>
                  {p.vehicle ? 
                    (typeof p.vehicle === 'string' ? 
                      `${p.vehicle} | ${p.vehicleNo || p.vehicleNumber || 'N/A'}` :
                      `${p.vehicle?.name || p.vehicle?.type || 'N/A'} | ${p.vehicle?.number || p.vehicleNo || p.vehicleNumber || 'N/A'}`
                    ) : 
                    'N/A'
                  }
                </td>
                <td style={styles.td}>
                  {p.online || p.isOnline ? <span style={styles.online}>● Online</span> : <span style={styles.offline}>● Offline</span>}
                </td>
                <td style={styles.td}>{p.totalDeliveries || p.deliveries || 0}</td>
                <td style={styles.td}>{p.rating || 0} ★</td>
                <td style={{ ...styles.td, minWidth: 250 }}>
                  <div style={styles.actionRow}>
                    <button style={{...styles.btn, ...styles.btnView}} onClick={() => setPartnerDetail(p)}>View Profile</button>
                    <button style={{...styles.btn, ...styles.btnEdit}} onClick={() => openEditModal(p)}>Edit Info</button>
                    <button style={{...styles.btn, ...p.isActive ? styles.btnBlock : styles.btnUnblock}} onClick={() => toggleBlockPartner(p.id)}>
                      {p.isActive? "Block" : "Unblock"}
                    </button>
                    <button style={{...styles.btn, ...styles.btnReset}} onClick={() => handleResetPasswordClick(p)}>Reset Password</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pending Detail Modal */}
      {pendingDetail && (
        <>
          <div style={styles.modalOverlay} onClick={() => setPendingDetail(null)} />
          <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="pendingDetailTitle">
            <button style={styles.closeBtn} onClick={() => setPendingDetail(null)} aria-label="Close modal">&times;</button>
            <h2 id="pendingDetailTitle" style={styles.modalHeader}>{pendingDetail.name}</h2>
            <p><b>Mobile:</b> {pendingDetail.phone}</p>
            <p><b>Vehicle:</b> {pendingDetail.vehicle.name} | {pendingDetail.vehicle.number}</p>
            <p><b>Applied Date:</b> {pendingDetail.appliedDate}</p>
            <div>
              <b>Documents:</b>
              <ul style={styles.docList}>
                {pendingDetail.documents.map((doc, i) => (
                  <li key={i} style={styles.docItem}>
                    <span>{doc.type || doc.documentNumber || "Document"}</span>
                    {doc.imageUrl && (
                      <>
                        {" "}
                        <a
                          href={doc.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2563eb", marginLeft: 8, textDecoration: "underline" }}
                        >
                          View
                        </a>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
              <button style={{...styles.btn, ...styles.btnBlock, padding: "8px 16px"}} onClick={() => { rejectPending(pendingDetail.id); }}>Reject</button>
              <button style={{...styles.btn, ...styles.btnView, padding: "8px 16px"}} onClick={() => { approvePending(pendingDetail.id); }}>Approve</button>
            </div>
          </div>
        </>
      )}

      {/* Profile Modal */}
      {partnerDetail && (
        console.log(partnerDetail, "partnerDetail"),
        <>
          <div style={styles.modalOverlay} onClick={() => setPartnerDetail(null)} />
          <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="partnerDetailTitle">
            <button style={styles.closeBtn} onClick={() => setPartnerDetail(null)} aria-label="Close modal">&times;</button>
            <h2 id="partnerDetailTitle" style={styles.modalHeader}>{partnerDetail.name}</h2>
            <p><b>Mobile:</b> {partnerDetail.phone}</p>
            <p><b>Vehicle Info:</b> {partnerDetail.vehicle.number} | {partnerDetail.vehicle.name}</p>
            <p><b>Status:</b> {partnerDetail.online ? <span style={styles.online}>Online</span> : <span style={styles.offline}>Offline</span>}</p>
            <p><b>Total Deliveries:</b> {partnerDetail.totalDeliveries}</p>
            <p><b>Rating:</b> {partnerDetail.rating} ★</p>
            <p><b>Total Earnings:</b> ₹{partnerDetail.totalEarnings}</p>

            <div>
              <b>Documents:</b>
              <ul style={styles.docList}>
                {partnerDetail.documents.map((doc, i) => (
                  <li key={i} style={styles.docItem}>
                    <span>{doc.type || doc.documentNumber || "Document"}</span>
                    {doc.imageUrl && (
                      <>
                        {" "}
                        <a
                          href={doc.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2563eb", marginLeft: 8, textDecoration: "underline" }}
                        >
                          View
                        </a>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div style={styles.lastOrdersContainer}>
              <b>Last 5 Orders (with 15% commission):</b>
              {partnerDetail.orders.length === 0 ? (
                <p style={{ fontStyle: "italic", color: "#555" }}>No order history.</p>
              ) : (
                partnerDetail.orders.map((ord) => {
                  console.log(ord, "ord");
                  const order = orders.find(o => o.id === ord);

                  return (
                    <div key={order.id} style={styles.lastOrderItem}>
                      <div><b>Order ID:</b> {order.id}</div>
                      <div><b>Date:</b> {order.date}</div>
                      <div><b>Order Amount:</b> ₹{order.orderTotal}</div>
                      <div><b>Commission (15%):</b> ₹{order.orderTotal * 0.15}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Edit Info Modal */}
      {editPartner && (
        
        <>
          <div style={styles.modalOverlay} onClick={() => setEditPartner(null)} />
          <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="editPartnerTitle">
            <button style={styles.closeBtn} onClick={() => setEditPartner(null)} aria-label="Close modal">&times;</button>
            <h2 id="editPartnerTitle" style={styles.modalHeader}>Edit Info for {editPartner.name}</h2>
            <form onSubmit={e => {
              e.preventDefault();
              console.log(editForm, "editForm");
              saveEditChanges(editPartner.id);
            }}>
              <label>
                Name:
                <input type="text" name="name" value={editForm.name} onChange={handleEditChange} required style={styles.inputField} />
              </label>
              <label>
                Mobile:
                <input
                  type="tel"
                  name="phone"
                  pattern="[0-9]{10}"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  required
                  style={styles.inputField}
                />
              </label>
              <label>
                Vehicle Info:
                <input
                  type="text"
                  name="vehicle"
                  value={editForm.vehicle}
                  onChange={handleEditChange}
                  required
                  style={styles.inputField}
                />
              </label>
              <label>
                Vehicle Number:
                <input
                  type="text"
                  name="vehicleNo"
                  value={editForm.vehicleNo}
                  onChange={handleEditChange}
                  required
                  style={styles.inputField}
                />
              </label>
              <div style={{display: "flex", justifyContent: "flex-end", gap: 12}}>
                <button type="button" onClick={() => setEditPartner(null)} style={{ ...styles.btn, backgroundColor: "#6c757d" }}>Cancel</button>
                <button type="submit" style={{ ...styles.btn, backgroundColor: "#2563eb" }}>Save</button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Reset Password Modal */}
      {resetPasswordPartner && (
        <>
          <div style={styles.modalOverlay} onClick={() => setResetPasswordPartner(null)} />
          <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="resetPasswordTitle">
            <button style={styles.closeBtn} onClick={() => setResetPasswordPartner(null)} aria-label="Close modal">&times;</button>
            <h2 id="resetPasswordTitle" style={styles.modalHeader}>Reset Password for {resetPasswordPartner.name}</h2>
            
            <div>
              <label>
                New Password:
                <input 
                  type="password" 
                  name="newPassword" 
                  value={passwordForm.newPassword} 
                  onChange={handlePasswordChange} 
                  required 
                  style={styles.inputField}
                  minLength="6"
                />
              </label>
              
              <label>
                Confirm Password:
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={passwordForm.confirmPassword} 
                  onChange={handlePasswordChange} 
                  required 
                  style={styles.inputField}
                  minLength="6"
                />
              </label>
              
              {passwordError && (
                <div style={styles.passwordMatchError}>{passwordError}</div>
              )}
              
              <div style={{display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20}}>
                <button 
                  type="button" 
                  onClick={() => setResetPasswordPartner(null)} 
                  style={{ ...styles.btn, backgroundColor: "#6c757d" }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={submitPasswordReset}
                  style={{ ...styles.btn, backgroundColor: "#2563eb" }}
                  disabled={!passwordForm.newPassword || !passwordForm.confirmPassword}
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn { from {opacity: 0;} to {opacity:1;} }
        button:focus, input:focus { outline: 2px solid #2563eb; box-shadow: 0 0 5px #2563eb; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}