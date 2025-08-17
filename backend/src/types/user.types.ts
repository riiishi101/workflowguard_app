export interface ApiKey {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  lastUsed: Date | null;
  isActive: boolean;
  key?: string; 
}

export interface NotificationSettings {
  userId: string;
  enabled: boolean;
  email: string | null;
  workflowDeleted: boolean;
  enrollmentTriggerModified: boolean;
  workflowRolledBack: boolean;
  criticalActionModified: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
}
