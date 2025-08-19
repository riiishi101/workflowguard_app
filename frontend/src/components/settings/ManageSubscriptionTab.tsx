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
      setSubscription({ planId: 'starter', planName: 'Starter Plan', price: 19, paymentMethod: { last4: '1234', exp: '12/27', brand: 'Visa' } });
      setUsageStats({ workflows: { used: 6, limit: 10 }, versionHistory: { used: 15, limit: 30 } });
      setBillingHistory([
        { date: '2023-07-15', amount: '19.00', status: 'Paid', invoice: 'inv_12345' },
        { date: '2023-06-15', amount: '19.00', status: 'Paid', invoice: 'inv_12344' },
      ]);
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
    // Implementation remains the same
  };

  const handleExportHistory = async () => {
    // Implementation remains the same
  };

  const handleViewInvoice = async (invoiceId: string | undefined) => {
    // Implementation remains the same
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Manage Subscription</h1>
        <p className="text-gray-600">Control your billing, payment methods, and plan details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Current Plan Card */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Current Plan</CardTitle>
                  <CardDescription>Your active subscription details.</CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{subscription.planName || 'Starter Plan'}</h3>
                  <p className="text-4xl font-bold text-gray-800 mt-2">${subscription.price || 19}<span className="text-base font-normal text-gray-500">/month</span></p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Change Plan</Button>
                  <Button onClick={() => handleUpgrade('enterprise')}>Upgrade</Button>
                </div>
              </div>
              <div className="border-t my-6"></div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Up to {usageStats.workflows.limit} workflows</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Advanced monitoring</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Priority support</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>30-day version history</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing History Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Billing History</CardTitle>
                  <CardDescription>Your past invoices and payment records.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportHistory}>Export All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium text-gray-500 py-2">Date</th>
                    <th className="text-left font-medium text-gray-500 py-2">Amount</th>
                    <th className="text-left font-medium text-gray-500 py-2">Status</th>
                    <th className="text-right font-medium text-gray-500 py-2">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3">{item.date}</td>
                      <td className="py-3">${item.amount}</td>
                      <td><Badge variant={item.status === 'Paid' ? 'default' : 'destructive'}>{item.status}</Badge></td>
                      <td className="text-right"><Button variant="link" size="sm" onClick={() => handleViewInvoice(item.invoice)}>View</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Payment Method Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="font-medium">{subscription.paymentMethod?.brand || 'Visa'} ending in {subscription.paymentMethod?.last4 || '1234'}</p>
                  <p className="text-sm text-gray-500">Expires {subscription.paymentMethod?.exp || '12/27'}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={handleUpdatePayment}><Pencil className="w-4 h-4 mr-2"/>Update Method</Button>
            </CardContent>
          </Card>

          {/* Current Usage Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Workflows</span>
                  <span>{usageStats.workflows.used} / {usageStats.workflows.limit}</span>
                </div>
                <Progress value={(usageStats.workflows.used / usageStats.workflows.limit) * 100} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Version History Days</span>
                  <span>{usageStats.versionHistory.used} / {usageStats.versionHistory.limit}</span>
                </div>
                <Progress value={(usageStats.versionHistory.used / usageStats.versionHistory.limit) * 100} />
              </div>
            </CardContent>
          </Card>

          {/* Subscription Controls Card */}
          <Card className="border-red-500">
            <CardHeader>
              <CardTitle className="text-lg text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Cancelling your subscription will downgrade you to the free plan at the end of your billing cycle.</p>
              <Button variant="destructive" className="w-full" onClick={handleCancelSubscription}>Cancel Subscription</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManageSubscriptionTab;
