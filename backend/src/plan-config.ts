export type PlanId = 'trial' | 'starter' | 'professional' | 'enterprise';

export interface PlanConfig {
  maxWorkflows: number | null; // null = unlimited
  historyDays: number | null; // null = unlimited
  features: string[];
  isPaid: boolean;
  price?: number; // Monthly price in USD
  description?: string;
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
    description: '21-day free trial of Professional features',
  },
  starter: {
    maxWorkflows: 50,
    historyDays: 30,
    features: [
      'basic_monitoring',
      'email_support',
      'workflow_backup',
      'version_history',
    ],
    isPaid: true,
    price: 29,
    description: 'Perfect for small teams getting started',
  },
  professional: {
    maxWorkflows: 500,
    historyDays: 90,
    features: [
      'advanced_monitoring',
      'priority_support',
      'custom_notifications',
      'workflow_backup',
      'version_history',
      'bulk_operations',
      'advanced_analytics',
    ],
    isPaid: true,
    price: 59,
    description: 'For growing businesses with advanced needs',
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
      'workflow_backup',
      'version_history',
      'bulk_operations',
      'advanced_analytics',
      'custom_integrations',
      'dedicated_support',
    ],
    isPaid: true,
    price: 199,
    description: 'Enterprise-grade solution for large organizations',
  },
};
