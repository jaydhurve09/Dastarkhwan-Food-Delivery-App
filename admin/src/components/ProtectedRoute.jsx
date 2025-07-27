import { Navigate, Outlet } from 'react-router-dom';
import { getToken } from '../services/authService';

const ProtectedRoute = () => {
  const token = getToken();
  
  if (!token) {
    // If there's no token, redirect to login
    return <Navigate to="/admin/login" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
