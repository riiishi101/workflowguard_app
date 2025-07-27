import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import apiService from '@/services/api';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Types
export interface Workflow {
  id: string;
  name: string;
  hubspotId: string;
  ownerId: string;
  createdAt?: string;
  updatedAt?: string;
  folder?: string;
  status?: string;
  autoSync?: boolean;
  syncInterval?: number;
  notificationsEnabled?: boolean;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  snapshotType: string;
  createdBy: string;
  createdAt: string;
  data: any;
  description?: string;
  selected?: boolean;
}

export interface WorkflowWithVersions extends Workflow {
  versions: WorkflowVersion[];
}

// Context interface
interface WorkflowContextType {
  // Queries
  workflows: Workflow[] | undefined;
  workflowsLoading: boolean;
  workflowsError: Error | null;
  
  // Mutations
  selectWorkflows: (workflowIds: string[]) => Promise<void>;
  addWorkflow: (workflow: Partial<Workflow>) => Promise<void>;
  deleteWorkflow: (workflowId: string) => Promise<void>;
  updateWorkflow: (workflowId: string, updates: Partial<Workflow>) => Promise<void>;
  
  // Real-time
  isConnected: boolean;
  lastUpdate: Date | null;
  
  // Utilities
  refetchWorkflows: () => void;
  getWorkflowById: (id: string) => Workflow | undefined;
  getWorkflowVersions: (workflowId: string) => WorkflowVersion[] | undefined;
}

// Create context
const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

// Provider component
export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // WebSocket connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io('/workflows', {
      auth: {
        token: localStorage.getItem('authToken') || user.id
      }
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected for workflows');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('workflow_updated', (data: { workflowId: string; changes: Partial<Workflow> }) => {
      console.log('Workflow updated via WebSocket:', data);
      setLastUpdate(new Date());
      
      // Update the specific workflow in cache
      queryClient.setQueryData(['workflows'], (old: Workflow[] | undefined) => {
        if (!old) return old;
        return old.map(w => 
          w.id === data.workflowId ? { ...w, ...data.changes } : w
        );
      });

      toast({
        title: 'Workflow Updated',
        description: `Workflow "${data.changes.name || 'Unknown'}" has been updated`,
        variant: 'default',
      });
    });

    newSocket.on('workflow_version_created', (data: { workflowId: string; version: WorkflowVersion }) => {
      console.log('New workflow version created:', data);
      setLastUpdate(new Date());
      
      // Invalidate workflow versions query
      queryClient.invalidateQueries({ queryKey: ['workflow-versions', data.workflowId] });
      
      toast({
        title: 'New Version Created',
        description: `A new version has been created for workflow`,
        variant: 'default',
      });
    });

    newSocket.on('workflow_sync_error', (data: { workflowId: string; error: string }) => {
      console.error('Workflow sync error:', data);
      
      toast({
        title: 'Sync Error',
        description: `Failed to sync workflow: ${data.error}`,
        variant: 'destructive',
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, queryClient, toast]);

  // Queries
  const {
    data: workflows = [],
    isLoading: workflowsLoading,
    error: workflowsError,
    refetch: refetchWorkflows
  } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      try {
        const data = await apiService.getWorkflows();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Failed to fetch workflows:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user,
  });

  // Mutations
  const selectWorkflowsMutation = useMutation({
    mutationFn: async (workflowIds: string[]) => {
      await apiService.setMonitoredWorkflows(workflowIds);
    },
    onSuccess: (_, workflowIds) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: 'Workflows Selected',
        description: `${workflowIds.length} workflows are now being monitored`,
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Selection Failed',
        description: 'Failed to select workflows. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const addWorkflowMutation = useMutation({
    mutationFn: async (workflow: Partial<Workflow>) => {
      return await apiService.createWorkflow(workflow as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: 'Workflow Added',
        description: 'Workflow has been added successfully',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Add Failed',
        description: 'Failed to add workflow. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      await apiService.deleteWorkflow(workflowId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: 'Workflow Deleted',
        description: 'Workflow has been deleted successfully',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete workflow. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ workflowId, updates }: { workflowId: string; updates: Partial<Workflow> }) => {
      return await apiService.updateWorkflow(workflowId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: 'Workflow Updated',
        description: 'Workflow has been updated successfully',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update workflow. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Utility functions
  const getWorkflowById = (id: string): Workflow | undefined => {
    return workflows.find(w => w.id === id);
  };

  const getWorkflowVersions = (workflowId: string): WorkflowVersion[] | undefined => {
    return queryClient.getQueryData(['workflow-versions', workflowId]);
  };

  const selectWorkflows = async (workflowIds: string[]) => {
    await selectWorkflowsMutation.mutateAsync(workflowIds);
  };

  const addWorkflow = async (workflow: Partial<Workflow>) => {
    await addWorkflowMutation.mutateAsync(workflow);
  };

  const deleteWorkflow = async (workflowId: string) => {
    await deleteWorkflowMutation.mutateAsync(workflowId);
  };

  const updateWorkflow = async (workflowId: string, updates: Partial<Workflow>) => {
    await updateWorkflowMutation.mutateAsync({ workflowId, updates });
  };

  const value: WorkflowContextType = {
    // Queries
    workflows,
    workflowsLoading,
    workflowsError,
    
    // Mutations
    selectWorkflows,
    addWorkflow,
    deleteWorkflow,
    updateWorkflow,
    
    // Real-time
    isConnected,
    lastUpdate,
    
    // Utilities
    refetchWorkflows,
    getWorkflowById,
    getWorkflowVersions,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};

// Hook to use the context
export const useWorkflows = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflows must be used within a WorkflowProvider');
  }
  return context;
};

// Hook for workflow versions
export const useWorkflowVersions = (workflowId: string) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['workflow-versions', workflowId],
    queryFn: async () => {
      const versions = await apiService.getWorkflowVersions(workflowId);
      return Array.isArray(versions) ? versions : [];
    },
    enabled: !!workflowId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for workflow comparison
export const useWorkflowComparison = (version1Id: string, version2Id: string) => {
  return useQuery({
    queryKey: ['workflow-comparison', version1Id, version2Id],
    queryFn: async () => {
      return await apiService.compareVersions(version1Id, version2Id);
    },
    enabled: !!version1Id && !!version2Id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}; 