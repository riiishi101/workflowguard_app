import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CheckCircle, Download, HelpCircle, Info, CreditCard, Calendar, FileText, Settings, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "../ui/use-toast";
import apiService from '../../services/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Alert } from '../ui/alert';
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
      description: 'Perfect for small teams getting started',
      features: [
        '50 Workflows',
        '30 Days History',
        'Basic Monitoring',
        'Email Support',
        'Workflow Backup',
        'Version History'
      ],
      popular: false,
      recommended: false,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 59,
      description: 'For growing businesses with advanced needs',
      features: [
        '500 Workflows',
        '90 Days History',
        'Advanced Monitoring',
        'Priority Support',
        'Custom Notifications',
        'Bulk Operations',
        'Advanced Analytics'
      ],
      popular: true,
      recommended: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 199,
      description: 'Enterprise-grade solution for large organizations',
      features: [
        'Unlimited Workflows',
        'Unlimited History',
        '24/7 Support',
        'API Access',
        'User Permissions',
        'Audit Logs',
        'Custom Integrations',
        'Dedicated Support'
      ],
      popular: false,
      recommended: false,
    },
  ];

  // Trial banner logic
  const showTrialBanner = planData.isTrialActive && planData.trialPlanId === 'professional';
  const showTrialExpiredBanner = !planData.isTrialActive && planData.trialPlanId === 'professional' && planData.planId === 'trial';

  // Calculate remaining trial days
  const getRemainingTrialDays = () => {
    if (!planData.trialEndDate) return null;
    const now = new Date();
    const trialEnd = new Date(planData.trialEndDate);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const remainingTrialDays = getRemainingTrialDays();
  const isTrialActive = planData.isTrialActive && remainingTrialDays && remainingTrialDays > 0;

  const handleUpgrade = async (planId: string) => {
    try {
      setLoading(true);
      
      // For HubSpot marketplace, redirect to HubSpot billing
      if (planId === 'starter' || planId === 'professional' || planId === 'enterprise') {
        const hubspotUrl = user?.hubspotPortalId
          ? `https://app.hubspot.com/ecosystem/${user.hubspotPortalId}/marketplace/apps`
          : 'https://app.hubspot.com/ecosystem/marketplace/apps';
        
        window.open(hubspotUrl, '_blank');
        
        toast({
          title: 'Redirecting to HubSpot',
          description: 'You will be redirected to HubSpot to complete your upgrade.',
          duration: 5000,
        });
        return;
      }
      
      // Fallback for direct upgrades (if needed)
      await apiService.upgradePlan(planId);
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
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast({
        title: 'Upgrade Failed',
        description: 'Failed to upgrade plan. Please try again or contact support.',
        variant: 'destructive',
        duration: 7000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async (planId: string) => {
    try {
      setLoading(true);
      
      // For HubSpot marketplace, redirect to HubSpot billing
      const hubspotUrl = user?.hubspotPortalId
        ? `https://app.hubspot.com/ecosystem/${user.hubspotPortalId}/marketplace/apps`
        : 'https://app.hubspot.com/ecosystem/marketplace/apps';
      
      window.open(hubspotUrl, '_blank');
      
      toast({
        title: 'Redirecting to HubSpot',
        description: 'You will be redirected to HubSpot to manage your subscription.',
        duration: 5000,
      });
    } catch (error) {
      console.error('Error downgrading plan:', error);
      toast({
        title: 'Downgrade Failed',
        description: 'Failed to downgrade plan. Please try again or contact support.',
        variant: 'destructive',
        duration: 7000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = () => {
    const hubspotUrl = user?.hubspotPortalId
      ? `https://app.hubspot.com/ecosystem/${user.hubspotPortalId}/marketplace/apps`
      : 'https://app.hubspot.com/ecosystem/marketplace/apps';
    
    window.open(hubspotUrl, '_blank');
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      
      // For HubSpot marketplace, redirect to HubSpot billing
      const hubspotUrl = user?.hubspotPortalId
        ? `https://app.hubspot.com/ecosystem/${user.hubspotPortalId}/marketplace/apps`
        : 'https://app.hubspot.com/ecosystem/marketplace/apps';
      
      window.open(hubspotUrl, '_blank');
      
      toast({
        title: 'Redirecting to HubSpot',
        description: 'You will be redirected to HubSpot to manage your subscription.',
        duration: 5000,
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast({
        title: 'Cancel Failed',
        description: 'Failed to cancel subscription. Please try again or contact support.',
        variant: 'destructive',
        duration: 7000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setLoading(true);
      
      // For HubSpot marketplace, redirect to HubSpot billing
      const hubspotUrl = user?.hubspotPortalId
        ? `https://app.hubspot.com/ecosystem/${user.hubspotPortalId}/marketplace/apps`
        : 'https://app.hubspot.com/ecosystem/marketplace/apps';
      
      window.open(hubspotUrl, '_blank');
      
      toast({
        title: 'Redirecting to HubSpot',
        description: 'You will be redirected to HubSpot to reactivate your subscription.',
        duration: 5000,
      });
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast({
        title: 'Reactivation Failed',
        description: 'Failed to reactivate subscription. Please try again or contact support.',
        variant: 'destructive',
        duration: 7000,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getCurrentPlan = () => {
    return plans.find(p => p.id === planData.planId) || plans[1]; // Default to Professional
  };

  const currentPlan = getCurrentPlan();

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      {showTrialBanner && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              Professional Trial Active
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              You're currently on a 21-day free trial of the Professional plan. 
              {remainingTrialDays !== null && (
                <span className="font-medium"> {remainingTrialDays} days remaining.</span>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpgrade('professional')}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            Upgrade Now
          </Button>
        </Alert>
      )}

      {/* Trial Expired Banner */}
      {showTrialExpiredBanner && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Trial Expired - App Locked
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Your 21-day trial has ended. The app is now locked and you can only access this Settings page. 
              Upgrade to any plan to unlock all features.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpgrade('professional')}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Upgrade Now
          </Button>
        </Alert>
      )}

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Plan</span>
            <Badge variant={planData.isTrialActive ? "secondary" : "default"}>
              {planData.isTrialActive ? "Trial" : "Active"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">{currentPlan.name}</h3>
              <p className="text-gray-600">{currentPlan.description}</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                ${currentPlan.price}/month
              </p>
            </div>
            <div className="text-right">
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                className="mb-2"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Subscription
              </Button>
              <div className="text-sm text-gray-500">
                Billed monthly via HubSpot
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Available Plans</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm">
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>All plans include core workflow protection features</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === planData.planId;
            const isUpgrade = plan.price > currentPlan.price;
            const isDowngrade = plan.price < currentPlan.price;

            return (
              <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                  </div>
                )}
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-500 text-white">Recommended</Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-center">{plan.name}</CardTitle>
                  <div className="text-center">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 text-center">{plan.description}</p>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {isCurrentPlan ? (
                    <Button disabled className="w-full" variant="outline">
                      Current Plan
                    </Button>
                  ) : isUpgrade ? (
                    <Button 
                      onClick={() => handleUpgrade(plan.id)}
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Upgrade to {plan.name}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleDowngrade(plan.id)}
                      variant="outline"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Downgrade to {plan.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Billing Provider</span>
              <span className="font-medium">HubSpot Marketplace</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Next Billing Date</span>
              <span className="font-medium">
                {planData.trialEndDate ? formatDate(planData.trialEndDate) : 'Monthly'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment Method</span>
              <span className="font-medium">Managed by HubSpot</span>
            </div>
          </div>
          
          <div className="mt-6 flex space-x-3">
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              className="flex-1"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Billing
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://workflowguard.com/support', '_blank')}
              className="flex-1"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Get Help
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Workflows</span>
                <span>0 / {currentPlan.id === 'enterprise' ? '∞' : currentPlan.id === 'starter' ? '50' : '500'}</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>History Days</span>
                <span>{currentPlan.id === 'enterprise' ? '∞' : currentPlan.id === 'starter' ? '30' : '90'} days</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanBillingTab;
