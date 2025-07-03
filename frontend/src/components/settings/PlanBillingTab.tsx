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
import { CheckCircle, Download, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import apiService from '@/services/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert } from '@/components/ui/alert';

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
  if (error) return <div className="py-8 text-center text-red-500">{error}</div>;
  if (!plan) return null;

  // HubSpot manage subscription URL
  const HUBSPOT_MANAGE_SUBSCRIPTION_URL = plan?.hubspotPortalId
    ? `https://app.hubspot.com/ecosystem/${plan.hubspotPortalId}/marketplace/apps`
    : 'https://app.hubspot.com/ecosystem/marketplace/apps';

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
                  <a
                    href={HUBSPOT_MANAGE_SUBSCRIPTION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-base font-medium hover:underline"
                  >
                    Manage Subscription in HubSpot
                  </a>
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
            <span className="text-2xl font-bold text-gray-900">{plan.planId.charAt(0).toUpperCase() + plan.planId.slice(1)} Plan</span>
            {plan.status === 'trial' && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 text-base px-3 py-1 rounded-full font-semibold"
            >
              Trial
            </Badge>
            )}
          </div>
          <div className="text-gray-600 text-base mb-6">{plan.price ? `$${plan.price}/month` : ''}</div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-base text-gray-700 font-medium">Workflows Monitored</span>
              <span className="text-base font-semibold text-gray-900">{plan.workflowsMonitoredCount}/{plan.maxWorkflows ?? '∞'}</span>
            </div>
            <Progress value={plan.maxWorkflows ? (plan.workflowsMonitoredCount / plan.maxWorkflows) * 100 : 0} className="h-2 w-full my-3" />
          </div>

          <div className="flex items-center justify-between mb-6">
            <span className="text-base text-gray-700 font-medium">Version History</span>
            <span className="text-base font-semibold text-gray-900">{plan.historyDays ? `${plan.historyDays} days retained` : 'Unlimited'}</span>
          </div>

          <hr className="my-4 border-gray-200" />

          <div className="flex items-center justify-between">
            <span className="text-base text-gray-500">Next billing on:</span>
            <span className="text-base font-semibold text-gray-900">{plan.nextBillingDate ? new Date(plan.nextBillingDate).toLocaleDateString() : 'N/A'}</span>
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
          <Button
            className="bg-blue-600 text-white"
            onClick={() => window.open(`https://app.hubspot.com/billing/${plan.hubspotPortalId || ''}`, '_blank')}
          >
            View Invoices in HubSpot
          </Button>
        </CardContent>
      </Card>

        <div className="grid grid-cols-3 gap-6">
          {/* Starter Plan */}
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">Starter</CardTitle>
              <div className="text-3xl font-bold">
                $29<span className="text-base font-normal">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Up to 25 workflows/month</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Basic Monitoring</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>30 days history</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Email Support</span>
                </div>
              </div>
              <div className="flex-grow" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="w-full mt-4" onClick={() => window.open(HUBSPOT_MANAGE_SUBSCRIPTION_URL, '_blank')}>
                    Manage in HubSpot
              </Button>
                </TooltipTrigger>
                <TooltipContent>
                  All subscription changes are managed in your HubSpot account. Clicking this button will open HubSpot's subscription management page.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            </CardContent>
          </Card>

          {/* Professional Plan */}
          <Card className="border-blue-500 border-2 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">Professional</CardTitle>
              <div className="text-3xl font-bold">
                $59<span className="text-base font-normal">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Up to 500 workflows/month</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Advanced Monitoring</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>90 days history</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Priority Support</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Custom Notifications</span>
                </div>
              </div>
              <div className="flex-grow" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 mt-4" onClick={() => window.open(HUBSPOT_MANAGE_SUBSCRIPTION_URL, '_blank')}>
                    Manage in HubSpot
              </Button>
                </TooltipTrigger>
                <TooltipContent>
                  All subscription changes are managed in your HubSpot account. Clicking this button will open HubSpot's subscription management page.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">Enterprise</CardTitle>
              <div className="text-3xl font-bold">
                $99<span className="text-base font-normal">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Unlimited workflows</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Advanced Monitoring</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Unlimited history</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>API Access</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>User Permissions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Audit Logs</span>
                </div>
              </div>
              <div className="flex-grow" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="w-full mt-4" onClick={() => window.open(HUBSPOT_MANAGE_SUBSCRIPTION_URL, '_blank')}>
                    Manage in HubSpot
              </Button>
                </TooltipTrigger>
                <TooltipContent>
                  All subscription changes are managed in your HubSpot account. Clicking this button will open HubSpot's subscription management page.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            </CardContent>
          </Card>
        </div>
    </div>
  );
};

export default PlanBillingTab;
