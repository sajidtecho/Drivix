import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';

const AdminRoute = () => {
  const { user, loading, isAuthenticated } = useUser();

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--bg-primary)'
      }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>Verifying admin access...</h2>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
