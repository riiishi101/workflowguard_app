import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { WorkflowsSchema, DashboardWorkflow } from '@/types/dashboard.schemas';

interface UseWorkflowsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useWorkflows(options: UseWorkflowsOptions = {}) {
  const { autoRefresh = true, refreshInterval = 30000 } = options;
  const [workflows, setWorkflows] = useState<DashboardWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchWorkflows = useCallback(async (showToast = false) => {
    try {
      const response = await ApiService.getProtectedWorkflows();
      
      if (response.success && response.data) {
        const validationResult = WorkflowsSchema.safeParse(response.data);
        if (validationResult.success) {
          setWorkflows(validationResult.data);
          if (showToast) {
            toast({
              title: "Workflows Updated",
              description: "Your workflow list has been refreshed.",
            });
          }
        } else {
          console.error("Dashboard data validation error:", validationResult.error.flatten());
          const errorMessage = "Received invalid data from the server.";
          setError(errorMessage);
          toast({
            title: "Data Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } else if (!response.success) {
        setError(response.error || 'An unknown error occurred');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Update Failed",
        description: "Failed to refresh workflows. Will retry automatically.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Set up auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchWorkflows(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchWorkflows]);

  // Initial fetch
  useEffect(() => {
    fetchWorkflows(false);
  }, [fetchWorkflows]);

  return {
    workflows,
    loading,
    error,
    refetch: fetchWorkflows,
  };
}
