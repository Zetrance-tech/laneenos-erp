import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthFeature: React.FC = () => {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  // Show a loading state while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!token || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Render the layout with child routes if authenticated
  return (
    <div className="account-page">
      <div className="main-wrapper">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthFeature;