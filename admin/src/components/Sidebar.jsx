import React from 'react';
import { NavLink } from 'react-router-dom';
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
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Dastarkhwan Logo" className="logo" />
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/" exact="true" activeClassName="active">
              <FaTachometerAlt />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/users" activeClassName="active">
              <FaUsers />
              <span>User Management</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/restaurants" activeClassName="active">
              <FaConciergeBell />
              <span>Restaurant Monitoring and Approval</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/delivery-partners" activeClassName="active">
              <FaUserTie />
              <span>Delivery Partner Management</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/orders" activeClassName="active">
              <FaTruck />
              <span>Orders & Delivery</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/payment" activeClassName="active">
              <FaFileInvoiceDollar />
              <span>Payment Commission Report</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/promo" activeClassName="active">
              <FaTags />
              <span>Promo Code Management</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/feedback" activeClassName="active">
              <FaCommentDots />
              <span>Feedback & Complaints</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/cms" activeClassName="active">
              <FaFileAlt />
              <span>CMS Management</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/notifications" activeClassName="active">
              <FaBell />
              <span>Push Notification System</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/settings" activeClassName="active">
              <FaUserCog />
              <span>Admin Profile & Roles</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}
