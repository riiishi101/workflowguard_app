console.log('REAL API SERVICE MODULE LOADED');
// Add type definitions
interface Webhook {
  id: string;
  userId: string;
  endpointUrl: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateWebhookDto {
  endpointUrl: string;
  events: string[];
  secret?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://www.workflowguard.pro/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.token || localStorage.getItem('authToken');
    
    // Only send Authorization header if we have a valid token
    // If no token, rely on JWT cookie authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const config: RequestInit = {
      headers,
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // User endpoints
  async createUser(userData: { email: string; name?: string; role?: string }) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUsers() {
    return this.request('/users');
  }

  async getUserById(id: string) {
    return this.request(`/users/${id}`);
  }

  async getUserByEmail(email: string) {
    return this.request(`/users/email/${email}`);
  }

  async updateUser(id: string, userData: Partial<{ email: string; name: string; role: string }>) {
    return this.request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Workflow endpoints
  async createWorkflow(workflowData: { hubspotId: string; name: string; ownerId: string }) {
    return this.request('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflowData),
    });
  }

  async getWorkflows(ownerId?: string) {
    // Production: Fetch workflows from the real API
    return this.request('/workflows');
  }

  async getWorkflowById(id: string) {
    return this.request(`/workflows/${id}`);
  }

  async getWorkflowByHubspotId(hubspotId: string) {
    return this.request(`/workflows/hubspot/${hubspotId}`);
  }

  async updateWorkflow(id: string, workflowData: Partial<{ hubspotId: string; name: string; ownerId: string }>) {
    return this.request(`/workflows/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(workflowData),
    });
  }

  async deleteWorkflow(id: string) {
    return this.request(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  async rollbackWorkflow(id: string) {
    return this.request(`/workflows/${id}/rollback`, {
      method: 'POST',
    });
  }

  // Workflow Version endpoints
  async createWorkflowVersion(versionData: {
    workflowId: string;
    versionNumber: number;
    snapshotType: string;
    createdBy: string;
    data: any;
  }) {
    return this.request('/workflow-versions', {
      method: 'POST',
      body: JSON.stringify(versionData),
    });
  }

  async getWorkflowVersions(workflowId?: string) {
    const params = workflowId ? `?workflowId=${workflowId}` : '';
    return this.request(`/workflow-versions${params}`);
  }

  async getWorkflowVersionById(id: string) {
    return this.request(`/workflow-versions/${id}`);
  }

  async getLatestWorkflowVersion(workflowId: string) {
    return this.request(`/workflow-versions/workflow/${workflowId}/latest`);
  }

  async getWorkflowHistory(workflowId: string) {
    return this.request(`/workflow-versions/workflow/${workflowId}/history`);
  }

  async compareVersions(version1Id: string, version2Id: string) {
    return this.request(`/workflow-versions/compare/${version1Id}/${version2Id}`);
  }

  async deleteWorkflowVersion(id: string) {
    return this.request(`/workflow-versions/${id}`, {
      method: 'DELETE',
    });
  }

  // Audit Log endpoints
  async createAuditLog(auditData: {
    userId?: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
  }) {
    return this.request('/audit-logs', {
      method: 'POST',
      body: JSON.stringify(auditData),
    });
  }

  async getAuditLogs(userId?: string, entityType?: string, entityId?: string) {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (entityType) params.append('entityType', entityType);
    if (entityId) params.append('entityId', entityId);
    
    const queryString = params.toString();
    const url = queryString ? `/audit-logs?${queryString}` : '/audit-logs';
    return this.request(url);
  }

  async getAuditLogById(id: string) {
    return this.request(`/audit-logs/${id}`);
  }

  async getAuditLogsByUser(userId: string) {
    return this.request(`/audit-logs/user/${userId}`);
  }

  async getAuditLogsByEntity(entityType: string, entityId: string) {
    return this.request(`/audit-logs/entity/${entityType}/${entityId}`);
  }

  async deleteAuditLog(id: string) {
    return this.request(`/audit-logs/${id}`, {
      method: 'DELETE',
    });
  }

  // Auth endpoints
  async initiateHubSpotOAuth() {
    window.location.href = `${API_BASE_URL}/auth/hubspot`;
  }

  async validateUser(email: string) {
    return this.request('/auth/validate', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async loginUser(userData: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async registerUser(userData: { email: string; name?: string; role?: string; password?: string }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async findOrCreateUser(email: string) {
    return this.request(`/auth/user/${email}`);
  }

  async getMyPlan() {
    return this.request('/users/me/plan');
  }

  // Webhook methods
  async getWebhooks(): Promise<Webhook[]> {
    return this.request('/webhooks');
  }

  async addWebhook(webhookData: any): Promise<Webhook> {
    return this.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify(webhookData),
    });
  }

  async updateWebhook(id: string, webhookData: any): Promise<Webhook> {
    return this.request(`/webhooks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(webhookData),
    });
  }

  async deleteWebhook(id: string): Promise<void> {
    return this.request(`/webhooks/${id}`, { method: 'DELETE' });
  }

  // Overage methods
  async getUserOverages(userId: string, periodStart?: string, periodEnd?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (periodStart) params.append('periodStart', periodStart);
    if (periodEnd) params.append('periodEnd', periodEnd);
    return this.request(`/users/${userId}/overages?${params}`);
  }

  async getOverageStats(userId: string): Promise<any> {
    return this.request(`/users/${userId}/overages/stats`);
  }

  async getAllOverages(filters?: {
    userId?: string;
    billed?: boolean;
    periodStart?: string;
    periodEnd?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.billed !== undefined) params.append('billed', filters.billed.toString());
    if (filters?.periodStart) params.append('periodStart', filters.periodStart);
    if (filters?.periodEnd) params.append('periodEnd', filters.periodEnd);
    return this.request(`/overages?${params}`);
  }

  async markOverageAsBilled(overageId: string): Promise<any> {
    return this.request(`/overages/${overageId}/bill`, {
      method: 'PATCH',
    });
  }

  async getOverageSummary(periodStart?: string, periodEnd?: string): Promise<any> {
    const params = new URLSearchParams();
    if (periodStart) params.append('periodStart', periodStart);
    if (periodEnd) params.append('periodEnd', periodEnd);
    return this.request(`/overages/report/summary?${params}`);
  }

  async getUnbilledOverages(): Promise<any[]> {
    return this.request('/overages/report/unbilled');
  }

  // HubSpot Billing methods
  async bulkBillOverages(overageIds: string[]): Promise<any> {
    return this.request('/overages/bulk-bill', {
      method: 'POST',
      body: JSON.stringify({ overageIds }),
    });
  }

  async getBillingStatus(): Promise<any> {
    return this.request('/overages/billing-status');
  }

  async processOverages(overageIds?: string[]): Promise<any> {
    const payload = overageIds ? { overageIds } : {};
    return this.request('/hubspot-billing/process-overages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getUserBillingSummary(userId: string): Promise<any> {
    return this.request(`/hubspot-billing/user/${userId}/billing-summary`);
  }

  async validateHubSpotConnection(portalId: string): Promise<any> {
    return this.request('/hubspot-billing/validate-connection', {
      method: 'POST',
      body: JSON.stringify({ portalId }),
    });
  }

  async updateHubSpotUsage(data: {
    portalId: string;
    userId: string;
    usageType: string;
    usageAmount: number;
    billingPeriod: string;
  }): Promise<any> {
    return this.request('/hubspot-billing/update-usage', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createWebhook(data: CreateWebhookDto): Promise<Webhook> {
    return this.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Analytics endpoints
  async getBusinessIntelligence() {
    return this.request('/analytics/business-intelligence');
  }

  async getUsageTrends(months?: number) {
    const params = months ? `?months=${months}` : '';
    return this.request(`/analytics/usage-trends${params}`);
  }

  async getUserAnalytics() {
    return this.request('/analytics/user-analytics');
  }

  async getRevenueAnalytics() {
    return this.request('/analytics/revenue-analytics');
  }

  async getPredictiveAnalytics() {
    return this.request('/analytics/predictive-analytics');
  }

  async getCustomRangeAnalytics(startDate: string, endDate: string) {
    return this.request(`/analytics/custom-range?startDate=${startDate}&endDate=${endDate}`);
  }

  async getMyAnalytics() {
    return this.request('/analytics/my-analytics');
  }

  async getRevenueSummary() {
    return this.request('/analytics/revenue-summary');
  }

  async getRiskAssessment() {
    return this.request('/analytics/risk-assessment');
  }

  async getUpgradeRecommendations() {
    return this.request('/analytics/upgrade-recommendations');
  }

  // Email endpoints
  async sendOverageAlert(data: {
    userEmail: string;
    userName: string;
    overageCount: number;
    overageAmount: number;
    period: string;
    planId: string;
    recommendedPlan?: string;
  }) {
    return this.request('/email/overage-alert', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendBillingUpdate(data: {
    userEmail: string;
    userName: string;
    billingAmount: number;
    billingPeriod: string;
    overageDetails: Array<{
      period: string;
      count: number;
      amount: number;
    }>;
  }) {
    return this.request('/email/billing-update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendSystemAlert(data: {
    userEmail: string;
    userName: string;
    alertType: 'plan_upgrade' | 'plan_downgrade' | 'usage_warning' | 'system_maintenance';
    message: string;
    actionRequired?: boolean;
  }) {
    return this.request('/email/system-alert', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendWelcomeEmail(data: {
    userEmail: string;
    userName: string;
    planId: string;
    workflowLimit: number;
    features: string[];
  }) {
    return this.request('/email/welcome', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendUpgradeRecommendation(data: {
    userEmail: string;
    userName: string;
    currentPlan: string;
    recommendedPlan: string;
    reason: string;
  }) {
    return this.request('/email/upgrade-recommendation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendUsageWarning(data: {
    userEmail: string;
    userName: string;
    planId: string;
    currentUsage: number;
    limit: number;
    percentageUsed: number;
  }) {
    return this.request('/email/usage-warning', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendBulkNotification(data: {
    userEmails: string[];
    subject: string;
    message: string;
    isHtml?: boolean;
  }) {
    return this.request('/email/bulk-notification', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendWelcomeEmailToSelf(data: {
    planId: string;
    workflowLimit: number;
    features: string[];
  }) {
    return this.request('/email/welcome-self', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendUsageWarningToSelf(data: {
    planId: string;
    currentUsage: number;
    limit: number;
    percentageUsed: number;
  }) {
    return this.request('/email/usage-warning-self', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Real-time endpoints
  async getRealtimeConnectionStatus() {
    return this.request('/realtime/status');
  }

  async getConnectedUsers() {
    return this.request('/realtime/users');
  }

  async getUserRooms() {
    return this.request('/realtime/rooms');
  }

  async sendNotificationToUser(data: {
    userId: string;
    type: 'overage_alert' | 'billing_update' | 'system_alert' | 'usage_warning' | 'workflow_update' | 'audit_log';
    title: string;
    message: string;
    data?: any;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }) {
    return this.request('/realtime/notification/user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendNotificationToRoom(data: {
    room: string;
    type: 'overage_alert' | 'billing_update' | 'system_alert' | 'usage_warning' | 'workflow_update' | 'audit_log';
    title: string;
    message: string;
    data?: any;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }) {
    return this.request('/realtime/notification/room', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendNotificationToAll(data: {
    type: 'overage_alert' | 'billing_update' | 'system_alert' | 'usage_warning' | 'workflow_update' | 'audit_log';
    title: string;
    message: string;
    data?: any;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }) {
    return this.request('/realtime/notification/all', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendUpdateToUser(data: {
    userId: string;
    type: 'workflow_created' | 'workflow_updated' | 'workflow_deleted' | 'overage_detected' | 'billing_updated' | 'user_activity';
    data: any;
  }) {
    return this.request('/realtime/update/user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendUpdateToRoom(data: {
    room: string;
    type: 'workflow_created' | 'workflow_updated' | 'workflow_deleted' | 'overage_detected' | 'billing_updated' | 'user_activity';
    data: any;
  }) {
    return this.request('/realtime/update/room', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendUpdateToAll(data: {
    type: 'workflow_created' | 'workflow_updated' | 'workflow_deleted' | 'overage_detected' | 'billing_updated' | 'user_activity';
    data: any;
  }) {
    return this.request('/realtime/update/all', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendWorkflowUpdate(data: { userId: string; workflowData: any }) {
    return this.request('/realtime/workflow-update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendAuditLogUpdate(data: { auditData: any }) {
    return this.request('/realtime/audit-log-update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async broadcastAdminMessage(data: { message: string; data?: any }) {
    return this.request('/realtime/broadcast/admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async broadcastSystemMaintenance(data: { message: string; scheduledTime?: Date }) {
    return this.request('/realtime/broadcast/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // API Key endpoints
  async getApiKeys() {
    return this.request('/users/me/api-keys');
  }

  async createApiKey(description: string) {
    return this.request('/users/me/api-keys', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  async deleteApiKey(id: string) {
    return this.request(`/users/me/api-keys/${id}`, { method: 'DELETE' });
  }

  // User management endpoints
  async updateUserRole(userId: string, role: string) {
    return this.request(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async addUser(userData: { name: string; email: string; role: string }) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Webhook management endpoints
  async getNotificationSettings() {
    return this.request('/users/me/notification-settings');
  }

  async updateNotificationSettings(settings: {
    notificationsEnabled: boolean;
    notificationEmail: string;
    workflowDeleted: boolean;
    enrollmentTriggerModified: boolean;
    workflowRolledBack: boolean;
    criticalActionModified: boolean;
  }) {
    return this.request('/users/me/notification-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getMe() {
    return this.request('/users/me');
  }

  async updateMe(profile: {
    name?: string;
    email?: string;
    jobTitle?: string;
    timezone?: string;
    language?: string;
  }) {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  async deleteMe() {
    return this.request('/users/me', { method: 'DELETE' });
  }

  async getSsoConfig() {
    return this.request('/sso-config');
  }

  async updateSsoConfig(config: { provider: string; metadata: string; enabled: boolean }) {
    return this.request('/sso-config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async syncWorkflowFromHubSpot(workflowId: string) {
    return this.request(`/workflows/${workflowId}/sync-from-hubspot`, {
      method: 'POST',
    });
  }

  async setMonitoredWorkflows(workflowIds: string[]) {
    return this.request('/users/me/monitored-workflows', {
      method: 'POST',
      body: JSON.stringify({ workflowIds }),
    });
  }
}

export const apiService = new ApiService();
export const api = apiService;
export default apiService; 