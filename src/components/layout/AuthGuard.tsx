import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

type AuthGuardProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
};

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Debug logging
    if (requireAdmin) {
      console.log("AuthGuard (requireAdmin=true):", { 
        isLoading, 
        isAuthenticated: !!user, 
        isAdmin,
        pathname: location.pathname
      });
    }
  }, [isLoading, user, isAdmin, requireAdmin, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    console.log("User not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    console.log("Admin access required but user is not admin, redirecting to unauthorized");
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}