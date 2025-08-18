import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ApiService } from '@/lib/api';

const ManageSubscriptionTab = () => {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      setSubscription(subRes.data);
      setUsageStats(usageRes.data);
      setBillingHistory(billingRes.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load billing/subscription info',
        variant: 'destructive',
      });
      setSubscription({ planId: 'starter', planName: 'Starter Plan', price: 19 });
      setUsageStats({ workflows: { used: 0, limit: 10 }, versionHistory: { used: 0, limit: 30 } });
      setBillingHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  // Helper to dynamically load Razorpay script
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
    try {
      toast({ title: 'Processing...', description: 'Opening payment...' });
      await loadRazorpayScript();
      const resp = await ApiService.createRazorpayOrder(planId);
      const order = resp.data;
      if (!order.id) throw new Error('Failed to create payment order');
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || window.RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'WorkflowGuard',
        description: `Upgrade to ${planId} plan`,
        order_id: order.id,
        prefill: {
          email: subscription.email || '',
        },
        handler: async function (paymentResult: any) {
          try {
            await ApiService.confirmRazorpayPayment({
              planId,
              paymentId: paymentResult.razorpay_payment_id,
              orderId: order.id,
              signature: paymentResult.razorpay_signature
            });
            toast({ title: 'Upgrade Complete', description: `You have been upgraded to ${planId}!` });
            fetchAllData();
          } catch (err: any) {
            toast({ title: 'Payment Processing Error', description: err.message, variant: 'destructive' });
          }
        },
        theme: { color: '#2563eb' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast({ title: 'Upgrade Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await ApiService.cancelSubscription();
      toast({ title: 'Subscription Cancelled', description: 'Your subscription will not renew.' });
      fetchAllData();
    } catch (error: any) {
      toast({ title: 'Cancel Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdatePayment = async () => {
    try {
      toast({ title: 'Processing...', description: 'Opening payment method update modal...' });
      await loadRazorpayScript();
      const resp = await ApiService.createRazorpayPaymentMethodOrder();
      const order = resp.data;
      if (!order.id && !order.customer_id) throw new Error('Failed to create payment method order');
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || window.RAZORPAY_KEY_ID,
        customer_id: order.customer_id,
        method: 'card',
        name: 'WorkflowGuard',
        description: 'Update Payment Method',
        theme: { color: '#2563eb' },
        handler: async function (paymentMethodResult: any) {
          try {
            await ApiService.saveRazorpayPaymentMethod({
              customerId: order.customer_id,
              paymentMethodId: paymentMethodResult.razorpay_payment_id || paymentMethodResult.razorpay_payment_method_id,
              signature: paymentMethodResult.razorpay_signature,
            });
            toast({ title: 'Payment Method Updated', description: 'Future billing will charge this method.' });
            fetchAllData();
          } catch (err: any) {
            toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleExportHistory = async () => {
    try {
      const res = await ApiService.downloadBillingHistoryCSV();
      const blob = new Blob([res.data as any], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'billing-history.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Export', description: 'Billing history exported.' });
    } catch (error: any) {
      toast({ title: 'Export Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleViewInvoice = async (invoiceId: string | undefined) => {
    if (!invoiceId) {
      toast({ title: 'No Invoice', description: 'No invoice available for this payment.' });
      return;
    }
    // Can be a direct Razorpay invoice URL or API download from your backend
    const invoiceUrl = `https://dashboard.razorpay.com/app/invoices/${invoiceId}`;
    window.open(invoiceUrl, '_blank');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="max-w-6xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Manage Your Subscription</h1>
        <p className="text-gray-600">Control your billing, payment methods, and plan details</p>
      </div>
      <div className="space-y-12">
        {/* Current Plan */}
        <Card>
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-gray-500 uppercase tracking-wide">CURRENT PLAN</span>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {subscription.planName || 'Professional Plan'}
                </h2>
                <div className="text-2xl font-bold text-gray-900">
                  ${subscription.price || 49.00}
                  <span className="text-sm font-normal text-gray-500">/month</span>
                </div>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">
                  Up to {usageStats.workflows.limit} workflows ({usageStats.workflows.used}/{usageStats.workflows.limit} used)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">Advanced monitoring</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">Priority support</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleUpgrade('enterprise')}>
                Upgrade to Enterprise
              </Button>
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                Change Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
              <Button variant="link" className="text-blue-600 p-0 h-auto" onClick={handleUpdatePayment}>
                Update Payment Method
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">•••• •••• •••• 1234</span>
              <span className="text-gray-500 text-sm">Expires 12/27 • Visa</span>
            </div>
          </CardContent>
        </Card>

        {/* Next Billing */}
        <Card>
          <CardContent className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Next Billing</h3>
            <p className="text-gray-700 mb-2">
              Your next payment of ${subscription.price || 49.00} will be charged on {subscription.nextBillingDate || 'TBD'}
            </p>
            <Button variant="link" className="text-blue-600 p-0 h-auto">
              Update Billing Cycle
            </Button>
          </CardContent>
        </Card>

        {/* Current Usage */}
        <Card>
          <CardContent className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Usage</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Workflows</span>
                  <span className="text-gray-700">{usageStats.workflows.used}/{usageStats.workflows.limit}</span>
                </div>
                <Progress value={Math.round((usageStats.workflows.used / usageStats.workflows.limit) * 100)} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Version History</span>
                  <span className="text-gray-700">{usageStats.versionHistory.used}/{usageStats.versionHistory.limit}</span>
                </div>
                <Progress value={Math.round((usageStats.versionHistory.used / usageStats.versionHistory.limit) * 100)} className="h-2" />
              </div>
            </div>
            {usageStats.workflows.used >= usageStats.workflows.limit * 0.8 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-800 text-sm">You're approaching your workflow limit</p>
                  <Button variant="link" className="text-blue-600 p-0 h-auto text-sm" onClick={() => handleUpgrade('professional')}>
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
              <Button variant="link" className="text-blue-600 p-0 h-auto" onClick={handleExportHistory}>
                Export All
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Amount</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900">{item.date}</td>
                      <td className="py-3 text-gray-900">${item.amount}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.status === 'Paid' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className={`text-sm ${item.status === 'Paid' ? 'text-green-700' : 'text-red-700'}`}>{item.status}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <Button variant="link" className={`p-0 h-auto text-sm ${item.status === 'Failed' ? 'text-red-600' : 'text-blue-600'}`} onClick={() => handleViewInvoice(item.invoice)}>
                          {item.invoice}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Button variant="link" className="text-blue-600 p-0 h-auto">
                View All Invoices
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Controls */}
        <Card>
          <CardContent className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Controls</h3>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-red-600 mb-3">Danger Zone</h4>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={handleCancelSubscription}>
                Cancel Subscription
              </Button>
            </div>
            <p className="text-sm text-gray-500">Your plan will remain active until {subscription.nextBillingDate || 'end of current period'}.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default ManageSubscriptionTab;
