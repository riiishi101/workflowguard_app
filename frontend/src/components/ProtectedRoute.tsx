import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useWorkflows } from '@/contexts/WorkflowContext';
import LoadingSpinner from './ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireHubSpot?: boolean;
  requireWorkflows?: boolean;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireHubSpot = false,
  requireWorkflows = false,
  fallbackPath = '/',
}) => {
  const { user, loading: authLoading } = useAuth();
  const { workflowsLoading } = useWorkflows();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check HubSpot connection requirement
  if (requireHubSpot && user && !user.hubspotPortalId) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check workflows requirement
  if (requireWorkflows && workflowsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
};

// Specific route protection components
export const AuthRequired: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true}>
    {children}
  </ProtectedRoute>
);

export const HubSpotRequired: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true} requireHubSpot={true}>
    {children}
  </ProtectedRoute>
);

export const WorkflowsRequired: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true} requireHubSpot={true} requireWorkflows={true}>
    {children}
  </ProtectedRoute>
); 