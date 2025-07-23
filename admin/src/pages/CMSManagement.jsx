import React, { useState, useEffect, useCallback } from 'react';
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa"; // Import FaUserCircle and FaSignOutAlt
;

const CMSManagement = () => {
  const [cmsSections, setCmsSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(true); 

  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionContent, setNewSectionContent] = useState('');
  const [newSectionType, setNewSectionType] = useState('text');
  const [editMode, setEditMode] = useState({}); 

  // State for profile dropdown visibility
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);


  const [loggedInUser] = useState({
    name: 'CMS Admin', 
    role: 'CMS Manager', 
  });


  useEffect(() => {
    
    setLoading(true);
    const timer = setTimeout(() => {
      const defaultSections = [
        { id: 'faqs', title: 'FAQs', type: 'text', content: 'These are some frequently asked questions. You can edit this content to provide answers to common queries about your product or service.' },
        { id: 'termsAndConditions', title: 'Terms & Conditions', type: 'text', content: 'Please read these terms and conditions carefully before using Our Service. This is where you outline the legal agreement between your business and your users.' },
        { id: 'privacyPolicy', title: 'Privacy Policy', type: 'text', content: 'Our Privacy Policy describes Our policies and procedures on the collection, use, and disclosure of Your information when You use the Service and tells You about Your privacy rights.' },
        { id: 'aboutUs', title: 'About Us', type: 'text', content: 'Learn more about our company, our mission, and our values. We are dedicated to providing the best possible experience for our customers.' },
        { id: 'contactInfo', title: 'Contact Info', type: 'contact', phone: '+1 (555) 123-4567', email: 'support@example.com', address: '123 Business Rd, Suite 100, City, State, 90210' },
      ];
      setCmsSections(defaultSections);
      setLoading(false);
      setUserId('mock-user-id'); // Set a mock user ID
    }, 1000); // Simulate network delay

    return () => clearTimeout(timer);
  }, []);


  const saveContent = useCallback(async (sectionId, dataToSave) => {
    setIsSaving(true);
    setMessage({ text: '', type: '' });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    setMessage({ text: 'Content saved successfully (demo only, not persisted).', type: 'success' });
    setIsSaving(false);
    setEditMode(prev => ({ ...prev, [sectionId]: false })); // Exit edit mode after saving
  }, []);

  const handleContentChange = (sectionId, field, value) => {
    setCmsSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId ? { ...section, [field]: value } : section
      )
    );
  };

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) {
      setMessage({ text: 'Section title cannot be empty.', type: 'error' });
      return;
    }

    const newSectionData = {
      title: newSectionTitle.trim(),
      type: newSectionType,
      // Provide default empty values based on type
      ...(newSectionType === 'text' && { content: newSectionContent || '' }),
      ...(newSectionType === 'contact' && { phone: '', email: '', address: '' }),
    };

    setIsSaving(true);
    // Simulate adding to backend (not actually happening in this demo)
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

    setCmsSections([...cmsSections, { ...newSectionData, id: crypto.randomUUID() }]);
    setMessage({ text: `Section "${newSectionTitle}" added (not saved to backend).`, type: 'success' });
    setShowAddSectionModal(false);
    setNewSectionTitle('');
    setNewSectionContent('');
    setNewSectionType('text');
    setIsSaving(false);
  };

  const handleDeleteSection = async (sectionId, sectionTitle) => {
    // Replaced window.confirm with a simple console log for demo purposes,
    if (!window.confirm(`Are you sure you want to delete section "${sectionTitle}"?`)) {
      return;
    }

    setIsSaving(true);
    // Simulate deleting from backend (not actually happening in this demo)
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

    setCmsSections(prev => prev.filter(section => section.id !== sectionId));
    setMessage({ text: `Section "${sectionTitle}" deleted (not synced to backend).`, type: 'success' });
    setIsSaving(false);
  };

  const handleEditClick = (sectionId) => {
    setEditMode(prev => ({ ...prev, [sectionId]: true }));
  };

  const handleCancelEdit = (sectionId) => {
    setEditMode(prev => ({ ...prev, [sectionId]: false }));
   
  };

  // Handle logout functionality with confirmation
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      console.log('User logged out from CMS Management!');
      setShowProfileDropdown(false); // Close dropdown after logout
      alert('You have been successfully logged out from CMS Management.');
    }
  };

  // Inline Styles
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    position: 'relative', // Essential for dropdown positioning
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
    top: '40px', // Adjust based on header height
    right: '0',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    minWidth: '200px',
    zIndex: 999, // Ensure it's above other content
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

  if (!isAuthReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#4b5563', fontSize: '20px', fontWeight: '500' }}>Initializing...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '24px', fontFamily: '"Inter", sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '1500px', margin: 'auto', backgroundColor: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', marginBottom: '32px', width: '100%' }}>
        <header style={headerStyle}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1a202c', backgroundClip: 'text', WebkitBackgroundClip: 'text', backgroundImage: 'linear-gradient(to right, #070708ff, #060606ff)' }}>
            CMS Admin Panel
          </h1>
          <div style={{ position: 'relative' }}> {/* Wrapper for profile icon and dropdown */}
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
                <button
                  onClick={handleLogout}
                  style={dropdownButton}
                >
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            )}
          </div>
        </header>
        <p style={{ textAlign: 'center', color: '#4b5563', marginBottom: '32px' }}>Manage your website content, policies, and contact information.</p>

        {message.text && (
          <div style={{ padding: '16px', borderRadius: '8px', fontSize: '14px', marginBottom: '24px', backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2', color: message.type === 'success' ? '#065f46' : '#991b1b' }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <button
            onClick={() => setShowAddSectionModal(true)}
            style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: '#fff', fontWeight: '600', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '20px', width: '20px' }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Add New Section</span>
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#4b5563', fontSize: '18px' }}>
            {/* Simplified spinner to a static circle */}
            <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', marginRight: '12px' }}></div>
            Loading CMS content...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {cmsSections.length === 0 && (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280', padding: '32px', fontSize: '18px' }}>No CMS sections found. Click "Add New Section" to get started!</p>
            )}
            {cmsSections.map(section => (
              <div key={section.id} style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>{section.title}</h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!editMode[section.id] ? (
                      <button
                        onClick={() => handleEditClick(section.id)}
                        style={{ color: '#2563eb', padding: '8px', borderRadius: '9999px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
                        title="Edit Section"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '24px', width: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCancelEdit(section.id)}
                        style={{ color: '#6b7280', padding: '8px', borderRadius: '9999px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
                        title="Cancel Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '24px', width: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    {/* Allow deletion only for non-default sections */}
                    {['faqs', 'termsAndConditions', 'privacyPolicy', 'aboutUs', 'contactInfo'].includes(section.id) ? null : (
                      <button
                        onClick={() => handleDeleteSection(section.id, section.title)}
                        style={{ color: '#ef4444', padding: '8px', borderRadius: '9999px', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.5 : 1, backgroundColor: 'transparent' }}
                        disabled={isSaving}
                        title="Delete Section"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '24px', width: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {section.type === 'text' && (
                  <>
                    <textarea
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', color: '#374151', fontSize: '14px', minHeight: '150px', resize: 'vertical', backgroundColor: editMode[section.id] ? '#fff' : '#f0f0f0' }}
                      value={section.content || ''}
                      onChange={(e) => handleContentChange(section.id, 'content', e.target.value)}
                      placeholder={`Enter ${section.title} content here...`}
                      readOnly={!editMode[section.id]}
                    />
                    {editMode[section.id] && (
                      <button
                        onClick={() => saveContent(section.id, { content: section.content })}
                        style={{ marginTop: '16px', width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: '#fff', fontWeight: '600', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', marginRight: '8px' }}></div>
                            Saving...
                          </>
                        ) : (
                          `Save ${section.title}`
                        )}
                      </button>
                    )}
                  </>
                )}

                {section.type === 'contact' && (
                  <>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Phone</label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', color: '#374151', fontSize: '14px', marginBottom: '12px', backgroundColor: editMode[section.id] ? '#fff' : '#f0f0f0' }}
                      value={section.phone || ''}
                      onChange={(e) => handleContentChange(section.id, 'phone', e.target.value)}
                      placeholder="e.g., +91 9876543210"
                      readOnly={!editMode[section.id]}
                    />

                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Email</label>
                    <input
                      type="email"
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', color: '#374151', fontSize: '14px', marginBottom: '12px', backgroundColor: editMode[section.id] ? '#fff' : '#f0f0f0' }}
                      value={section.email || ''}
                      onChange={(e) => handleContentChange(section.id, 'email', e.target.value)}
                      placeholder="e.g., info@example.com"
                      readOnly={!editMode[section.id]}
                    />

                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Address</label>
                    <textarea
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', color: '#374151', fontSize: '14px', minHeight: '80px', resize: 'vertical', marginBottom: '12px', backgroundColor: editMode[section.id] ? '#fff' : '#f0f0f0' }}
                      value={section.address || ''}
                      onChange={(e) => handleContentChange(section.id, 'address', e.target.value)}
                      placeholder="e.g., 123 Main St, City, State, ZIP"
                      readOnly={!editMode[section.id]}
                    />
                    {editMode[section.id] && (
                      <button
                        onClick={() => saveContent(section.id, { phone: section.phone, email: section.email, address: section.address })}
                        style={{ marginTop: '16px', width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: '#fff', fontWeight: '600', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', marginRight: '8px' }}></div>
                            Saving...
                          </>
                        ) : (
                          'Save Contact Info'
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Section Modal */}
      {showAddSectionModal && (
        <div style={{ position: 'fixed', inset: '0', backgroundColor: 'rgba(75, 85, 99, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '50', padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', maxWidth: '480px', width: '100%' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '24px', textAlign: 'center' }}>Add New CMS Section</h3>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="newSectionTitle" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Section Title</label>
              <input
                type="text"
                id="newSectionTitle"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', color: '#374151' }}
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="e.g., Shipping Policy"
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="newSectionType" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Section Type</label>
              <select
                id="newSectionType"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', color: '#374151' }}
                value={newSectionType}
                onChange={(e) => setNewSectionType(e.target.value)}
              >
                <option value="text">Text Content (e.g., Policy, FAQ)</option>
                <option value="contact">Contact Information</option>
              </select>
            </div>
            {newSectionType === 'text' && (
              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="newSectionContent" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Content</label>
                <textarea
                  id="newSectionContent"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', color: '#374151', minHeight: '100px', resize: 'vertical' }}
                  value={newSectionContent}
                  onChange={(e) => setNewSectionContent(e.target.value)}
                  placeholder="Enter content for this new section..."
                />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button
                onClick={() => {
                  setShowAddSectionModal(false);
                  setNewSectionTitle('');
                  setNewSectionContent('');
                  setNewSectionType('text');
                }}
                style={{ padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#1f2937', fontWeight: '500', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddSection}
                style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', fontWeight: '500', borderRadius: '8px', border: 'none', cursor: (isSaving || !newSectionTitle.trim()) ? 'not-allowed' : 'pointer', opacity: (isSaving || !newSectionTitle.trim()) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                disabled={isSaving || !newSectionTitle.trim()}
              >
                {isSaving ? (
                  <>
                    <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', marginRight: '8px' }}></div>
                    Adding...
                  </>
                ) : (
                  'Add Section'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CMSManagement;