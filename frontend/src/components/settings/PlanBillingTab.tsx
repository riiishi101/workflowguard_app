import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download, HelpCircle, Info, CreditCard, Calendar, FileText, Settings, AlertTriangle, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import apiService from '@/services/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert } from '@/components/ui/alert';
import { usePlan } from '../../components/AuthContext';
import { useAuth } from '../../components/AuthContext';

const PlanBillingTab = () => {
  const { toast } = useToast();
  const { plan, setPlan } = usePlan();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [showManageSubscription, setShowManageSubscription] = useState(false);

  useEffect(() => {
    setLoading(false); // Plan is loaded from context now
  }, [plan]);

  if (loading) return <div className="py-8 text-center text-gray-500">Loading plan...</div>;

  // Use default plan info if not loaded
  const planData = plan || {
    planId: 'professional',
    isTrialActive: true,
    trialEndDate: undefined,
    trialPlanId: 'professional',
    remainingTrialDays: undefined,
  };

  // Plan definitions for display
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      workflows: 25,
      history: 30,
      features: ['Basic Monitoring', 'Email Support'],
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 59,
      workflows: 500,
      history: 90,
      features: ['Advanced Monitoring', 'Priority Support', 'Custom Notifications'],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 129,
      workflows: null,
      history: null,
      features: ['Unlimited Workflows', '24/7 Support', 'API Access', 'User Permissions', 'Audit Logs'],
    },
  ];

  // Trial banner logic
  const showTrialBanner = planData.isTrialActive && planData.trialPlanId === 'professional';
  const showTrialExpiredBanner = !planData.isTrialActive && planData.trialPlanId === 'professional' && planData.planId === 'starter';

  const handleUpgrade = async (planId: string) => {
    try {
      setLoading(true);
      await apiService.upgradePlan(planId);
      // Refetch plan status
      const res = await apiService.getMyPlan() as any;
      setPlan({
        planId: res.planId || 'professional',
        isTrialActive: res.status === 'trial',
        trialEndDate: res.trialEndDate,
        trialPlanId: res.trialPlanId || 'professional',
        remainingTrialDays: res.trialEndDate ? Math.max(0, Math.ceil((new Date(res.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : undefined
      });
      toast({
        title: 'Plan Upgraded',
        description: `You have successfully upgraded to the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan.`,
        duration: 7000,
      });
    } catch (e: any) {
      toast({
        title: 'Upgrade Failed',
        description: e.message || 'Failed to upgrade plan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = () => {
    setShowManageSubscription(true);
  };

  const handleCancelSubscription = async () => {
    try {
      // This would integrate with HubSpot marketplace for actual cancellation
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription will be cancelled at the end of the current billing period.',
      });
    } catch (e: any) {
      toast({
        title: 'Cancellation Failed',
        description: e.message || 'Failed to cancel subscription',
        variant: 'destructive',
      });
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      // This would integrate with HubSpot marketplace for reactivation
      toast({
        title: 'Subscription Reactivated',
        description: 'Your subscription has been reactivated successfully.',
      });
    } catch (e: any) {
      toast({
        title: 'Reactivation Failed',
        description: e.message || 'Failed to reactivate subscription',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      {showTrialBanner && (
        <div className="bg-blue-100 border border-blue-300 text-blue-900 rounded-lg px-6 py-4 flex items-center justify-between">
          <div>
            <span className="font-semibold">You are currently on a 21-day Professional Plan trial!</span>
            {typeof planData.remainingTrialDays === 'number' && (
              <span className="ml-2">{planData.remainingTrialDays} days remaining.</span>
            )}
          </div>
        </div>
      )}
      {/* Trial Expired Banner */}
      {showTrialExpiredBanner && (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-900 rounded-lg px-6 py-4 flex items-center justify-between">
          <div>
            <span className="font-semibold">Your Professional trial has ended.</span>
            <span className="ml-2">You are now on the Starter plan. Upgrade to unlock all features!</span>
          </div>
        </div>
      )}
      {/* Subscription Overview */}
      <Card>
        <CardHeader className="p-6 pb-0 flex flex-col items-start">
          <div className="w-full flex items-center justify-between mb-2">
            <CardTitle className="text-xl font-semibold">Your Subscription Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl font-bold text-gray-900">
              {planData.planId.charAt(0).toUpperCase() + planData.planId.slice(1)} Plan
            </span>
            {showTrialBanner && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 text-base px-3 py-1 rounded-full font-semibold"
            >
              Trial
            </Badge>
            )}
            {showTrialExpiredBanner && (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800 text-base px-3 py-1 rounded-full font-semibold"
              >
                Trial Ended
              </Badge>
            )}
          </div>
          <div className="text-gray-600 text-base mb-6">
            {(() => {
              const currentPlan = plans.find(p => p.id === planData.planId);
              return currentPlan && currentPlan.price ? `$${currentPlan.price}/month` : '';
            })()}
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-base text-gray-700 font-medium">Workflows Monitored</span>
              <span className="text-base font-semibold text-gray-900"></span>
            </div>
            <Progress value={0} className="h-2 w-full my-3" />
          </div>

          <div className="flex items-center justify-between mb-6">
            <span className="text-base text-gray-700 font-medium">Version History</span>
            <span className="text-base font-semibold text-gray-900"></span>
          </div>

          <hr className="my-4 border-gray-200" />

          <div className="flex items-center justify-between">
            <span className="text-base text-gray-500">Next billing on:</span>
            <span className="text-base font-semibold text-gray-900">N/A</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <Card key={p.id} className={`h-full flex flex-col ${planData.planId === p.id ? 'border-blue-500 border-2' : ''}`}> 
            <CardHeader>
              <CardTitle className="text-xl">{p.name}</CardTitle>
              <div className="text-3xl font-bold">
                ${p.price}<span className="text-base font-normal">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow justify-between space-y-3">
              <div className="space-y-2 mb-8">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{p.workflows ? `Up to ${p.workflows} workflows/month` : 'Unlimited workflows'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{p.history ? `${p.history} days history` : 'Unlimited history'}</span>
                </div>
                {p.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                {planData.planId === p.id ? (
                  <Button disabled className="w-full bg-gray-200 text-gray-600 cursor-not-allowed">
                    Current Plan
                  </Button>
                ) : (
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleUpgrade(p.id)}>
                    Select Plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Manage Subscription Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Manage Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subscription Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium">HubSpot Marketplace</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Billing Cycle</p>
                <p className="font-medium">Monthly</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <FileText className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Invoices</p>
                <p className="font-medium">Available in HubSpot</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleManageSubscription}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage in HubSpot
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('https://app.hubspot.com/ecosystem/marketplace/apps', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Billing History
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('/help', '_blank')}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Billing Support
            </Button>
          </div>

          {/* Important Notes */}
          <Alert>
            <Info className="h-4 w-4" />
            <div>
              <h4 className="font-medium">Important Information</h4>
              <p className="text-sm text-gray-600 mt-1">
                Your subscription is managed through the HubSpot Marketplace. To make changes to your billing, 
                payment method, or view invoices, please visit your HubSpot account settings.
              </p>
            </div>
          </Alert>

          {/* Trial Information */}
          {showTrialBanner && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">Trial Period Active</h4>
                <p className="text-sm text-blue-700 mt-1">
                  You're currently on a free trial. No charges will be made until your trial ends. 
                  You can upgrade or cancel at any time during the trial period.
                </p>
              </div>
            </Alert>
          )}

          {/* Cancellation Warning */}
          {!showTrialBanner && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-900">Cancellation Policy</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Cancelling your subscription will stop billing at the end of your current period. 
                  You'll continue to have access to all features until then.
                </p>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanBillingTab;
