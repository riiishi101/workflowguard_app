// Mock data for development and testing
export const mockWorkflows = [
  {
    id: '1',
    name: 'Lead Nurturing Campaign',
    hubspotId: '12345',
    ownerId: 'user1',
    isLive: true,
    lastModified: new Date('2024-07-20T10:30:00Z'),
    createdAt: new Date('2024-07-15T09:00:00Z'),
    updatedAt: new Date('2024-07-20T10:30:00Z'),
    versions: [
      {
        id: 'v1',
        version: 1,
        name: 'Initial Setup',
        description: 'Basic lead nurturing workflow',
        createdAt: new Date('2024-07-15T09:00:00Z'),
        isActive: false,
      },
      {
        id: 'v2',
        version: 2,
        name: 'Enhanced Nurturing',
        description: 'Improved with better segmentation',
        createdAt: new Date('2024-07-20T10:30:00Z'),
        isActive: true,
      }
    ]
  },
  {
    id: '2',
    name: 'Customer Onboarding',
    hubspotId: '12346',
    ownerId: 'user1',
    isLive: true,
    lastModified: new Date('2024-07-19T14:20:00Z'),
    createdAt: new Date('2024-07-10T11:00:00Z'),
    updatedAt: new Date('2024-07-19T14:20:00Z'),
    versions: [
      {
        id: 'v3',
        version: 1,
        name: 'Basic Onboarding',
        description: 'Standard customer onboarding process',
        createdAt: new Date('2024-07-10T11:00:00Z'),
        isActive: true,
      }
    ]
  },
  {
    id: '3',
    name: 'Sales Follow-up',
    hubspotId: '12347',
    ownerId: 'user1',
    isLive: false,
    lastModified: new Date('2024-07-18T16:45:00Z'),
    createdAt: new Date('2024-07-12T13:00:00Z'),
    updatedAt: new Date('2024-07-18T16:45:00Z'),
    versions: [
      {
        id: 'v4',
        version: 1,
        name: 'Sales Follow-up v1',
        description: 'Automated sales follow-up sequence',
        createdAt: new Date('2024-07-12T13:00:00Z'),
        isActive: true,
      }
    ]
  }
];

export const mockAnalytics = {
  totalWorkflows: 15,
  activeWorkflows: 12,
  totalContacts: 2450,
  activeContacts: 1890,
  workflowChanges: 47,
  rollbacks: 3,
  syncErrors: 1,
  trends: {
    workflowsCreated: [5, 8, 12, 15],
    contactsAdded: [120, 180, 220, 245],
    changesMade: [12, 18, 25, 47],
  },
  topWorkflows: [
    { name: 'Lead Nurturing Campaign', contacts: 890, changes: 12 },
    { name: 'Customer Onboarding', contacts: 650, changes: 8 },
    { name: 'Sales Follow-up', contacts: 420, changes: 15 },
  ]
};

export const mockUser = {
  id: 'user1',
  email: 'demo@workflowguard.pro',
  name: 'Demo User',
  hubspotPortalId: null,
  plan: {
    id: 'professional',
    name: 'Professional',
    maxWorkflows: 500,
    historyDays: 90,
  },
  createdAt: new Date('2024-07-01T00:00:00Z'),
  updatedAt: new Date('2024-07-20T00:00:00Z'),
};

export const mockNotifications = [
  {
    id: '1',
    type: 'workflow_updated',
    title: 'Workflow Updated',
    message: 'Lead Nurturing Campaign was updated',
    timestamp: new Date('2024-07-20T10:30:00Z'),
    read: false,
  },
  {
    id: '2',
    type: 'sync_completed',
    title: 'Sync Completed',
    message: 'All workflows synced successfully',
    timestamp: new Date('2024-07-20T09:15:00Z'),
    read: true,
  },
  {
    id: '3',
    type: 'rollback_performed',
    title: 'Rollback Performed',
    message: 'Customer Onboarding rolled back to version 1',
    timestamp: new Date('2024-07-19T16:20:00Z'),
    read: true,
  }
];

export const mockAuditLog = [
  {
    id: '1',
    action: 'workflow_created',
    entityType: 'workflow',
    entityId: '1',
    userId: 'user1',
    details: { workflowName: 'Lead Nurturing Campaign' },
    timestamp: new Date('2024-07-15T09:00:00Z'),
  },
  {
    id: '2',
    action: 'workflow_updated',
    entityType: 'workflow',
    entityId: '1',
    userId: 'user1',
    details: { version: 2, changes: 'Enhanced segmentation' },
    timestamp: new Date('2024-07-20T10:30:00Z'),
  },
  {
    id: '3',
    action: 'rollback_performed',
    entityType: 'workflow',
    entityId: '2',
    userId: 'user1',
    details: { fromVersion: 2, toVersion: 1 },
    timestamp: new Date('2024-07-19T16:20:00Z'),
  }
];

export const mockSyncStatus = [
  {
    workflowId: '1',
    workflowName: 'Lead Nurturing Campaign',
    hubspotId: '12345',
    status: 'synced',
    lastSyncAt: new Date('2024-07-20T10:30:00Z'),
    nextSyncAt: new Date('2024-07-20T11:30:00Z'),
  },
  {
    workflowId: '2',
    workflowName: 'Customer Onboarding',
    hubspotId: '12346',
    status: 'syncing',
    lastSyncAt: new Date('2024-07-20T09:15:00Z'),
    progress: 75,
  },
  {
    workflowId: '3',
    workflowName: 'Sales Follow-up',
    hubspotId: '12347',
    status: 'outdated',
    lastSyncAt: new Date('2024-07-18T16:45:00Z'),
    nextSyncAt: new Date('2024-07-20T16:45:00Z'),
  }
];

export const mockBillingData = {
  currentPlan: {
    id: 'professional',
    name: 'Professional',
    price: 99,
    billingCycle: 'monthly',
    nextBillingDate: new Date('2024-08-01T00:00:00Z'),
  },
  usage: {
    workflowsUsed: 15,
    workflowsLimit: 500,
    storageUsed: 250,
    storageLimit: 1000,
    apiCallsUsed: 450,
    apiCallsLimit: 1000,
  },
  history: [
    {
      id: '1',
      amount: 99,
      status: 'paid',
      date: new Date('2024-07-01T00:00:00Z'),
      description: 'Professional Plan - Monthly',
    },
    {
      id: '2',
      amount: 99,
      status: 'paid',
      date: new Date('2024-06-01T00:00:00Z'),
      description: 'Professional Plan - Monthly',
    }
  ]
};

export const mockWebhooks = [
  {
    id: '1',
    name: 'Slack Notifications',
    url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
    events: ['workflow_updated', 'rollback_performed'],
    isActive: true,
    createdAt: new Date('2024-07-10T00:00:00Z'),
  },
  {
    id: '2',
    name: 'Email Alerts',
    url: 'https://api.example.com/webhooks/email',
    events: ['sync_error', 'usage_warning'],
    isActive: true,
    createdAt: new Date('2024-07-15T00:00:00Z'),
  }
];

export const mockApiKeys = [
  {
    id: '1',
    name: 'Production API Key',
    key: 'wg_live_1234567890abcdef',
    permissions: ['read', 'write'],
    lastUsed: new Date('2024-07-20T08:30:00Z'),
    createdAt: new Date('2024-07-01T00:00:00Z'),
  },
  {
    id: '2',
    name: 'Development API Key',
    key: 'wg_dev_abcdef1234567890',
    permissions: ['read'],
    lastUsed: new Date('2024-07-19T14:20:00Z'),
    createdAt: new Date('2024-07-10T00:00:00Z'),
  }
];

// Helper function to check if mock mode is enabled
export const isMockMode = () => {
  return import.meta.env.VITE_DEV_MODE === 'true' || 
         import.meta.env.VITE_API_URL?.includes('localhost');
};

// Helper function to get mock data with delay simulation
export const getMockData = async <T>(data: T, delay: number = 500): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}; 