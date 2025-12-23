import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('adminToken');

  console.log('🟠 [ProtectedRoute] Check:', {
    hasToken: !!token,
    tokenLength: token?.length,
    currentPath: location.pathname,
    from: location.state?.from
  });

  // If no token, redirect to login
  if (!token) {
    console.warn('🟡 [ProtectedRoute] No token found - redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('🟢 [ProtectedRoute] Token found - allowing access');
  return children;
};

export default ProtectedRoute;

