import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardsProps {
  analytics: any;
  loading?: boolean;
}

const MetricCards = ({ analytics, loading = false }: MetricCardsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-48" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics || !analytics.overview) {
    return (
      <div className="mb-8">
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-gray-500">
              <AlertCircle className="h-5 w-5" />
              <span>No metrics available. Please check your data sources.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, usageTrends } = analytics;
  const totalWorkflows = usageTrends?.reduce((sum: number, t: any) => sum + (t.totalWorkflows || 0), 0) || 0;
  const avgWorkflows = overview.activeUsers ? (totalWorkflows / overview.activeUsers).toFixed(1) : '0';
  
  const metrics = [
    {
      title: "Total Workflows Monitored",
      value: totalWorkflows.toLocaleString(),
      change: overview.revenueGrowth ? `${overview.revenueGrowth > 0 ? '+' : ''}${overview.revenueGrowth}%` : '',
      description: "Total workflows actively protected across all accounts",
      trend: overview.revenueGrowth > 0 ? 'up' : 'down',
      ariaLabel: `Total workflows monitored: ${totalWorkflows.toLocaleString()}`,
    },
    {
      title: "Average Workflows/User",
      value: avgWorkflows,
      change: '',
      description: "Average number of workflows per active user",
      trend: 'up' as const,
      ariaLabel: `Average workflows per user: ${avgWorkflows}`,
    },
    {
      title: "Total Revenue",
      value: `$${(overview.totalRevenue || 0).toLocaleString()}`,
      change: overview.revenueGrowth ? `${overview.revenueGrowth > 0 ? '+' : ''}${overview.revenueGrowth}%` : '',
      description: "Total subscription and overage charges",
      trend: overview.revenueGrowth > 0 ? 'up' : 'down',
      ariaLabel: `Total revenue: $${(overview.totalRevenue || 0).toLocaleString()}`,
    },
    {
      title: "Active Users",
      value: (overview.activeUsers || 0).toLocaleString(),
      change: '',
      description: "Number of users with at least one workflow",
      trend: 'up' as const,
      ariaLabel: `Active users: ${(overview.activeUsers || 0).toLocaleString()}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" role="region" aria-label="Key metrics overview">
      {metrics.map((metric, index) => (
        <Card key={index} className="bg-white hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-2" role="article" aria-label={metric.ariaLabel}>
              <span className="text-sm text-gray-600 font-medium">{metric.title}</span>
              <span className="text-3xl font-bold text-gray-900" role="text" aria-live="polite">
                {metric.value}
              </span>
              {metric.change && (
                <div className="flex items-center space-x-1" role="status" aria-live="polite">
                  {metric.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-500" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" aria-hidden="true" />
                  )}
                  <span className={`text-sm font-medium ${
                    metric.trend === "up" ? "text-green-500" : "text-red-500"
                  }`}>
                    {metric.change}
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-500">{metric.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MetricCards; 