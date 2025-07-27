export type PlanId = 'trial' | 'professional' | 'enterprise';

export interface PlanConfig {
  maxWorkflows: number | null; // null = unlimited
  historyDays: number | null; // null = unlimited
  features: string[];
  isPaid: boolean;
}

export const PLAN_CONFIG: Record<PlanId, PlanConfig> = {
  trial: {
    maxWorkflows: 500,
    historyDays: 90,
    features: [
      'advanced_monitoring',
      'priority_support',
      'custom_notifications',
    ],
    isPaid: false,
  },
  professional: {
    maxWorkflows: 500,
    historyDays: 90,
    features: [
      'advanced_monitoring',
      'priority_support',
      'custom_notifications',
    ],
    isPaid: true,
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
    isPaid: true,
  },
};
