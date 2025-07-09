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
import { CheckCircle, Download, HelpCircle, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import apiService from '@/services/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert } from '@/components/ui/alert';
import RoleGuard from '../../components/RoleGuard';
import { usePlan } from '../../components/AuthContext';
import { useAuth } from '../../components/AuthContext';

const PlanBillingTab = () => {
  const { toast } = useToast();
  const { plan } = usePlan();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(false); // Plan is loaded from context now
  }, [plan]);

  if (loading) return <div className="py-8 text-center text-gray-500">Loading plan...</div>;

  // Use default plan info if not loaded
  const planData = plan || {
    planId: 'starter',
    isTrialActive: false,
    trialEndDate: undefined,
    trialPlanId: undefined,
    remainingTrialDays: undefined,
  };

  // HubSpot manage subscription URL
  const HUBSPOT_MANAGE_SUBSCRIPTION_URL = user?.hubspotPortalId
    ? `https://app.hubspot.com/ecosystem/${user.hubspotPortalId}/marketplace/apps`
    : 'https://app.hubspot.com/ecosystem/marketplace/apps';

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
          <a
            href={HUBSPOT_MANAGE_SUBSCRIPTION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Upgrade Now
          </a>
        </div>
      )}
      {/* Trial Expired Banner */}
      {showTrialExpiredBanner && (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-900 rounded-lg px-6 py-4 flex items-center justify-between">
          <div>
            <span className="font-semibold">Your Professional trial has ended.</span>
            <span className="ml-2">You are now on the Starter plan. Upgrade to unlock all features!</span>
          </div>
          <a
            href={HUBSPOT_MANAGE_SUBSCRIPTION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Upgrade Now
          </a>
        </div>
      )}
      {/* Subscription Overview */}
      <Card>
        <CardHeader className="p-6 pb-0 flex flex-col items-start">
          <div className="w-full flex items-center justify-between mb-2">
            <CardTitle className="text-xl font-semibold">Your Subscription Overview</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <RoleGuard roles={['admin']}>
                  <a
                    href={HUBSPOT_MANAGE_SUBSCRIPTION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-base font-medium hover:underline"
                  >
                    Manage Subscription in HubSpot
                  </a>
                  </RoleGuard>
                </TooltipTrigger>
                <TooltipContent>
                  All subscription changes are managed in your HubSpot account. Clicking this button will open HubSpot's subscription management page.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
              <span className="text-base font-semibold text-gray-900">{/* You may want to fetch this from planData if available */}</span>
            </div>
            <Progress value={0} className="h-2 w-full my-3" />
          </div>

          <div className="flex items-center justify-between mb-6">
            <span className="text-base text-gray-700 font-medium">Version History</span>
            <span className="text-base font-semibold text-gray-900">{/* You may want to fetch this from planData if available */}</span>
          </div>

          <hr className="my-4 border-gray-200" />

          <div className="flex items-center justify-between">
            <span className="text-base text-gray-500">Next billing on:</span>
            <span className="text-base font-semibold text-gray-900">N/A</span>
          </div>

          {/* Info box below the button */}
          <Alert className="mt-6 bg-blue-50 border-blue-200 text-blue-900 p-4">
            <div className="flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0" />
              <span className="text-sm">
                All subscription changes are managed in your HubSpot account. Clicking the button above will open HubSpot's subscription management page.
              </span>
            </div>
          </Alert>
        </CardContent>
      </Card>

      {/* HubSpot Billing Message and Button */}
      <Card>
        <CardHeader>
          <CardTitle>Billing & Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-gray-700">
            All invoices and billing history are managed in your HubSpot account. You can view and download your invoices directly from HubSpot.
          </div>
          <RoleGuard roles={['admin']}>
          <Button
            className="bg-blue-600 text-white"
            onClick={() => window.open(`https://app.hubspot.com/billing/${planData.hubspotPortalId || ''}`, '_blank')}
          >
            View Invoices in HubSpot
          </Button>
          </RoleGuard>
        </CardContent>
      </Card>

      {/* Plan Cards */}
      <div className="grid grid-cols-3 gap-6">
        {plans.map((p) => (
          <Card key={p.id} className={`h-full flex flex-col ${planData.planId === p.id || (showTrialBanner && p.id === 'professional') ? 'border-blue-500 border-2' : ''}`}>
            <CardHeader>
              <CardTitle className="text-xl">{p.name}</CardTitle>
              <div className="text-3xl font-bold">
                ${p.price}<span className="text-base font-normal">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow justify-between space-y-3">
              <div className="space-y-2">
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
              {/* Plan Action Button at the bottom of the card */}
              <div className="mt-6 flex justify-center">
                {(planData.planId === p.id || (showTrialBanner && p.id === 'professional')) ? (
                  <Button disabled className="w-full bg-gray-200 text-gray-600 cursor-not-allowed">
                    {showTrialBanner && p.id === 'professional' ? 'Current Plan (Trial)' : 'Current Plan'}
                  </Button>
                ) : (
                  <Button className="w-full bg-blue-600 text-white" onClick={() => window.open(HUBSPOT_MANAGE_SUBSCRIPTION_URL, '_blank')}>Select Plan</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlanBillingTab;
