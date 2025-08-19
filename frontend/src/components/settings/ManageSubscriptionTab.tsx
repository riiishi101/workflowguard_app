import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  CreditCard,
  AlertTriangle,
  Pencil
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ApiService } from '@/lib/api';
import { z } from 'zod';
import {
  SubscriptionSchema,
  UsageStatsSchema,
  BillingHistorySchema,
  BillingHistoryItemSchema
} from '@/types/subscription.schemas';

type Subscription = z.infer<typeof SubscriptionSchema>;
type UsageStats = z.infer<typeof UsageStatsSchema>;
type BillingHistoryItem = z.infer<typeof BillingHistoryItemSchema>;

const ManageSubscriptionTab = () => {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [billingHistory, setBillingHistory] = useState<z.infer<typeof BillingHistorySchema>>([]);
    const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isViewingInvoice, setIsViewingInvoice] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [subRes, usageRes, billingRes] = await Promise.all([
        ApiService.getSubscription(),
        ApiService.getUsageStats(),
        ApiService.getBillingHistory(),
      ]);

      const subscriptionResult = SubscriptionSchema.safeParse(subRes.data);
      if (!subscriptionResult.success) {
        console.error('Subscription validation error:', subscriptionResult.error);
        throw new Error('Failed to validate subscription data.');
      }
      setSubscription(subscriptionResult.data);

      const usageStatsResult = UsageStatsSchema.safeParse(usageRes.data);
      if (!usageStatsResult.success) {
        console.error('Usage stats validation error:', usageStatsResult.error);
        throw new Error('Failed to validate usage statistics.');
      }
      setUsageStats(usageStatsResult.data);

      const billingHistoryResult = BillingHistorySchema.safeParse(billingRes.data || []);
      if (!billingHistoryResult.success) {
        console.error('Billing history validation error:', billingHistoryResult.error);
        throw new Error('Failed to validate billing history.');
      }
      setBillingHistory(billingHistoryResult.data);
    } catch (error: any) {
      console.error('Error fetching subscription data:', error);
      toast({
        title: 'Error Loading Data',
        description: error.message || 'Failed to load subscription information. Please refresh the page or contact support.',
        variant: 'destructive',
      });
      
      // Set empty states instead of mock data
      setSubscription(null);
      setUsageStats(null);
      setBillingHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject('Failed to load Razorpay');
      document.body.appendChild(script);
    });
  };

    const handleUpgrade = async (planId: string) => {
    setIsUpgrading(planId);
    const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKeyId) {
      toast({
        title: 'Configuration Error',
        description: 'Razorpay is not configured. Please contact support.',
        variant: 'destructive',
      });
      return;
    }
    try {
      toast({ title: 'Processing...', description: 'Initiating plan upgrade...' });
      
      await loadRazorpayScript();
      const resp = await ApiService.createRazorpayOrder(planId);
      
      if (!resp.success || !resp.data?.id) {
        throw new Error(resp.message || 'Failed to create payment order');
      }
      
      const order = resp.data;
      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'WorkflowGuard',
        description: `Upgrade to ${planId} plan`,
        order_id: order.id,
        prefill: {
          email: subscription?.email || '',
        },
        handler: async function (paymentResult: any) {
          try {
            const confirmResponse = await ApiService.confirmRazorpayPayment({
              planId,
              paymentId: paymentResult.razorpay_payment_id,
              orderId: order.id,
              signature: paymentResult.razorpay_signature
            });
            
            if (confirmResponse.success) {
              toast({ 
                title: 'Upgrade Complete', 
                description: `Successfully upgraded to ${planId} plan!` 
              });
              fetchAllData();
            } else {
              throw new Error(confirmResponse.message || 'Payment confirmation failed');
            }
          } catch (err: any) {
            console.error('Payment confirmation error:', err);
            toast({ 
              title: 'Payment Processing Error', 
              description: err.message || 'Payment was processed but confirmation failed. Please contact support.',
              variant: 'destructive' 
            });
          }
        },
                modal: {
          ondismiss: function() {
            toast({ 
              title: 'Payment Cancelled', 
              description: 'Plan upgrade was cancelled.' 
            });
            setIsUpgrading(null);
          }
        },
        theme: { color: '#2563eb' },
      };
      
            const rzp = new window.Razorpay(options);
      rzp.open();

      rzp.on('payment.failed', () => {
        setIsUpgrading(null);
      });
    } catch (error: any) {
            console.error('Upgrade error:', error);
      toast({ 
        title: 'Upgrade Failed', 
        description: error.message || 'Unable to initiate plan upgrade. Please try again.',
        variant: 'destructive' 
      });
      setIsUpgrading(null);
    }
  };

    const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const response = await ApiService.cancelSubscription();
      
      if (response.success) {
        toast({ 
          title: 'Subscription Cancelled', 
          description: 'Your subscription will not renew at the end of the current billing cycle.' 
        });
        fetchAllData();
      } else {
        throw new Error(response.message || 'Failed to cancel subscription');
      }
        } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast({ 
        title: 'Cancel Failed', 
        description: error.message || 'Unable to cancel subscription. Please contact support.',
        variant: 'destructive' 
      });
    } finally {
      setIsCancelling(false);
    }
  };

    const handleUpdatePayment = async () => {
    setIsUpdatingPayment(true);
    try {
      toast({
        title: 'Redirecting...',
        description: 'Opening payment method update page...',
      });
      
      const response = await ApiService.getPaymentMethodUpdateUrl();
      
      if (response.success && response.data?.updateUrl) {
        window.open(response.data.updateUrl, '_blank');
      } else {
        throw new Error(response.message || 'Failed to get payment update URL');
      }
        } catch (error: any) {
      console.error('Error updating payment method:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Unable to open payment method update. Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPayment(false);
    }
  };

    const handleExportHistory = async () => {
    setIsExporting(true);
    try {
      toast({
        title: 'Exporting...',
        description: 'Preparing your billing history export...',
      });
      
      const response = await ApiService.downloadBillingHistoryCSV();
      
      if (response.success && response.data) {
        // Create blob from response data
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `billing-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Export Complete',
          description: 'Your billing history has been downloaded.',
        });
      } else {
        throw new Error(response.message || 'Export failed');
      }
        } catch (error: any) {
      console.error('Error exporting billing history:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Unable to export billing history. Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

    const handleViewInvoice = async (invoiceId: string | undefined | null) => {
    if (!invoiceId) return;
    setIsViewingInvoice(invoiceId);
    if (!invoiceId) {
      toast({
        title: 'Invalid Invoice',
        description: 'Invoice ID not found.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      toast({
        title: 'Loading Invoice...',
        description: 'Opening invoice details...',
      });
      
      const response = await ApiService.getInvoice(invoiceId);
      
      if (response.success && response.data?.invoiceUrl) {
        window.open(response.data.invoiceUrl, '_blank');
      } else {
        throw new Error(response.message || 'Failed to get invoice URL');
      }
        } catch (error: any) {
      console.error('Error viewing invoice:', error);
      toast({
        title: 'View Failed',
        description: error.message || 'Unable to open invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsViewingInvoice(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  // Handle case when subscription data fails to load
  if (!subscription || !usageStats) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Manage Subscription
          </h2>
          <p className="text-gray-600">Control your billing, payment methods, and plan details.</p>
        </div>
        
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Subscription Data</h3>
          <p className="text-gray-600 mb-6">
            We couldn't load your subscription information. This might be due to a network issue or server problem.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={fetchAllData} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Manage Subscription
        </h2>
        <p className="text-gray-600">Control your billing, payment methods, and plan details.</p>
      </div>

      {/* Current Plan Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Current Plan</CardTitle>
              <CardDescription>Your active subscription details.</CardDescription>
            </div>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{subscription?.planName}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">${subscription?.price}<span className="text-base font-normal text-gray-600">/month</span></p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Change Plan</Button>
                                                <Button size="sm" onClick={() => handleUpgrade('professional')} disabled={!!isUpgrading}>
                  {isUpgrading === 'professional' ? 'Processing...' : 'Upgrade to Professional'}
                </Button>
                                  <Button size="sm" onClick={() => handleUpgrade('enterprise')} disabled={!!isUpgrading}>
                  {isUpgrading === 'enterprise' ? 'Processing...' : 'Upgrade to Enterprise'}
                </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Up to {usageStats?.workflows.limit} workflows</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Advanced monitoring</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Priority support</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>{usageStats?.versionHistory.limit}-day version history</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">
                  {subscription?.paymentMethod?.brand} ending in {subscription?.paymentMethod?.last4}
                </p>
                <p className="text-sm text-gray-500">Expires {subscription?.paymentMethod?.exp}</p>
              </div>
            </div>
                        <Button variant="outline" onClick={handleUpdatePayment} disabled={isUpdatingPayment}>
                            {isUpdatingPayment ? 'Processing...' : <><Pencil className="w-4 h-4 mr-2"/>Update Method</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Billing History</CardTitle>
              <CardDescription>Your past invoices and payment records.</CardDescription>
            </div>
                        <Button variant="outline" size="sm" onClick={handleExportHistory} disabled={isExporting}>
              {isExporting ? 'Exporting...' : 'Export All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {billingHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No billing history available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left font-medium text-gray-500 py-3">Date</th>
                    <th className="text-left font-medium text-gray-500 py-3">Amount</th>
                    <th className="text-left font-medium text-gray-500 py-3">Status</th>
                    <th className="text-right font-medium text-gray-500 py-3">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((item: BillingHistoryItem, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-gray-900">{item.date}</td>
                      <td className="py-3 font-medium text-gray-900">${item.amount}</td>
                      <td className="py-3">
                        <Badge variant={item.status === 'Paid' ? 'default' : 'destructive'}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="text-right py-3">
                                                <Button variant="link" size="sm" onClick={() => handleViewInvoice(item.invoice)} disabled={isViewingInvoice === item.invoice}>
                          {isViewingInvoice === item.invoice ? 'Loading...' : 'View'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Usage Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Usage</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Workflows</span>
                <span className="font-medium text-gray-900">{usageStats?.workflows.used} / {usageStats?.workflows.limit}</span>
              </div>
              <Progress value={usageStats ? (usageStats.workflows.used / usageStats.workflows.limit) * 100 : 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Version History Days</span>
                <span className="font-medium text-gray-900">{usageStats?.versionHistory.used} / {usageStats?.versionHistory.limit}</span>
              </div>
              <Progress value={usageStats ? (usageStats.versionHistory.used / usageStats.versionHistory.limit) * 100 : 0} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Controls Section */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-lg text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 mb-1">Cancel Subscription</p>
              <p className="text-sm text-gray-600">
                Cancelling your subscription will downgrade you to the free plan at the end of your billing cycle.
              </p>
            </div>
                        <Button variant="destructive" onClick={handleCancelSubscription} disabled={isCancelling}>
              {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageSubscriptionTab;
