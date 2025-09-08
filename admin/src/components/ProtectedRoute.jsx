import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/authService';
import { useEffect, useState } from 'react';

const ProtectedRoute = () => {
  const [authState, setAuthState] = useState('checking');
  
  useEffect(() => {
    const checkAuth = () => {
      console.log('=== ProtectedRoute: Starting auth check ===');
      console.log('LocalStorage adminToken:', localStorage.getItem('adminToken'));
      console.log('LocalStorage adminUser:', localStorage.getItem('adminUser'));
      
      const token = authService.getAuthToken();
      console.log('ProtectedRoute: Token from authService:', token);
      console.log('ProtectedRoute: Token exists:', !!token);
      
      // If no token, set as unauthenticated immediately
      if (!token) {
        console.log('ProtectedRoute: No token found, setting unauthenticated');
        setAuthState('unauthenticated');
        return;
      }
      
      // Check if token is expired
      let isExpired;
      try {
        isExpired = authService.isTokenExpired(token);
        console.log('ProtectedRoute: Token expired:', isExpired);
      } catch (error) {
        console.error('ProtectedRoute: Error checking token expiration:', error);
        isExpired = true;
      }
      
      if (isExpired) {
        // Clear the expired token synchronously and set as unauthenticated
        console.log('ProtectedRoute: Token expired, clearing storage');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setAuthState('unauthenticated');
      } else {
        console.log('ProtectedRoute: Token valid, setting authenticated');
        setAuthState('authenticated');
      }
      console.log('=== ProtectedRoute: Auth check completed ===');
    };
    
    // Use setTimeout to ensure this runs after the component mounts
    const timeoutId = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  console.log('ProtectedRoute: Current auth state:', authState);
  
  // Show loading state only while checking authentication
  if (authState === 'checking') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (authState === 'unauthenticated') {
    console.log('ProtectedRoute: Redirecting to login');
    return <Navigate to="/admin/login" replace />;
  }
  
  // If authenticated, render the child routes
  console.log('ProtectedRoute: Rendering protected content');
  return <Outlet />;
};

export default ProtectedRoute;
