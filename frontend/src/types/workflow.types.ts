export interface WorkflowTypes {
  DashboardWorkflow: {
    id: string;
    name: string;
    versions: number;
    lastModifiedBy: {
      name: string;
      initials: string;
      email: string;
    };
    status: "active" | "inactive" | "error";
    protectionStatus: "protected" | "unprotected" | "error";
    lastModified: string;
  };

  DashboardStats: {
    totalWorkflows: number;
    activeWorkflows: number;
    protectedWorkflows: number;
    totalVersions: number;
    uptime: number;
    lastSnapshot: string;
    planCapacity: number;
    planUsed: number;
  };

  WorkflowVersion: {
    id: string;
    version: number;
    createdAt: string;
    createdBy: {
      name: string;
      email: string;
    };
    changes: {
      type: string;
      description: string;
      field?: string;
      oldValue?: any;
      newValue?: any;
    }[];
    steps: any[];
  };

  WorkflowError: {
    workflowId: string;
    message: string;
    timestamp: string;
  };
}
