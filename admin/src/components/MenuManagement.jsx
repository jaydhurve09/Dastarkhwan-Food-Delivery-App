import React from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const MenuManagement = ({
  styles,
  activeSection,
  setActiveSection,
  setEditingItem,
  setMenuModalOpen,
  menuItems,
  isLoading,
  error,
  categories,
  extractIdFromDocRef,
  getFoodTypeStyle,
  getStatusStyle,
  setImagePreview,
  setSelectedSubCategory,
  setCurrentSubCategories,
  setHasSubDishes,
  setCurrentSubDishes,
  setSelectedRecommendationTags,
  handleDeleteMenuItem,
  success,
  setSuccess,
  setError,
  fetchCategories,
  setEditingCategory,
  setNewCategory,
  setCategoryModalOpen,
  handleEditCategory,
  handleDeleteCategory
}) => {
  return (
    <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h2 style={styles.cardTitle}>Menu Management</h2>
        <div>
          <button 
            style={{ ...styles.button, ...styles.addButton }} 
            onClick={() => { 
              setEditingItem(null); 
              setMenuModalOpen(true); 
            }}
          >
            <FaPlus /> Add New Item
          </button>
          <button
            style={{ 
              ...styles.button, 
              ...styles.addButton, 
              backgroundColor: '#f39c12', 
              marginTop: '10px', 
              marginLeft: '10px' 
            }}
            onClick={() => setActiveSection(activeSection === 'categories' ? 'menu' : 'categories')}
          >
            <FaPlus /> {activeSection === 'categories' ? 'Hide Categories' : 'Manage Categories'}
          </button>
        </div>
      </div>

      {activeSection === 'menu' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            {/* Menu section content */}
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading menu items...</div>
          ) : error ? (
            <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>{error}</div>
          ) : menuItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>No menu items found</div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={{...styles.table, width: '100%', tableLayout: 'fixed'}}>
                <thead>
                  <tr>
                    <th style={{...styles.tableHeader, width: '80px'}}>Image</th>
                    <th style={{...styles.tableHeader, width: '25%'}}>Name</th>
                    <th style={{...styles.tableHeader, width: '15%'}}>Category</th>
                    <th style={{...styles.tableHeader, width: '12%'}}>Price (₹)</th>
                    <th style={{...styles.tableHeader, width: '10%'}}>Type</th>
                    <th style={{...styles.tableHeader, width: '10%'}}>Status</th>
                    <th style={{...styles.tableHeader, width: '120px'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((item, index) => (
                    <tr key={`menu-item-${index}`}>
                      <td style={styles.tableCell}>
                        <img
                          src={item.image || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWVlZWUiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'}
                          alt={item.name || 'Menu item'}
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                          }}
                        />
                      </td>
                      <td style={{...styles.tableCell, padding: '12px'}}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{item.name || 'Unnamed Item'}</div>
                        <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>{item.description || 'No description'}</div>
                      </td>
                      <td style={{...styles.tableCell, padding: '12px', fontSize: '14px'}}>
                        {(() => {
                          // Extract string ID from Firestore DocumentReference if needed
                          const categoryId = extractIdFromDocRef(item.categoryId);
                          const category = categories.find(cat => cat.id === categoryId);
                          if (category) {
                            return category.name;
                          }
                          // Fallback: if categoryId doesn't match, show the categoryId or categoryName if available
                          return item.categoryName || categoryId || 'Unknown Category';
                        })()}
                      </td>
                      <td style={{...styles.tableCell, padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#2c3e50'}}>₹{item.price ? parseFloat(item.price).toFixed(2) : '0.00'}</td>
                      <td style={{...styles.tableCell, padding: '12px', textAlign: 'center'}}>
                        <span style={{...getFoodTypeStyle(item.isVeg), padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'}}>
                          {item.isVeg ? 'Veg' : 'Non-Veg'}
                        </span>
                      </td>
                      <td style={{...styles.tableCell, padding: '12px', textAlign: 'center'}}>
                        <span style={{...getStatusStyle(item.isActive), padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'}}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{...styles.tableCell, padding: '12px'}}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              // Extract string ID from DocumentReference if needed
                              const categoryId = extractIdFromDocRef(item.categoryId);
                              const category = categories.find(c => c.id === categoryId);

                              setEditingItem({
                                ...item,
                                categoryId: categoryId // Store as string ID for form compatibility
                              });
                              setImagePreview(item.image);
                              setSelectedSubCategory(item.subCategory || '');
                              setCurrentSubCategories(category?.subCategories || []);
                              setHasSubDishes(item.addOns && item.addOns.length > 0);
                              setCurrentSubDishes(item.addOns || []);
                              setSelectedRecommendationTags(new Set(item.tags || []));
                              setMenuModalOpen(true);
                            }}
                            style={{
                              ...styles.button,
                              ...styles.editButton,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              fontSize: '12px',
                              padding: '6px 12px'
                            }}
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteMenuItem(item.id)}
                            style={{
                              ...styles.button,
                              ...styles.deleteButton,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              fontSize: '12px',
                              padding: '6px 12px'
                            }}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSection === 'categories' && (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={styles.cardTitle}>Menu Categories</h3>
            <div>
              <button
                onClick={fetchCategories}
                style={{
                  ...styles.button,
                  marginRight: '10px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                disabled={isLoading}
              >
                <span>🔄</span> Refresh
              </button>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setNewCategory({
                    name: '',
                    isActive: true,
                    hasSubcategories: false,
                    subCategories: []
                  });
                  setCategoryModalOpen(true);
                }}
                style={{
                  ...styles.button,
                  ...styles.addButton,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                disabled={isLoading}
              >
                <FaPlus /> Add Category
              </button>
            </div>
          </div>

          {success && (
            <div style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{success}</span>
              <button
                onClick={() => setSuccess('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#155724',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ×
              </button>
            </div>
          )}

          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#721c24',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ×
              </button>
            </div>
          )}

          {isLoading && categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div className="spinner">Loading categories...</div>
            </div>
          ) : categories.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '30px',
              border: '2px dashed #ddd',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}>
              <p style={{ marginBottom: '15px', fontSize: '16px', color: '#666' }}>
                No categories found.
              </p>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setNewCategory({
                    name: '',
                    isActive: true,
                    hasSubcategories: false,
                    subCategories: []
                  });
                  setCategoryModalOpen(true);
                }}
                style={{
                  ...styles.button,
                  ...styles.addButton,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <FaPlus /> Add Your First Category
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table} className="responsive-table">
                <thead>
                  <tr>
                    <th style={styles.th}>Image</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Subcategories</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => {
                    console.log('Category:', category);
                    console.log('subCategories:', category.subCategories);
                    console.log('hasSubcategories:', category.hasSubcategories);
                    console.log('isArray:', Array.isArray(category.subCategories));

                    return (
                      <tr key={category.id || category._id}>
                        <td style={styles.td}>
                          <img
                            src={category.image || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWVlZWUiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'}
                            alt={category.name || 'Category'}
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                            }}
                          />
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: 'bold' }}>{category.name}</div>
                        </td>
                        <td style={styles.td}>
                          {category.subCategories && category.subCategories.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '200px' }}>
                              {(Array.isArray(category.subCategories) ? category.subCategories : [category.subCategories])
                                .filter(sub => sub)
                                .slice(0, 3)
                                .map((sub, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      backgroundColor: '#e9ecef',
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      fontSize: '0.8em',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      maxWidth: '100%',
                                      display: 'inline-block'
                                    }}
                                    title={sub}
                                  >
                                    {sub}
                                  </span>
                                ))}
                              {category.subCategories.length > 3 && (
                                <span style={{
                                  backgroundColor: '#f8f9fa',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.8em',
                                  color: '#6c757d'
                                }}>
                                  +{category.subCategories.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#6c757d', fontStyle: 'italic' }}>
                              No subcategories
                            </span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              backgroundColor: category.isActive ? '#d4edda' : '#f8d7da',
                              color: category.isActive ? '#155724' : '#721c24',
                              fontSize: '0.85em',
                              fontWeight: 'bold',
                              display: 'inline-block',
                              minWidth: '80px',
                              textAlign: 'center'
                            }}
                          >
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleEditCategory(category)}
                              style={{
                                ...styles.button,
                                ...styles.editButton,
                                padding: '6px 12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                fontSize: '12px',
                              }}
                              disabled={isLoading}
                            >
                              <FaEdit size={14} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id || category._id)}
                              style={{
                                ...styles.button,
                                ...styles.deleteButton,
                                padding: '6px 12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                fontSize: '12px',
                              }}
                              disabled={isLoading}
                            >
                              <FaTrash size={14} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
