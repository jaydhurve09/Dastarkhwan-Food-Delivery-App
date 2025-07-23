import React, { useState, useRef, useEffect } from "react";
// Added FaEye and FaEyeSlash icons
import { FaUserShield, FaLock, FaClock, FaUserCircle, FaSignOutAlt, FaKey, FaClipboardList, FaTasks, FaFileAlt, FaBell, FaCaretDown, FaTimesCircle, FaEdit, FaEye, FaEyeSlash, FaUserTie } from "react-icons/fa";

const roles = [
  "Dashboard",
  "Profile Management",
  "Restaurant Monitoring",
  "Delivery Partner Management",
  "Orders & Delivery",
  "Payment Commission Report",
  "Promo Code Management",
  "CMS Management",
  "Feedback & Complaints",
  "Notification"
];
const currentUserRole = "Super Admin";

const AdminSettings = () => {
  const [password, setPassword] = useState("");
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", roles: [], password: "" });
  const [logs, setLogs] = useState([
    { time: "2025-07-21 10:30", activity: "Logged in" },
    { time: "2025-07-21 11:15", activity: "Changed CMS content" },
    { time: "2025-07-22 09:10", activity: "Added a sub-admin" },
  ]);
  const [subAdmins, setSubAdmins] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null); // State for which 3-dot menu is open
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showAddAdminRolesDropdown, setShowAddAdminRolesDropdown] = useState(false); // Specific for Add Admin form

  // New states for editing sub-admins
  const [showEditSubAdminModal, setShowEditSubAdminModal] = useState(false);
  const [editingSubAdmin, setEditingSubAdmin] = useState(null); // Stores the admin object being edited
  const [editingSubAdminIndex, setEditingSubAdminIndex] = useState(null); // Stores the index of the admin being edited
  const [showEditModalRolesDropdown, setShowEditModalRolesDropdown] = useState(false); // Specific for Edit Modal form
  // New state for password visibility in edit modal
  const [showEditPassword, setShowEditPassword] = useState(false);

  const addAdminMultiSelectRef = useRef(null); // Ref for the Add Admin multi-select container
  const editAdminMultiSelectRef = useRef(null); // Ref for the Edit Admin multi-select container
  const profileDropdownRef = useRef(null); // Ref for profile dropdown container

  const [loggedInUser, setLoggedInUser] = useState({
    name: 'Admin User',
    role: currentUserRole,
  });

  // Effect for closing dropdowns/menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close Add Admin roles dropdown
      if (addAdminMultiSelectRef.current && !addAdminMultiSelectRef.current.contains(event.target)) {
        setShowAddAdminRolesDropdown(false);
      }
      // Close Edit Admin roles dropdown
      if (editAdminMultiSelectRef.current && !editAdminMultiSelectRef.current.contains(event.target)) {
        setShowEditModalRolesDropdown(false);
      }
      // Close profile dropdown
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      // Close 3-dot menu
      if (menuOpen !== null) { // Only check if a menu is actually open
          const currentMenuElement = document.getElementById(`three-dot-menu-${menuOpen}`);
          const threeDotButtonElement = document.getElementById(`three-dot-button-${menuOpen}`);
          if (currentMenuElement && !currentMenuElement.contains(event.target) && threeDotButtonElement && !threeDotButtonElement.contains(event.target)) {
              setMenuOpen(null);
          }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAddAdminRolesDropdown, showEditModalRolesDropdown, showProfileDropdown, menuOpen]);

  const getCurrentTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const handleAddSubAdmin = () => {
    if (!newAdmin.name || !newAdmin.email || newAdmin.roles.length === 0 || !newAdmin.password) {
      alert("Please fill all fields and select at least one role.");
      return;
    }
    setSubAdmins([...subAdmins, newAdmin]);
    setNewAdmin({ name: "", email: "", roles: [], password: "" });
    setLogs(prevLogs => [{ time: getCurrentTimestamp(), activity: `Added sub-admin: ${newAdmin.name} with roles: ${newAdmin.roles.join(', ')}` }, ...prevLogs]);
    alert("Sub-admin added!");
  };

  const handleAddAdminRoleToggle = (role) => {
    setNewAdmin(prevAdmin => {
      const isSelected = prevAdmin.roles.includes(role);
      const updatedRoles = isSelected
        ? prevAdmin.roles.filter(selectedRole => selectedRole !== role)
        : [...prevAdmin.roles, role];
      return { ...prevAdmin, roles: updatedRoles };
    });
  };

  const handleEditAdminRoleToggle = (role) => {
    setEditingSubAdmin(prevAdmin => {
      if (!prevAdmin) return null;

      const isSelected = prevAdmin.roles.includes(role);
      const updatedRoles = isSelected
        ? prevAdmin.roles.filter(selectedRole => selectedRole !== role)
        : [...prevAdmin.roles, role];
      return { ...prevAdmin, roles: updatedRoles };
    });
  };

  const handleChangePassword = () => {
    if (!password) {
      alert("Enter a new password");
      return;
    }
    setLogs(prevLogs => [{ time: getCurrentTimestamp(), activity: "Changed admin password" }, ...prevLogs]);
    alert("Password updated!");
    setPassword("");
    setShowChangePasswordModal(false);
  };

  const handleDeleteSubAdmin = (index) => {
    if (window.confirm(`Are you sure you want to delete ${subAdmins[index].name}?`)) {
      const deletedAdminName = subAdmins[index].name;
      const updated = [...subAdmins];
      updated.splice(index, 1);
      setSubAdmins(updated);
      setLogs(prevLogs => [{ time: getCurrentTimestamp(), activity: `Deleted sub-admin: ${deletedAdminName}` }, ...prevLogs]);
      setMenuOpen(null);
    } else {
        setMenuOpen(null);
    }
  };

  const handleEditSubAdmin = (admin, index) => {
    setEditingSubAdmin({ ...admin });
    setEditingSubAdminIndex(index);
    setShowEditSubAdminModal(true);
    setMenuOpen(null);
    setShowEditPassword(false); // Reset password visibility when opening modal
  };

  const handleSaveEditedSubAdmin = () => {
    if (!editingSubAdmin.name || !editingSubAdmin.email || editingSubAdmin.roles.length === 0) {
      alert("Please fill all fields (except optional new password) and select at least one role.");
      return;
    }

    const updatedSubAdmins = [...subAdmins];
    updatedSubAdmins[editingSubAdminIndex] = {
      ...editingSubAdmin,
      password: editingSubAdmin.password || subAdmins[editingSubAdminIndex].password
    };
    setSubAdmins(updatedSubAdmins);

    setLogs(prevLogs => [{ time: getCurrentTimestamp(), activity: `Edited sub-admin: ${editingSubAdmin.name}` }, ...prevLogs]);
    alert("Sub-admin updated successfully!");
    handleCancelEdit();
  };

  const handleCancelEdit = () => {
    setEditingSubAdmin(null);
    setEditingSubAdminIndex(null);
    setShowEditSubAdminModal(false);
    setShowEditModalRolesDropdown(false);
    setShowEditPassword(false); // Reset password visibility when closing modal
  };

  const handleLogout = () => {
    console.log('User logged out from Admin Settings!');
    setShowProfileDropdown(false);
    alert('You have been successfully logged out from Admin Settings.');
  };

  // Inline Styles
  const cardStyle = {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "30px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    border: "1px solid #dee2e6",
  };

  const inputStyle = {
    flex: "1",
    padding: "10px",
    borderRadius: "6px",
    backgroundColor: "#fff",
    color: "#212529",
    border: "1px solid #ced4da",
    minWidth: "200px",
  };

  const sectionHeader = {
    fontSize: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const greenButtonStyle = {
    marginTop: "16px",
    padding: "10px 20px",
    backgroundColor: "#28a745",
    color: "#fff",
    fontWeight: "bold",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  };

  const tableHeader = {
    padding: "10px",
    borderBottom: "1px solid #dee2e6",
    textAlign: "left",
    textTransform: "uppercase",
  };

  const tableCell = {
    padding: "10px",
    borderBottom: "1px solid #dee2e6",
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    position: 'relative',
  };

  const iconButton = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#666',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    transition: 'background-color 0.2s',
  };

  const profileDropdown = {
    position: 'absolute',
    top: '40px',
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
  };

  const dropdownUserInfo = {
    paddingBottom: '10px',
    borderBottom: '1px solid #eee',
    marginBottom: '10px',
  };

  const dropdownUserName = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  };

  const dropdownUserRole = {
    fontSize: '14px',
    color: '#777',
  };

  const dropdownButton = {
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
  };

  const changePasswordButton = {
    ...dropdownButton,
    backgroundColor: '#6c757d',
  };

  const logoutButton = {
    ...dropdownButton,
    backgroundColor: '#dc3545',
  };


  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const modalContentStyle = {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
    width: '400px',
    maxWidth: '90%',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  const modalTitleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px',
    textAlign: 'center',
  };

  const modalInputStyle = {
    flex: "1",
    padding: "10px",
    borderRadius: "6px",
    backgroundColor: "#fff",
    color: "#212529",
    border: "1px solid #ced4da",
    minWidth: "200px",
    width: 'calc(100% - 20px)', // Adjusted for full width minus padding
  };

  const passwordInputContainerStyle = { // New style for password input wrapper
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%', // Take full width within modal content
  };

  const passwordToggleIconStyle = { // New style for eye icon
    position: 'absolute',
    right: '10px',
    cursor: 'pointer',
    color: '#666',
    fontSize: '18px',
    zIndex: 1, // Ensure icon is clickable
  };


  const modalButtonsContainerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px',
  };

  const modalCancelButton = {
    padding: '10px 20px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    backgroundColor: '#f0f0f0',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };

  const modalSaveButton = {
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#28a745',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };

  // Custom multi-select dropdown styles (reused for add and edit)
  const multiSelectWrapperStyle = {
    position: 'relative',
    flex: '1',
    minWidth: '200px',
    zIndex: 10, // Ensure it's above other elements when open in the form
  };

  const multiSelectDisplayBoxStyle = {
    ...inputStyle,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    minHeight: '42px',
    paddingRight: '35px',
    position: 'relative',
  };

  const multiSelectPlaceholderStyle = {
    color: '#868e96',
  };

  const multiSelectSelectedItemStyle = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    padding: '4px 8px',
    margin: '2px',
    fontSize: '14px',
    gap: '5px',
    fontWeight: '500',
  };

  const removeSelectedItemStyle = {
    cursor: 'pointer',
    color: '#495057',
    fontSize: '12px',
  };

  const multiSelectDropdownIconStyle = {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: '#666',
  };

  const multiSelectOptionsStyle = {
    position: 'absolute',
    top: '100%',
    left: '0',
    right: '0',
    backgroundColor: '#fff',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    marginTop: '5px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 20, // Higher than wrapper
  };

  const multiSelectOptionItemStyle = {
    padding: '10px 15px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid #eee',
  };

  const multiSelectOptionItemHoverStyle = {
    backgroundColor: '#f1f3f5',
  };

  const multiSelectOptionItemSelectedStyle = {
    backgroundColor: '#e6f7ff',
    fontWeight: 'bold',
  };

  const threeDotMenuButtonStyle = {
    padding: "8px 12px",
    background: "none",
    color: "#333",
    border: "none",
    borderRadius: "6px",
    width: "100%",
    cursor: "pointer",
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background-color 0.2s',
  };

  const threeDotMenuButtonHoverStyle = {
    backgroundColor: '#f0f0f0',
  };

  const getRoleIcon = (roleName) => {
    switch (roleName) {
      case "Dashboard": return <FaClock />;
      case "Profile Management": return <FaUserCircle />;
      case "Restaurant Monitoring": return <FaUserShield />;
      case "Delivery Partner Management": return <FaUserTie />; 
      case "Orders & Delivery": return <FaClipboardList />;
      case "Payment Commission Report": return <FaFileAlt />;
      case "Promo Code Management": return <FaBell />;
      case "CMS Management": return <FaFileAlt />;
      case "Feedback & Complaints": return <FaUserCircle />;
      case "Notification": return <FaBell />;
      default: return null;
    }
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", color: "#212529", padding: "30px", minHeight: "100vh" }}>
      <header style={headerStyle}>
        <h1 style={{ fontSize: "26px", fontWeight: "bold" }}>Admin Settings</h1>
        <div style={{ position: 'relative' }} ref={profileDropdownRef}>
          <button
            style={iconButton}
            title="User Profile"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <FaUserCircle />
          </button>
          {showProfileDropdown && loggedInUser && (
            <div style={profileDropdown}>
              <div style={dropdownUserInfo}>
                <p style={dropdownUserName}>{loggedInUser.name}</p>
                <p style={dropdownUserRole}>{loggedInUser.role}</p>
              </div>
              {currentUserRole === "Super Admin" && (
                <button
                  onClick={() => {
                    setShowChangePasswordModal(true);
                    setShowProfileDropdown(false);
                  }}
                  style={changePasswordButton}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#5a6268')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = '#6c757d')}
                >
                  <FaKey /> Change Password
                </button>
              )}
              <button
                onClick={handleLogout}
                style={logoutButton}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#c82333')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#dc3545')}
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Change Password Modal */}
      {showChangePasswordModal && currentUserRole === "Super Admin" && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={modalTitleStyle}><FaLock /> Change Password</h2>
            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={modalInputStyle}
            />
            <div style={modalButtonsContainerStyle}>
              <button
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setPassword("");
                }}
                style={modalCancelButton}
              >
                Cancel
              </button>
              <button onClick={handleChangePassword} style={modalSaveButton}>
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sub-admin */}
      <div style={cardStyle}>
        <h2 style={sectionHeader}><FaUserShield /> Add Sub-admin</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginTop: "12px" }}>
          <input
            type="text"
            placeholder="Full Name"
            value={newAdmin.name}
            onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="Email"
            value={newAdmin.email}
            onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Create Password"
            value={newAdmin.password}
            onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
            style={inputStyle}
          />

          {/* Custom Multi-select Dropdown for Roles (Add Admin) */}
          <div style={multiSelectWrapperStyle} ref={addAdminMultiSelectRef}>
            <div
              style={multiSelectDisplayBoxStyle}
              onClick={() => setShowAddAdminRolesDropdown(!showAddAdminRolesDropdown)}
            >
              {newAdmin.roles.length === 0 ? (
                <span style={multiSelectPlaceholderStyle}>Select Roles</span>
              ) : (
                newAdmin.roles.map(role => (
                  <span key={role} style={multiSelectSelectedItemStyle}>
                    {role}
                    <FaTimesCircle
                      style={removeSelectedItemStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddAdminRoleToggle(role);
                      }}
                    />
                  </span>
                ))
              )}
              <FaCaretDown style={multiSelectDropdownIconStyle} />
            </div>

            {showAddAdminRolesDropdown && (
              <div style={multiSelectOptionsStyle}>
                {roles.map((role) => (
                  <div
                    key={role}
                    style={{
                      ...multiSelectOptionItemStyle,
                      ...(newAdmin.roles.includes(role) ? multiSelectOptionItemSelectedStyle : {}),
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = multiSelectOptionItemHoverStyle.backgroundColor}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = newAdmin.roles.includes(role) ? multiSelectOptionItemSelectedStyle.backgroundColor : '#fff'}
                    onClick={() => handleAddAdminRoleToggle(role)}
                  >
                    {getRoleIcon(role)} {role}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <button onClick={handleAddSubAdmin} style={greenButtonStyle}>Add Sub-admin</button>

        {/* Sub-admin list */}
        {subAdmins.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600" }}>Sub-admins</h3>
            <ul style={{ marginTop: "8px", paddingLeft: "0", listStyle: "none" }}>
              {subAdmins.map((admin, idx) => (
                <li
                  key={idx}
                  style={{
                    padding: "10px 15px",
                    marginBottom: "8px",
                    backgroundColor: "#f1f3f5",
                    borderRadius: "6px",
                    position: "relative",
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: '15px' }}>
                    {admin.name} ({admin.email}) — <span style={{ color: "#ffc107" }}>{admin.roles.join(', ')}</span>
                  </span>

                  {/* 3-dot menu */}
                  <div
                    id={`three-dot-button-${idx}`}
                    style={{
                      position: "absolute",
                      right: "15px",
                      top: "12px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "20px",
                      background: '#fff',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                    onClick={() => {
                        setMenuOpen(menuOpen === idx ? null : idx);
                    }}
                  >
                    ⋮
                  </div>

                  {menuOpen === idx && (
                    <div
                        id={`three-dot-menu-${idx}`}
                        style={{
                            position: "absolute",
                            top: "40px",
                            right: "15px",
                            background: "#fff",
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                            boxShadow: "0 0 6px rgba(0,0,0,0.1)",
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                      <button
                        onClick={() => handleEditSubAdmin(admin, idx)}
                        style={threeDotMenuButtonStyle}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = threeDotMenuButtonHoverStyle.backgroundColor)}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = 'none')}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSubAdmin(idx)}
                        style={{
                          ...threeDotMenuButtonStyle,
                          color: '#dc3545',
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = threeDotMenuButtonHoverStyle.backgroundColor)}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = 'none')}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Edit Sub-admin Modal */}
      {showEditSubAdminModal && editingSubAdmin && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={modalTitleStyle}><FaEdit /> Edit Sub-admin</h2>
            <input
              type="text"
              placeholder="Full Name"
              value={editingSubAdmin.name}
              onChange={(e) => setEditingSubAdmin({ ...editingSubAdmin, name: e.target.value })}
              style={modalInputStyle}
            />
            <input
              type="email"
              placeholder="Email"
              value={editingSubAdmin.email}
              onChange={(e) => setEditingSubAdmin({ ...editingSubAdmin, email: e.target.value })}
              style={modalInputStyle}
            />
            {/* Password input with toggle icon */}
            <div style={passwordInputContainerStyle}>
              <input
                type={showEditPassword ? "text" : "password"} // Dynamic type
                placeholder="New Password (optional)"
                value={editingSubAdmin.password || ''}
                onChange={(e) => setEditingSubAdmin({ ...editingSubAdmin, password: e.target.value })}
                style={modalInputStyle}
              />
              <span
                style={passwordToggleIconStyle}
                onClick={() => setShowEditPassword(!showEditPassword)} // Toggle visibility
              >
                {showEditPassword ? <FaEyeSlash /> : <FaEye />} {/* Change icon based on state */}
              </span>
            </div>

            {/* Custom Multi-select Dropdown for Roles (Edit Admin) */}
            <div style={{ ...multiSelectWrapperStyle, zIndex: 10 }} ref={editAdminMultiSelectRef}>
              <div
                style={multiSelectDisplayBoxStyle}
                onClick={() => setShowEditModalRolesDropdown(!showEditModalRolesDropdown)}
              >
                {editingSubAdmin.roles.length === 0 ? (
                  <span style={multiSelectPlaceholderStyle}>Select Roles</span>
                ) : (
                  editingSubAdmin.roles.map(role => (
                    <span key={role} style={multiSelectSelectedItemStyle}>
                      {role}
                      <FaTimesCircle
                        style={removeSelectedItemStyle}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAdminRoleToggle(role);
                        }}
                      />
                    </span>
                  ))
                )}
                <FaCaretDown style={multiSelectDropdownIconStyle} />
              </div>

              {showEditModalRolesDropdown && (
                <div style={multiSelectOptionsStyle}>
                  {roles.map((role) => (
                    <div
                      key={role}
                      style={{
                        ...multiSelectOptionItemStyle,
                        ...(editingSubAdmin.roles.includes(role) ? multiSelectOptionItemSelectedStyle : {}),
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = multiSelectOptionItemHoverStyle.backgroundColor}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = editingSubAdmin.roles.includes(role) ? multiSelectOptionItemSelectedStyle.backgroundColor : '#fff'}
                      onClick={() => handleEditAdminRoleToggle(role)}
                    >
                      {getRoleIcon(role)} {role}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={modalButtonsContainerStyle}>
              <button onClick={handleCancelEdit} style={modalCancelButton}>
                Cancel
              </button>
              <button onClick={handleSaveEditedSubAdmin} style={modalSaveButton}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs */}
      <div style={cardStyle}>
        <h2 style={sectionHeader}><FaClock /> Activity Logs</h2>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="logFilter">View logs for:</label>
          <select
            id="logFilter"
            // value={logTimeFilter} // Assuming you had a state for this from previous iteration
            // onChange={(e) => setLogTimeFilter(e.target.value)}
            style={inputStyle}
          >
            <option value="all_time">All Time</option>
            <option value="today">Today</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            {/* Add more time options as needed */}
          </select>
        </div>
        <div style={{ overflowX: "auto", marginTop: "10px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f3f5" }}>
                <th style={tableHeader}>Timestamp</th>
                <th style={tableHeader}>Activity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index}>
                  <td style={tableCell}>{log.time}</td>
                  <td style={tableCell}>{log.activity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;