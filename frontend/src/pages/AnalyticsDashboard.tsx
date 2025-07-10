import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TopNavigation from "@/components/TopNavigation";
import MetricCards from "@/components/analytics/MetricCards";
import ChartsSection from "@/components/analytics/ChartsSection";
import AnalyticsTable from "@/components/analytics/AnalyticsTable";
import { useState, useEffect } from 'react';
import apiService from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import RoleGuard from '../components/RoleGuard';
import { usePlan, useAuth } from "@/components/AuthContext";
import UpgradeRequiredModal from "@/components/UpgradeRequiredModal";

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState('30days');
  const [plan, setPlan] = useState('all-plans');
  const [portal, setPortal] = useState('all-portals');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { plan: authPlan, hasFeature, isTrialing } = usePlan();
  const { user } = useAuth();

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiService.getBusinessIntelligence();
      setAnalytics(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load analytics');
      toast({ 
        title: 'Error', 
        description: e.message || 'Failed to load analytics', 
        variant: 'destructive', 
        duration: 5000 
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line
  }, [dateRange, plan, portal]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  if (!hasFeature('advanced_monitoring')) {
    return (
      <UpgradeRequiredModal
        isOpen={true}
        onClose={() => window.location.href = '/settings?tab=plan-billing'}
        feature="advanced analytics"
        isTrialing={isTrialing()}
        planId={authPlan?.planId}
        trialPlanId={authPlan?.trialPlanId}
      />
    );
  }

  return (
    <RoleGuard roles={['admin', 'restorer']}>
      <div className="min-h-screen bg-white">
        <TopNavigation />
        <main className="max-w-7xl mx-auto px-2 sm:px-6 py-8" role="main">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600">Gain insights into your WorkflowGuard usage, billing, and performance</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40" aria-label="Select date range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger className="w-32" aria-label="Select plan filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-plans">All Plans</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Select value={portal} onValueChange={setPortal}>
                <SelectTrigger className="w-48" aria-label="Select portal filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-portals">All HubSpot Portals</SelectItem>
                  {user?.hubspotPortalId && (
                    <SelectItem value={user.hubspotPortalId}>
                      {user.hubspotPortalId}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={refreshing || loading}
                aria-label="Refresh analytics data"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </header>

          {error ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="text-red-500 text-lg font-medium mb-2">Error Loading Analytics</div>
                <div className="text-gray-600 mb-4">{error}</div>
                <Button onClick={handleRefresh} disabled={refreshing}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <>
              <MetricCards analytics={analytics} loading={loading} />
              <ChartsSection analytics={analytics} loading={loading} />
              <AnalyticsTable analytics={analytics} loading={loading} />
            </>
          )}
        </main>
      </div>
    </RoleGuard>
  );
};

export default AnalyticsDashboard; 