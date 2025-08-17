import { Plan } from '../types/subscription.types';

export const PLANS: Record<string, Plan> = {
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    price: 19,
    limits: { workflows: 5, versionHistory: 30, teamMembers: 1 },
    features: [
      'workflow_selection',
      'dashboard_overview',
      'basic_version_history',
      'manual_backups',
      'basic_rollback',
    ],
  },
  professional: {
    id: 'professional',
    name: 'Professional Plan',
    price: 49,
    limits: { workflows: 25, versionHistory: 90, teamMembers: 5 },
    features: [
      'workflow_selection',
      'dashboard_overview',
      'complete_version_history',
      'automated_backups',
      'change_notifications',
      'advanced_rollback',
      'side_by_side_comparisons',
      'compliance_reporting',
      'audit_trails',
      'priority_whatsapp_support',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 99,
    limits: { workflows: 9999, versionHistory: 365, teamMembers: 9999 },
    features: [
      'unlimited_workflows',
      'real_time_change_notifications',
      'approval_workflows',
      'advanced_compliance_reporting',
      'complete_audit_trails',
      'custom_retention_policies',
      'advanced_security_features',
      'advanced_analytics',
      'unlimited_team_members',
      'white_label_options',
      '24_7_whatsapp_support',
    ],
  },
};

export const DEFAULT_PLAN_ID = 'starter';
