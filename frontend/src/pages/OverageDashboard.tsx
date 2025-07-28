import TopNavigation from "@/components/TopNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Users,
  Calendar,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import apiService from '@/services/api';

const OverageCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  iconBg: string;
}) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
        <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
    </div>
  </div>
);

export default function OverageDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [summary, setSummary] = useState<any>(null);
  const [unbilledOverages, setUnbilledOverages] = useState<any[]>([]);
  const [allOverages, setAllOverages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [billingStatus, setBillingStatus] = useState('all-billing');
  const [period, setPeriod] = useState('all-periods');
  const [refreshing, setRefreshing] = useState(false);

  // Helper to get period filter values
  const getPeriodRange = () => {
    // Implement logic to return periodStart and periodEnd based on selected period
    // For now, return undefined for all
    return { periodStart: undefined, periodEnd: undefined };
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Summary
      const summaryData = await apiService.getOverageSummary();
      setSummary(summaryData);
      // Unbilled overages
      const unbilled = await apiService.getUnbilledOverages();
      setUnbilledOverages(Array.isArray(unbilled) ? unbilled : []);
      // All overages with filters
      const { periodStart, periodEnd } = getPeriodRange();
      let filters: any = {};
      if (billingStatus === 'billed') filters.billed = true;
      else if (billingStatus === 'unbilled') filters.billed = false;
      if (periodStart) filters.periodStart = periodStart;
      if (periodEnd) filters.periodEnd = periodEnd;
      const all = await apiService.getAllOverages(filters);
      setAllOverages(Array.isArray(all) ? all : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load overage data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
     
  }, [billingStatus, period]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleMarkAsBilled = async (overageId: string) => {
    try {
      await apiService.markOverageAsBilled(overageId);
      toast({ title: 'Marked as Billed', description: 'Overage has been marked as billed.', variant: 'default', duration: 4000 });
      fetchData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to mark as billed', variant: 'destructive', duration: 5000 });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600">Loading overage data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchData} variant="outline">Try Again</Button>
      </div>
    );
  }

  // Defensive fallback for summary
  const totalOverages = summary?.totalOverages ?? 0;
  const unbilledAmount = summary?.unbilledOverages ?? 0;
  const usersWithOverages = summary?.usersWithOverages ?? 0;
  const overagePeriods = summary?.overagePeriods ?? 0;

  return (
      <div className="min-h-screen bg-white">
        <TopNavigation />

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Overage Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor and manage usage overages across your account
            </p>
          </div>

          {/* Status Banner */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  {unbilledOverages.length} unbilled overages require attention
                </p>
                <p className="text-xs text-orange-700">
                  Total unbilled amount: ${unbilledAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <OverageCard
              title="Total Overages"
              value={`$${totalOverages.toLocaleString()}`}
              subtitle="Total overages across all accounts"
              icon={TrendingUp}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
            <OverageCard
              title="Unbilled Overages"
              value={`$${unbilledAmount.toLocaleString()}`}
              subtitle="Pending billing review"
              icon={AlertTriangle}
              iconColor="text-orange-600"
              iconBg="bg-orange-50"
            />
            <OverageCard
              title="Users with Overages"
              value={usersWithOverages.toLocaleString()}
              subtitle="Active overage accounts"
              icon={Users}
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
            />
            <OverageCard
              title="Overage Periods"
              value={overagePeriods.toLocaleString()}
              subtitle="Total billing periods"
              icon={Calendar}
              iconColor="text-green-600"
              iconBg="bg-green-50"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Select value={billingStatus} onValueChange={setBillingStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Billing Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-billing">All Billing Status</SelectItem>
                <SelectItem value="billed">Billed</SelectItem>
                <SelectItem value="unbilled">Unbilled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Periods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-periods">All Periods</SelectItem>
                <SelectItem value="current">Current Period</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-quarter">Last Quarter</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center ml-auto" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>

          {/* Unbilled Overages Section */}
          <div className="bg-white rounded-lg border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Unbilled Overages ({unbilledOverages.length})
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                These overages need to be processed for billing
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {unbilledOverages.map((overage, index) => (
                    <tr key={overage.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {overage.user?.name || overage.user?.email || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {overage.user?.email || '—'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800"
                        >
                          {overage.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ${overage.amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {overage.periodStart ? new Date(overage.periodStart).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {overage.createdAt ? new Date(overage.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="link"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleMarkAsBilled(overage.id)}
                        >
                          Mark as Billed
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Overages Section */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                All Overages
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Complete list of overages with filtering options
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allOverages.map((overage, index) => (
                    <tr key={overage.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {overage.user?.name || overage.user?.email || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {overage.user?.email || '—'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          {overage.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ${overage.amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {overage.periodStart ? new Date(overage.periodStart).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {overage.createdAt ? new Date(overage.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="secondary"
                          className={overage.billed ? 'bg-gray-100 text-gray-800' : 'bg-orange-100 text-orange-800'}
                        >
                          {overage.billed ? 'Billed' : 'Unbilled'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
  );
}
