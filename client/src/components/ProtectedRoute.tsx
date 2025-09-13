import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        navigate('/login');
      } else if (userProfile?.isDisabled) {
        // User is disabled, redirect to login with message
        navigate('/login?disabled=true');
      } else if (adminOnly && currentUser.email !== 'admin@monlyking.com') {
        navigate('/');
      }
    }
  }, [currentUser, userProfile, loading, adminOnly, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser || userProfile?.isDisabled || (adminOnly && currentUser.email !== 'admin@monlyking.com')) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
