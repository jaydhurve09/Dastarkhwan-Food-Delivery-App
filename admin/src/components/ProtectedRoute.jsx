import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/authService';
import { useEffect, useState } from 'react';

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      const token = authService.getAuthToken();
      
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      
      // Check if token is expired
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
  }, []);
  
  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Or a proper loading component
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
