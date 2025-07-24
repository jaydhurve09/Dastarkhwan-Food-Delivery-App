// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import OrdersDelivery from './pages/OrdersDelivery';
import PaymentReport from './pages/PaymentReport';
import PromoCode from './pages/PromoCode';
import RestaurantMonitoring from './pages/RestaurantMonitoring';
import CMSManagement from './pages/CMSManagement';
import AdminSettings from './pages/AdminSettings';
import Notification from './pages/Notification';
import FeedbackAndComplaints from './pages/FeedbackAndComplaints';
import DeliveryPartnerManagement from './pages/DeliveryPartnerManagement';
import AdminLogin from './pages/AdminLogin';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Public Routes */}
          <Route path="/admin/login" element={<AdminLogin />}  />
          
          {/* Protected Routes - Show Sidebar */}
          <Route element={
            <>
              <Sidebar />
              <div className="main-content">
                <Outlet />
              </div>
            </>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/orders" element={<OrdersDelivery />} />
            <Route path="/payment" element={<PaymentReport />} />
            <Route path="/promo" element={<PromoCode />} />
            <Route path="/restaurants" element={<RestaurantMonitoring />} />
            <Route path="/admin/cms" element={<CMSManagement />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/feedback" element={<FeedbackAndComplaints />} />
            <Route path="/admin/notifications" element={<Notification />} />
            <Route path="/delivery-partners" element={<DeliveryPartnerManagement />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;