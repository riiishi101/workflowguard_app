export type PlanId = 'starter' | 'professional' | 'enterprise';

export interface PlanConfig {
  maxWorkflows: number | null; // null = unlimited
  historyDays: number | null; // null = unlimited
  features: string[];
}

export const PLAN_CONFIG: Record<PlanId, PlanConfig> = {
  starter: {
    maxWorkflows: 25,
    historyDays: 30,
    features: ['basic_monitoring', 'email_support'],
  },
  professional: {
    maxWorkflows: 500,
    historyDays: 90,
    features: [
      'advanced_monitoring',
      'priority_support',
      'custom_notifications',
    ],
  },
  enterprise: {
    maxWorkflows: null,
    historyDays: null,
    features: [
      'unlimited_workflows',
      'advanced_monitoring',
      '24_7_support',
      'api_access',
      'user_permissions',
      'audit_logs',
    ],
  },
}; 