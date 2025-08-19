import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UseWorkflowsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useWorkflows(options: UseWorkflowsOptions = {}) {
  const { autoRefresh = true, refreshInterval = 30000 } = options;
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchWorkflows = useCallback(async (showToast = false) => {
    try {
      const response = await ApiService.getProtectedWorkflows();
      
      if (response.success && response.data) {
        setWorkflows(response.data);
        if (showToast) {
          toast({
            title: "Workflows Updated",
            description: "Your workflow list has been refreshed.",
          });
        }
      }
    } catch (err) {
      setError(err.message);
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
