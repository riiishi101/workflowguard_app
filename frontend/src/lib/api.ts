import axios, { AxiosResponse } from 'axios';

// API base URL
// API base URL - Hardcoded to ensure the /api prefix is always present
const API_BASE_URL = 'https://api.workflowguard.pro/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear token for auth endpoints
      if (error.config.url?.includes('/auth')) {
        localStorage.removeItem('token');
      }
      // Don't clear token for non-auth endpoints to avoid infinite loops
    }
    
    // Handle trial expiration
    if (error.response?.status === 403 && error.response?.data?.message?.includes('Trial expired')) {
      // Redirect to settings for trial expired users
      window.location.href = '/settings';
    }

    // Handle subscription cancellation
    if (error.response?.status === 403 && error.response?.data?.message?.includes('Subscription cancelled')) {
      // Redirect to settings for cancelled subscription users
      window.location.href = '/settings';
    }

    // Handle subscription expiration
    if (error.response?.status === 403 && error.response?.data?.message?.includes('Subscription expired')) {
      // Redirect to settings for expired subscription users
      window.location.href = '/settings';
    }

    // Handle payment failure
    if (error.response?.status === 403 && error.response?.data?.message?.includes('Payment failed')) {
      // Redirect to settings for payment failed users
      window.location.href = '/settings';
    }
    
    return Promise.reject(error);
  }
);

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface WorkflowHistoryVersion {
  id: string;
  workflowId: string;
  versionNumber: number;
  date: string;
  type: string;
  initiator: string;
  notes: string;
  changes: {
    added: number;
    modified: number;
    removed: number;
  };
  status: string;
}

export interface ProtectedWorkflow {
  id: string;
  name: string;
  status: string;
  protectionStatus: string;
  lastModified: string;
  versions: number;
  lastModifiedBy: {
    name: string;
    initials: string;
    email: string;
  };
}

class ApiService {
  static async login(email: string, password: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async register(userData: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getCurrentUser(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getProtectedWorkflows(userId?: string): Promise<ApiResponse<ProtectedWorkflow[]>> {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (userId) {
      headers['x-user-id'] = userId;
    }

    try {
      const response = await apiClient.get('/workflow/protected', { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getWorkflowHistory(workflowId: string): Promise<ApiResponse<WorkflowHistoryVersion[]>> {
    try {
      // First try with HubSpot ID endpoint (for workflows from WorkflowSelection)
      const response = await apiClient.get(`/workflow-version/by-hubspot-id/${workflowId}/history`);
      return response.data;
    } catch (error: any) {
      // If HubSpot ID endpoint fails, try original endpoint (for internal IDs)
      try {
        const fallbackResponse = await apiClient.get(`/workflow-version/${workflowId}/history`);
        return fallbackResponse.data;
      } catch (fallbackError: any) {
        // If both fail, throw the original error with more context
        console.error('Failed to fetch workflow history with both HubSpot ID and internal ID:', {
          workflowId,
          hubspotError: error.response?.data || error.message,
          internalError: fallbackError.response?.data || fallbackError.message
        });
        throw new Error(`Workflow history not found: Unable to locate workflow history for ID ${workflowId}`);
      }
    }
  }

  static async getWorkflowDetails(workflowId: string): Promise<ApiResponse<any>> {
    try {
      // First try with HubSpot ID endpoint (for workflows from WorkflowSelection)
      const response = await apiClient.get(`/workflow/by-hubspot-id/${workflowId}`);
      return response.data;
    } catch (error: any) {
      // If HubSpot ID endpoint fails, try original endpoint (for internal IDs)
      try {
        const fallbackResponse = await apiClient.get(`/workflow/${workflowId}`);
        return fallbackResponse.data;
      } catch (fallbackError: any) {
        // If both fail, throw the original error with more context
        console.error('Failed to fetch workflow details with both HubSpot ID and internal ID:', {
          workflowId,
          hubspotError: error.response?.data || error.message,
          internalError: fallbackError.response?.data || fallbackError.message
        });
        throw new Error(`Workflow not found: Unable to locate workflow with ID ${workflowId}`);
      }
    }
  }

  static async rollbackWorkflow(workflowId: string, versionId?: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post(`/workflow/${workflowId}/rollback${versionId ? `/${versionId}` : ''}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async restoreWorkflowVersion(workflowId: string, versionId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post(`/workflow/${workflowId}/restore/${versionId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async downloadWorkflowVersion(workflowId: string, versionId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`/workflow/${workflowId}/version/${versionId}/download`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getComparisonData(workflowId: string, versionAId: string, versionBId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`/workflow/${workflowId}/compare/${versionAId}/${versionBId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async compareWorkflowVersions(workflowId: string, versionA: string, versionB: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`/workflow/${workflowId}/compare/${versionA}/${versionB}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getWorkflowVersionsForComparison(workflowId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`/workflow/${workflowId}/versions`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async startWorkflowProtection(selectedWorkflowObjects: any[]): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/workflow/start-protection', {
        workflows: selectedWorkflowObjects
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getHubSpotWorkflows(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/workflow/hubspot');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async syncHubSpotWorkflows(): Promise<ApiResponse<any>> {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await apiClient.post('/workflow/sync-hubspot', {}, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async createAutomatedBackup(workflowId: string): Promise<ApiResponse<any>> {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await apiClient.post(`/workflow/${workflowId}/automated-backup`, {}, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async createChangeNotification(workflowId: string, changes: any): Promise<ApiResponse<any>> {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await apiClient.post(`/workflow/${workflowId}/change-notification`, changes, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async createApprovalRequest(workflowId: string, requestedChanges: any): Promise<ApiResponse<any>> {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await apiClient.post(`/workflow/${workflowId}/approval-request`, requestedChanges, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async generateComplianceReport(workflowId: string, startDate: string, endDate: string): Promise<ApiResponse<any>> {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await apiClient.get(`/workflow/${workflowId}/compliance-report?startDate=${startDate}&endDate=${endDate}`, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // AI Support Methods
  static async diagnoseIssue(description: string): Promise<ApiResponse<any>> {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await apiClient.post('/support/diagnose', { description }, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async fixRollbackIssue(): Promise<ApiResponse<any>> {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await apiClient.post('/support/fix-rollback', {}, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async fixSyncIssue(): Promise<ApiResponse<any>> {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await apiClient.post('/support/fix-sync', {}, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async fixAuthIssue(): Promise<ApiResponse<any>> {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await apiClient.post('/support/fix-auth', {}, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async fixDataIssue(): Promise<ApiResponse<any>> {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await apiClient.post('/support/fix-data', {}, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async optimizePerformance(): Promise<ApiResponse<any>> {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await apiClient.post('/support/optimize-performance', {}, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getHubSpotAuthUrl(isMarketplace: boolean = false): Promise<ApiResponse<{ url: string }>> {
    try {
      const response = await apiClient.get('/auth/hubspot/url', {
        params: {
          marketplace: isMarketplace.toString(),
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getDashboardStats(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // User management
  static async updateProfile(userData: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put('/user/profile', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateUserProfile(userData: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put('/user/profile', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async disconnectHubSpot(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/user/disconnect-hubspot');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async deleteAccount(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete('/user/account');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getUserProfile(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/user/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getUsers(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/users');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async verifyEmail(email: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/user/verify-email', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async uploadAvatar(formData: FormData): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async removeAvatar(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete('/user/avatar');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getNotificationSettings(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/user/notification-settings');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateNotificationSettings(settings: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put('/user/notification-settings', settings);
      return response.data;
    } catch (error) {
      throw error;
    }
  }



  static async getAuditLogs(filters?: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/audit-logs', { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async exportAuditLogs(filters?: any): Promise<ApiResponse<any>> {
    try {
      // Backend expects POST /audit-logs/export with filters in body
      const response = await apiClient.post('/audit-logs/export', filters || {});
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getApiKeys(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/user/api-keys');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async createApiKey(apiKeyData: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/user/api-keys', apiKeyData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async deleteApiKey(keyId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete(`/user/api-keys/${keyId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }



  // Subscription and billing
  static async getSubscription(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/subscription');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getTrialStatus(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/subscription/trial-status');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getExpirationStatus(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/subscription/expiration-status');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getNextPaymentInfo(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/subscription/next-payment');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getUsageStats(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/subscription/usage');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateSubscription(planId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/subscription/update', { planId });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Support tickets
  static async createSupportTicket(ticketData: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/support/tickets', ticketData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getSupportTickets(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/support/tickets');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Enterprise Analytics APIs
  static async getUserAnalytics(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await apiClient.get(`/analytics/user?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }



  // Webhook Management APIs
  static async getUserWebhooks(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/webhooks');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async createWebhook(webhookData: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/webhooks', webhookData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateWebhook(webhookId: string, webhookData: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put(`/webhooks/${webhookId}`, webhookData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async deleteWebhook(webhookId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete(`/webhooks/${webhookId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Advanced Enterprise Features
  static async getWorkflowAnalytics(workflowId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`/workflow/${workflowId}/analytics`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getPerformanceMetrics(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/analytics/performance');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getComplianceMetrics(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/analytics/compliance');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getSystemHealth(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/system/health');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getCacheStats(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/system/cache-stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getEnterpriseReport(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/enterprise/report', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async exportDashboardData(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/dashboard/export');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async exportWorkflow(workflowId?: string): Promise<ApiResponse<any>> {
    try {
      const endpoint = workflowId ? `/workflow/${workflowId}/export` : '/workflow/export-all';
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export { ApiService };
export default ApiService;