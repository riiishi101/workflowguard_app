export interface HubSpotBillingResponse {
  status: string;
  plan_id: string;
  current_period_end: string;
  next_billing_date: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  planId: string;
  currentPeriodEnd: Date;
  nextBillingDate: Date;
  status: string;
}

export interface HubSpotSubscriptionInfo {
  next_billing_date: string;
  [key: string]: any;
}

export interface CancelSubscriptionResponse {
  success: boolean;
}

export interface HubSpotPaymentResponse {
  transactionId: string;
  status: 'success' | 'failed';
  [key: string]: any;
}

export interface HubSpotInvoiceResponse {
  invoiceId: string;
  status: 'created' | 'sent' | 'paid';
  [key: string]: any;
}
