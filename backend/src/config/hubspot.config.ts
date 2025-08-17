import { registerAs } from '@nestjs/config';

export default registerAs('hubspot', () => ({
  // OAuth Configuration
  clientId: process.env.HUBSPOT_CLIENT_ID,
  clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
  redirectUri:
    process.env.HUBSPOT_REDIRECT_URI ||
    'https://api.workflowguard.pro/api/auth/hubspot/callback',

  // Required Scopes for WorkflowGuard
  scopes: [
    'crm.schemas.deals.read',
    'automation',
    'oauth',
    'crm.objects.companies.read',
    'crm.objects.deals.read',
    'crm.schemas.contacts.read',
    'crm.objects.contacts.read',
    'crm.schemas.companies.read',
  ].join(' '),

  // API Configuration
  apiBaseUrl: 'https://api.hubapi.com',
  apiTimeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second

  // Rate Limiting
  rateLimitPerMinute: 100,
  rateLimitPerHour: 1000,
  rateLimitPerDay: 10000,

  // Token Management
  tokenRefreshBuffer: 5 * 60 * 1000, // 5 minutes before expiry
  maxTokenAge: 24 * 60 * 60 * 1000, // 24 hours

  // Workflow Configuration
  maxWorkflowsPerRequest: 100,
  workflowSyncInterval: 5 * 60 * 1000, // 5 minutes
  workflowBackupInterval: 24 * 60 * 60 * 1000, // 24 hours

  // Error Handling
  maxConsecutiveFailures: 5,
  failureBackoffMultiplier: 2,
  maxBackoffDelay: 60 * 1000, // 1 minute

  // Logging
  logLevel: process.env.HUBSPOT_LOG_LEVEL || 'info',
  enableDetailedLogging: process.env.HUBSPOT_DETAILED_LOGGING === 'true',

  // Security
  tokenEncryptionKey: process.env.HUBSPOT_TOKEN_ENCRYPTION_KEY,
  enableTokenEncryption: process.env.HUBSPOT_ENCRYPT_TOKENS === 'true',

  // Monitoring
  enableHealthChecks: true,
  healthCheckInterval: 5 * 60 * 1000, // 5 minutes
  connectionTimeout: 10 * 1000, // 10 seconds

  // Webhook Configuration
  webhookSecret: process.env.HUBSPOT_WEBHOOK_SECRET,
  webhookTimeout: 30 * 1000, // 30 seconds

  // Portal Requirements
  minimumPortalPlan: 'professional', // Minimum HubSpot plan required
  requiredFeatures: ['automation', 'workflows', 'api_access'],

  // Data Retention
  maxWorkflowVersions: 1000,
  workflowVersionRetentionDays: 365,
  auditLogRetentionDays: 730, // 2 years

  // Backup Configuration
  enableAutomaticBackups: true,
  backupSchedule: '0 */6 * * *', // Every 6 hours
  backupRetentionDays: 30,

  // Notification Settings
  enableFailureNotifications: true,
  notificationChannels: ['email', 'webhook'],
  criticalErrorThreshold: 3,

  // Performance
  enableCaching: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  maxConcurrentRequests: 10,

  // Development/Testing
  enableMockMode: process.env.HUBSPOT_MOCK_MODE === 'true',
  mockDataPath: process.env.HUBSPOT_MOCK_DATA_PATH,

  // Compliance
  enableDataEncryption: true,
  enableAuditLogging: true,
  gdprCompliant: true,
  dataRetentionPolicy: 'standard',

  // Integration Limits
  maxUsersPerPortal: 100,
  maxWorkflowsPerUser: 1000,
  maxApiCallsPerMinute: 100,
  maxApiCallsPerHour: 1000,

  // Error Recovery
  enableAutomaticRetry: true,
  maxRetryAttempts: 3,
  retryStrategy: 'exponential_backoff',

  // Monitoring Alerts
  alertThresholds: {
    apiErrorRate: 0.05, // 5%
    responseTime: 5000, // 5 seconds
    tokenRefreshFailures: 3,
    connectionFailures: 5,
  },

  // Feature Flags
  features: {
    enableWorkflowComparison: true,
    enableVersionHistory: true,
    enableAutomaticBackups: true,
    enableRealTimeSync: true,
    enableAdvancedAnalytics: true,
    enableTeamCollaboration: true,
    enableAuditLogging: true,
    enableApiAccess: true,
  },
}));
