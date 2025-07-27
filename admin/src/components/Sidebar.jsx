import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';
import logo from '../assets/dastarkhwanlogo.png';

import {
  FaTachometerAlt,
  FaUsers,
  FaConciergeBell,
  FaTruck,
  FaFileInvoiceDollar,
  FaTags,
  FaCommentDots,
  FaFileAlt,
  FaBell,
  FaUserTie,
  FaUserCog,
} from 'react-icons/fa';

export default function Sidebar() {
  const location = useLocation();
  
  // Helper function to determine if a link is active
  const isActive = (path, exact = false) => {
    return exact 
      ? location.pathname === path
      : location.pathname.startsWith(path);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Dastarkhwan Logo" className="logo" />
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? 'active' : ''}
              end
            >
              <FaTachometerAlt />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/users" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <FaUsers />
              <span>User Management</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/restaurants" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <FaConciergeBell />
              <span>Restaurant Monitoring and Approval</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/delivery-partners" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <FaUserTie />
              <span>Delivery Partner Management</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/orders" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <FaTruck />
              <span>Orders & Delivery</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/payment" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <FaFileInvoiceDollar />
              <span>Payment Commission Report</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/promo" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <FaTags />
              <span>Promo Code Management</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/admin/feedback" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <FaCommentDots />
              <span>Feedback & Complaints</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/admin/cms" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <FaFileAlt />
              <span>CMS Management</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/admin/notifications" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <FaBell />
              <span>Push Notification System</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/admin/settings" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <FaUserCog />
              <span>Admin Profile & Roles</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}
