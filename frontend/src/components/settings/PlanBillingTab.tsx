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

const PlanBillingTab = () => {
  const { toast } = useToast();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiService.getMyPlan()
      .then((data) => setPlan(data))
      .catch((e) => setError(e.message || 'Failed to load plan'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-8 text-center text-gray-500">Loading plan...</div>;

  // Use default plan info if not loaded
  const planData = plan || {
    planId: 'starter',
    status: 'active',
    price: 0,
    workflowsMonitoredCount: 0,
    maxWorkflows: 25,
    historyDays: 30,
    nextBillingDate: null,
    hubspotPortalId: null,
  };

  // HubSpot manage subscription URL
  const HUBSPOT_MANAGE_SUBSCRIPTION_URL = planData?.hubspotPortalId
    ? `https://app.hubspot.com/ecosystem/${planData.hubspotPortalId}/marketplace/apps`
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

  return (
    <div className="space-y-6">
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
            <span className="text-2xl font-bold text-gray-900">{planData.planId.charAt(0).toUpperCase() + planData.planId.slice(1)} Plan</span>
            {planData.status === 'trial' && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 text-base px-3 py-1 rounded-full font-semibold"
            >
              Trial
            </Badge>
            )}
          </div>
          <div className="text-gray-600 text-base mb-6">{planData.price ? `$${planData.price}/month` : ''}</div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-base text-gray-700 font-medium">Workflows Monitored</span>
              <span className="text-base font-semibold text-gray-900">{planData.workflowsMonitoredCount}/{planData.maxWorkflows ?? '∞'}</span>
            </div>
            <Progress value={planData.maxWorkflows ? (planData.workflowsMonitoredCount / planData.maxWorkflows) * 100 : 0} className="h-2 w-full my-3" />
          </div>

          <div className="flex items-center justify-between mb-6">
            <span className="text-base text-gray-700 font-medium">Version History</span>
            <span className="text-base font-semibold text-gray-900">{planData.historyDays ? `${planData.historyDays} days retained` : 'Unlimited'}</span>
          </div>

          <hr className="my-4 border-gray-200" />

          <div className="flex items-center justify-between">
            <span className="text-base text-gray-500">Next billing on:</span>
            <span className="text-base font-semibold text-gray-900">{planData.nextBillingDate ? new Date(planData.nextBillingDate).toLocaleDateString() : 'N/A'}</span>
          </div>

          {/* Info box below the button */}
          <Alert className="mt-6 bg-blue-50 border-blue-200 text-blue-900">
            <HelpCircle className="w-5 h-5 mr-2 inline-block align-text-bottom" />
            All subscription changes are managed in your HubSpot account. Clicking the button above will open HubSpot's subscription management page.
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

      {/* Subscription Management Info */}
      <Alert variant="info" className="mb-4 flex items-center">
        <Info className="w-5 h-5 mr-2 text-blue-500" />
        <span>
          <b>Manage your subscription in HubSpot:</b> To upgrade, downgrade, or cancel your plan, use the <b>Select Plan</b> or <b>Current Plan</b> buttons below. This will open HubSpot's subscription management page in a new tab.
        </span>
      </Alert>

      {/* Pricing Cards */}
      <div className="grid grid-cols-3 gap-6">
        {plans.map((p) => (
          <Card key={p.id} className={`h-full flex flex-col ${planData.planId === p.id ? 'border-blue-500 border-2' : ''}`}>
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
                {planData.planId === p.id ? (
                  <Button disabled className="w-full bg-gray-200 text-gray-600 cursor-not-allowed">Current Plan</Button>
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
