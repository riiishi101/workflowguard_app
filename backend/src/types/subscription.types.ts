export interface PlanLimits {
  workflows: number;
  versionHistory: number;
  teamMembers: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  limits: PlanLimits;
  features: string[];
}

export interface SubscriptionUsage {
  workflows: number;
  versionHistory: number;
  teamMembers: number;
}

export interface UserSubscription {
  id: string;
  planId: string;
  planName: string;
  price: number;
  currency: string;
  status: string;
  currentPeriodStart: string | Date;
  currentPeriodEnd: string | Date;
  trialEndDate: Date | null;
  nextBillingDate: Date | null;
  features: string[];
  limits: PlanLimits;
  usage: SubscriptionUsage;
  allCurrencyPrices?: Record<string, { amount: number; formatted: string }>;
}

export interface TrialStatus {
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialDaysRemaining: number;
  trialEndDate: string | undefined;
}

export interface UsageStat {
  used: number;
  limit: number;
  percentage: number;
}

export interface UsageStats {
  workflows: UsageStat;
  versionHistory: UsageStat;
  teamMembers: UsageStat;
  storage: UsageStat;
}

export interface SubscriptionExpirationStatus {
  isExpired: boolean;
  message?: string;
  expiredDate?: Date;
}

export interface NextPaymentInfo {
  hasSubscription: boolean;
  nextPayment?: {
    date: Date;
    daysUntil: number;
    isOverdue: boolean;
    amount: number;
    currency: string;
  } | null;
}
