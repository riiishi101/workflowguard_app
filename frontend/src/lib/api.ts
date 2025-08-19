import axios from 'axios';
import { getToken, removeToken, TOKEN_KEY } from '../utils/tokenUtils';
import { API_CONFIG } from '../config/environment';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Import error handling utilities
import { ErrorType, parseApiError } from '../utils/errorUtils';

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Parse the error to standardize format
    const parsedError = parseApiError(error);
    
    if (error.response?.status === 401) {
      // Clear token for auth endpoints
      if (error.config.url?.includes('/auth')) {
        removeToken();
      }
      // Don't clear token for non-auth endpoints to avoid infinite loops
    }
    
    // Handle subscription-related 403 errors
    if (error.response?.status === 403) {
      const message = error.response?.data?.message || '';
      if (/Trial expired|Subscription cancelled|Subscription expired|Payment failed/i.test(message)) {
        window.location.href = '/settings';
      }
    }
    
    // Log all API errors with consistent format
    console.error(`API Error (${parsedError.type}):`, {
      url: error.config?.url,
      method: error.config?.method,
      status: parsedError.status,
      message: parsedError.message
    });
    
    return Promise.reject(error);
  }
);

export interface ApiResponse<T = unknown> {
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

export interface RegisterUserData {
  email: string;
  password: string;
  name: string;
  [key: string]: any;
}

export interface UserProfileData {
  name?: string;
  email?: string;
  [key: string]: any;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions?: string[];
  [key: string]: any;
}

export interface SupportTicketData {
  subject: string;
  description: string;
  priority?: string;
  [key: string]: any;
}

export interface WebhookData {
  url: string;
  events: string[];
  active?: boolean;
  [key: string]: any;
}

export interface RazorpayPaymentData {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  [key: string]: any;
}

class ApiService {
  // Helper method for dual-endpoint fallback pattern
  private static async fetchWithFallback(
    primaryEndpoint: string,
    fallbackEndpoint: string,
    errorContext: string
  ): Promise<any> {
    try {
      const response = await apiClient.get(primaryEndpoint);
      return response.data;
    } catch (error: any) {
      try {
        const fallbackResponse = await apiClient.get(fallbackEndpoint);
        return fallbackResponse.data;
      } catch (fallbackError: any) {
        throw new Error(`${errorContext} not found: Unable to locate resource`);
      }
    }
  }

  static async login(email: string, password: string): Promise<ApiResponse<any>> {
    try {
      if (!email?.trim() || !password) {
        throw new Error('Email and password are required');
      }
      const response = await apiClient.post('/auth/login', { email: email.trim(), password });
      return response.data;
    } catch (error: any) {
      return ApiService.handleError(error);
    }
  }

  static async register(userData: RegisterUserData): Promise<ApiResponse<any>> {
    try {
      if (!userData.email?.trim() || !userData.password || !userData.name?.trim()) {
        throw new Error('Name, email, and password are required');
      }
      // Sanitize input
      const cleanData = {
        ...userData,
        email: userData.email.trim(),
        name: userData.name.trim(),
      };
      const response = await apiClient.post('/auth/register', cleanData);
      return response.data;
    } catch (error: any) {
      return ApiService.handleError(error);
    }
  }

  static async getCurrentUser(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error: any) {
      return ApiService.handleError(error);
    }
  }

  static async getProtectedWorkflows(userId?: string): Promise<ApiResponse<ProtectedWorkflow[]>> {
    try {
      const headers: any = {};
      if (userId) {
        headers['x-user-id'] = encodeURIComponent(userId);
      }
      const response = await apiClient.get('/workflow/protected', { headers });
      return response.data;
    } catch (error: any) {
      return ApiService.handleError(error);
    }
  }

  static async getWorkflowHistory(workflowId: string): Promise<ApiResponse<WorkflowHistoryVersion[]>> {
    try {
      if (!workflowId) throw new Error('Workflow ID required');
      return this.fetchWithFallback(
        `/workflow-version/by-hubspot-id/${encodeURIComponent(workflowId)}/history`,
        `/workflow-version/${encodeURIComponent(workflowId)}/history`,
        'Workflow history'
      );
    } catch (error: any) {
      return ApiService.handleError(error);
    }
  }

  static async getWorkflowDetails(workflowId: string): Promise<ApiResponse<any>> {
    try {
      if (!workflowId) throw new Error('Workflow ID required');
      return this.fetchWithFallback(
        `/workflow/by-hubspot-id/${encodeURIComponent(workflowId)}`,
        `/workflow/${encodeURIComponent(workflowId)}`,
        'Workflow details'
      );
    } catch (error: any) {
      return ApiService.handleError(error);
    }
  }
  // Standardized error handler
  private static handleError(error: any): ApiResponse<any> {
    let message = 'An unexpected error occurred.';
    if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.message) {
      message = error.message;
    }
    return { success: false, message };
  }

  static async rollbackWorkflow(workflowId: string, versionId?: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/workflow/${workflowId}/rollback${versionId ? `/${versionId}` : ''}`);
    return response.data;
  }

  static async restoreWorkflowVersion(workflowId: string, versionId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/workflow/${workflowId}/restore/${versionId}`);
    return response.data;
  }

  static async downloadWorkflowVersion(workflowId: string, versionId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/workflow/${workflowId}/version/${versionId}/download`);
    return response.data;
  }

  static async compareWorkflowVersions(workflowId: string, versionA: string, versionB: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/workflow/${workflowId}/compare/${versionA}/${versionB}`);
    return response.data;
  }

  static async getWorkflowVersionsForComparison(workflowId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/workflow/${workflowId}/versions`);
    return response.data;
  }

  static async startWorkflowProtection(selectedWorkflowObjects: any[]): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/workflow/start-protection', {
      workflows: selectedWorkflowObjects
    });
    return response.data;
  }

  static async getHubSpotWorkflows(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/workflow/hubspot');
    return response.data;
  }

  static async getHubSpotAuthUrl(isMarketplace: boolean = false): Promise<ApiResponse<{ url: string }>> {
    const response = await apiClient.get('/auth/hubspot/url', {
      params: {
        marketplace: isMarketplace,
        _ts: Date.now() // Cache-busting parameter
      }
    });
    return response.data;
  }

  static async completeHubSpotOAuth(code: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/auth/hubspot/complete', { code });
    return response.data;
  }

  static async syncHubSpotWorkflows(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/workflow/sync-hubspot', {});
    return response.data;
  }

  static async createAutomatedBackup(workflowId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/workflow/${workflowId}/automated-backup`, {});
    return response.data;
  }

  static async createChangeNotification(workflowId: string, changes: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/workflow/${workflowId}/change-notification`, changes);
    return response.data;
  }

  static async createApprovalRequest(workflowId: string, requestedChanges: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/workflow/${workflowId}/approval-request`, requestedChanges);
    return response.data;
  }

  static async generateComplianceReport(workflowId: string, startDate: string, endDate: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await apiClient.get(`/workflow/${encodeURIComponent(workflowId)}/compliance-report?${params}`);
    return response.data;
  }

  // AI Support Methods
  static async diagnoseIssue(description: string): Promise<ApiResponse<any>> {
    if (!description?.trim()) {
      throw new Error('Description is required');
    }
    const response = await apiClient.post('/support/diagnose', { description: description.trim() });
    return response.data;
  }

  static async fixRollbackIssue(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/support/fix-rollback', {});
    return response.data;
  }

  static async fixSyncIssue(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/support/fix-sync', {});
    return response.data;
  }

  static async fixAuthIssue(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/support/fix-auth', {});
    return response.data;
  }

  static async fixDataIssue(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/support/fix-data', {});
    return response.data;
  }

  static async optimizePerformance(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/support/optimize-performance', {});
      return response.data;
    } catch (error: any) {
      // If a 304 sneaks through, treat as retryable failure
      if (error?.response?.status === 304) {
        return { success: false, message: 'Not modified. Please retry.' };
      }
      throw error;
    }
  }

  static async getDashboardStats(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  }

  // User management
  static async updateUserProfile(userData: UserProfileData): Promise<ApiResponse<any>> {
    const response = await apiClient.put('/user/profile', userData);
    return response.data;
  }

  static async disconnectHubSpot(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/disconnect-hubspot');
    return response.data;
  }

  static async deleteAccount(): Promise<ApiResponse<any>> {
    const response = await apiClient.delete('/user/account');
    return response.data;
  }

  static async getUserProfile(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/user/profile');
    return response.data;
  }

  static async getUsers(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/users');
    return response.data;
  }

  static async verifyEmail(email: string): Promise<ApiResponse<any>> {
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Valid email is required');
    }
    const response = await apiClient.post('/user/verify-email', { email: email.trim() });
    return response.data;
  }

  static async uploadAvatar(formData: FormData): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  static async removeAvatar(): Promise<ApiResponse<any>> {
    const response = await apiClient.delete('/user/avatar');
    return response.data;
  }

  static async getNotificationSettings(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/user/notification-settings');
    return response.data;
  }

  static async updateNotificationSettings(settings: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put('/user/notification-settings', settings);
    return response.data;
  }

  static async getAuditLogs(filters?: any): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/audit-logs', { params: filters });
    return response.data;
  }

  static async exportAuditLogs(filters?: any): Promise<ApiResponse<any>> {
    // Backend expects POST /audit-logs/export with filters in body
    const response = await apiClient.post('/audit-logs/export', filters || {});
    return response.data;
  }

  static async getApiKeys(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/user/api-keys');
    return response.data;
  }

  static async createApiKey(apiKeyData: CreateApiKeyRequest): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/api-keys', apiKeyData);
    return response.data;
  }

  static async deleteApiKey(keyId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/user/api-keys/${encodeURIComponent(keyId)}`);
    return response.data;
  }

  // Subscription and billing
  static async getSubscription(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/subscription');
    return response.data;
  }

  static async getTrialStatus(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/subscription/trial-status');
    return response.data;
  }

  static async getExpirationStatus(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/subscription/expiration-status');
    return response.data;
  }

  static async getNextPaymentInfo(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/subscription/next-payment');
    return response.data;
  }

  static async getUsageStats(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/subscription/usage');
    return response.data;
  }

  static async updateSubscription(planId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/subscription/update', { planId });
    return response.data;
  }

  static async getBillingHistory(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/billing/history');
    return response.data;
  }

  static async downloadBillingHistoryCSV(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/billing/history/export');
    return response.data;
  }

  static async cancelSubscription(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/billing/cancel');
    return response.data;
  }

  static async getInvoice(invoiceId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/billing/invoice/${invoiceId}`);
    return response.data;
  }

  static async getPaymentMethodUpdateUrl(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/billing/update-payment-method');
    return response.data;
  }

  // Razorpay
  static async createRazorpayOrder(planId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/razorpay/order', { planId });
    return response.data;
  }

  static async confirmRazorpayPayment(paymentData: RazorpayPaymentData): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/razorpay/confirm-payment', paymentData);
    return response.data;
  }

  static async createRazorpayPaymentMethodOrder(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/razorpay/payment-method-order');
    return response.data;
  }

  static async saveRazorpayPaymentMethod(paymentData: RazorpayPaymentData): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/razorpay/save-payment-method', paymentData);
    return response.data;
  }

  // Support tickets
  static async createSupportTicket(ticketData: SupportTicketData): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/support/tickets', ticketData);
    return response.data;
  }

  static async getSupportTickets(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/support/tickets');
    return response.data;
  }

  // Enterprise Analytics APIs
  static async getUserAnalytics(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/analytics/user?${params.toString()}`);
    return response.data;
  }

  // Webhook Management APIs
  static async getUserWebhooks(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/webhooks');
    return response.data;
  }

  static async createWebhook(webhookData: WebhookData): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/webhooks', webhookData);
    return response.data;
  }

  static async updateWebhook(webhookId: string, webhookData: WebhookData): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/webhooks/${webhookId}`, webhookData);
    return response.data;
  }

  static async deleteWebhook(webhookId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/webhooks/${webhookId}`);
    return response.data;
  }

  // Advanced Enterprise Features
  static async getWorkflowAnalytics(workflowId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/workflow/${workflowId}/analytics`);
    return response.data;
  }

  static async getPerformanceMetrics(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/analytics/performance');
    return response.data;
  }

  static async getComplianceMetrics(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/analytics/compliance');
    return response.data;
  }

  static async getSystemHealth(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/system/health');
    return response.data;
  }

  static async getCacheStats(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/system/cache-stats');
    return response.data;
  }

  static async getEnterpriseReport(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/enterprise/report', {
      params: { startDate, endDate }
    });
    return response.data;
  }

  static async exportDashboardData(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/dashboard/export');
    return response.data;
  }

  static async exportWorkflow(workflowId?: string): Promise<ApiResponse<any>> {
    const endpoint = workflowId ? `/workflow/${workflowId}/export` : '/workflow/export-all';
    const response = await apiClient.get(endpoint);
    return response.data;
  }
}

export { ApiService };
export default ApiService;