import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardsProps {
  analytics: any;
}

const MetricCards = ({ analytics }: MetricCardsProps) => {
  if (!analytics || !analytics.overview) {
    return <div className="mb-8">No metrics available.</div>;
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
    },
    {
      title: "Average Workflows/User",
      value: avgWorkflows,
      change: '',
      description: "Average number of workflows per active user",
      trend: 'up',
    },
    {
      title: "Total Revenue",
      value: `$${(overview.totalRevenue || 0).toLocaleString()}`,
      change: overview.revenueGrowth ? `${overview.revenueGrowth > 0 ? '+' : ''}${overview.revenueGrowth}%` : '',
      description: "Total subscription and overage charges",
      trend: overview.revenueGrowth > 0 ? 'up' : 'down',
    },
    {
      title: "Active Users",
      value: (overview.activeUsers || 0).toLocaleString(),
      change: '',
      description: "Number of users with at least one workflow",
      trend: 'up',
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <Card key={index} className="bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-2">
              <span className="text-sm text-gray-600">{metric.title}</span>
              <span className="text-3xl font-bold text-gray-900">{metric.value}</span>
              <div className="flex items-center space-x-1">
                {metric.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  metric.trend === "up" ? "text-green-500" : "text-red-500"
                }`}>
                  {metric.change}
                </span>
              </div>
              <p className="text-xs text-gray-500">{metric.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MetricCards; 