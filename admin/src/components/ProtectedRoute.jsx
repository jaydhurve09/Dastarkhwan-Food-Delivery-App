import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/authService';
import { useEffect, useState } from 'react';

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const token = authService.getAuthToken();
  
  // If no token, immediately redirect to login
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  
  useEffect(() => {
    const checkAuth = async () => {
      // At this point we know token exists, now check if it's expired
      const isExpired = authService.isTokenExpired(token);
      
      if (isExpired) {
        // Clear the expired token
        await authService.logout();
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    };
    
    checkAuth();
  }, [token]);
  
  // Show loading state only while checking token validity
  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Consider replacing with a proper loading component
  }
  
  // If token check completed and not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
