import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useWorkflows, useWorkflowVersions } from '@/contexts/WorkflowContext';
import { useAuth } from './AuthContext';
import LoadingSpinner from './ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

interface WorkflowRouteProps {
  children: React.ReactNode;
  requireVersions?: boolean;
}

export const WorkflowRoute: React.FC<WorkflowRouteProps> = ({ 
  children, 
  requireVersions = false 
}) => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const { user } = useAuth();
  const { getWorkflowById, workflowsLoading } = useWorkflows();
  const { data: versions, isLoading: versionsLoading } = useWorkflowVersions(workflowId || '');
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const validateWorkflowAccess = async () => {
      if (!workflowId) {
        setHasAccess(false);
        setIsValidating(false);
        return;
      }

      try {
        // Check if workflow exists and user has access
        const workflow = getWorkflowById(workflowId);
        
        if (!workflow) {
          toast({
            title: 'Workflow Not Found',
            description: 'The requested workflow could not be found.',
            variant: 'destructive',
          });
          setHasAccess(false);
          setIsValidating(false);
          return;
        }

        // Check if user owns the workflow
        if (workflow.ownerId !== user?.id) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this workflow.',
            variant: 'destructive',
          });
          setHasAccess(false);
          setIsValidating(false);
          return;
        }

        // If versions are required, check if they exist
        if (requireVersions && (!versions || versions.length === 0)) {
          toast({
            title: 'No Versions Found',
            description: 'This workflow has no version history yet.',
            variant: 'default',
          });
          setHasAccess(false);
          setIsValidating(false);
          return;
        }

        setHasAccess(true);
      } catch (error) {
        console.error('Error validating workflow access:', error);
        toast({
          title: 'Validation Error',
          description: 'Failed to validate workflow access.',
          variant: 'destructive',
        });
        setHasAccess(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateWorkflowAccess();
  }, [workflowId, user?.id, getWorkflowById, requireVersions, versions, toast]);

  // Show loading while validating
  if (isValidating || workflowsLoading || (requireVersions && versionsLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect if no access
  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Specific workflow route components
export const WorkflowHistoryRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <WorkflowRoute requireVersions={true}>
    {children}
  </WorkflowRoute>
);

export const WorkflowEditRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <WorkflowRoute requireVersions={false}>
    {children}
  </WorkflowRoute>
); 