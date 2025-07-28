import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from '../../hooks/use-toast';
import apiService from '../../services/api';
import { useAuth } from '../AuthContext';
import { AlertTriangle, DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react';

interface UserPlan {
  id: string;
  planId: string;
  status: string;
  trialEndDate?: string;
  nextBillingDate?: string;
}

interface OverageStats {
  totalOverages: number;
  unbilledOverages: number;
  overagePeriods: number;
  currentPeriodOverages: number;
}

export default function BillingTab() {
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [overageStats, setOverageStats] = useState<OverageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const [plan, stats] = await Promise.all([
        apiService.getMyPlan() as Promise<UserPlan>,
        apiService.getOverageStats(user?.id || '') as Promise<OverageStats>,
      ]);
      setUserPlan(plan);
      setOverageStats(stats);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getPlanDisplayName = (planId: string) => {
    const planNames: { [key: string]: string } = {
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise',
    };
    return planNames[planId] || planId;
  };

  const getPlanLimits = (planId: string) => {
    const limits: { [key: string]: { workflows: number; history: number } } = {
      starter: { workflows: 25, history: 30 },
      professional: { workflows: 500, history: 90 },
      enterprise: { workflows: -1, history: -1 }, // Unlimited
    };
    return limits[planId] || { workflows: 500, history: 90 }; // Default to professional limits
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const planLimits = getPlanLimits(userPlan?.planId || 'professional');

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Your current subscription and plan details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {getPlanDisplayName(userPlan?.planId || 'starter')} Plan
              </h3>
              <p className="text-sm text-muted-foreground">
                Status: <Badge variant={userPlan?.status === 'active' ? 'default' : 'secondary'}>
                  {userPlan?.status || 'Unknown'}
                </Badge>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/settings?tab=plan-billing'}>
              Upgrade Plan
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Workflow Limit:</span>
              <div className="font-medium">
                {planLimits.workflows === -1 ? 'Unlimited' : planLimits.workflows}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">History Retention:</span>
              <div className="font-medium">
                {planLimits.history === -1 ? 'Unlimited' : `${planLimits.history} days`}
              </div>
            </div>
            {userPlan?.trialEndDate && (
              <div>
                <span className="text-muted-foreground">Trial Ends:</span>
                <div className="font-medium">{formatDate(userPlan.trialEndDate)}</div>
              </div>
            )}
            {userPlan?.nextBillingDate && (
              <div>
                <span className="text-muted-foreground">Next Billing:</span>
                <div className="font-medium">{formatDate(userPlan.nextBillingDate)}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overage Alerts */}
      {overageStats?.unbilledOverages && overageStats.unbilledOverages > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {overageStats.unbilledOverages} unbilled overages totaling{' '}
            {formatCurrency(overageStats.unbilledOverages)}. These will be charged to your account.
          </AlertDescription>
        </Alert>
      )}

      {/* Overage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage & Overages
          </CardTitle>
          <CardDescription>
            Your usage statistics and overage history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {overageStats?.totalOverages || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Overages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {overageStats?.unbilledOverages || 0}
              </div>
              <div className="text-sm text-muted-foreground">Unbilled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {overageStats?.currentPeriodOverages || 0}
              </div>
              <div className="text-sm text-muted-foreground">This Period</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {overageStats?.overagePeriods || 0}
              </div>
              <div className="text-sm text-muted-foreground">Overage Periods</div>
            </div>
          </div>

          {/* Current Period Progress */}
          {planLimits.workflows > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Period Usage</span>
                <span>{overageStats?.currentPeriodOverages || 0} / {planLimits.workflows}</span>
              </div>
              <Progress 
                value={((overageStats?.currentPeriodOverages || 0) / planLimits.workflows) * 100} 
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Billing Actions
          </CardTitle>
          <CardDescription>
            Manage your billing and payment settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              View Billing History
            </Button>
            <Button variant="outline" size="sm">
              <CreditCard className="h-4 w-4 mr-2" />
              Update Payment Method
            </Button>
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Usage Reports
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan Upgrade Recommendations */}
      {overageStats?.overagePeriods && overageStats.overagePeriods > 2 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Consider Upgrading
            </CardTitle>
            <CardDescription className="text-orange-700">
              You've had overages in {overageStats.overagePeriods} periods. Consider upgrading to avoid future charges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => window.location.href = '/settings?tab=plan-billing'}>
              View Upgrade Options
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 