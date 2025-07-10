import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Tooltip } from "recharts";
import { MoreHorizontal, TrendingUp, Users, Activity, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartsSectionProps {
  analytics: any;
  loading?: boolean;
}

const ChartsSection = ({ analytics, loading = false }: ChartsSectionProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-8" />
            </CardHeader>
            <CardContent className="pt-4">
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics || !analytics.usageTrends) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-gray-500">
              <AlertCircle className="h-5 w-5" />
              <span>No chart data available. Data will appear once usage patterns are established.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Line chart data
  const lineData = analytics.usageTrends.map((t: any) => ({
    month: t.period,
    workflows: t.totalWorkflows,
    fullMonth: t.period,
  }));

  // Pie chart data
  const planDistribution = analytics.planDistribution || {};
  const pieData = Object.entries(planDistribution).map(([name, users]: [string, any]) => ({
    name,
    value: users,
    color: name === 'Starter' ? '#3B82F6' : name === 'Professional' ? '#10B981' : '#F59E0B',
    users,
  }));

  const totalUsers = pieData.reduce((sum, item) => sum + (item.users || 0), 0);
  const currentMonth = lineData.length ? lineData[lineData.length - 1].workflows : 0;
  const previousMonth = lineData.length > 1 ? lineData[lineData.length - 2].workflows : 0;
  const percentageChange = previousMonth ? (((currentMonth - previousMonth) / previousMonth) * 100).toFixed(1) : '0';
  const isPositive = currentMonth > previousMonth;
  const totalWorkflows = lineData.reduce((sum: number, item: any) => sum + (item.workflows || 0), 0);
  const averageWorkflows = lineData.length ? Math.round(totalWorkflows / lineData.length) : 0;
  const maxWorkflows = Math.max(...lineData.map((item: any) => item.workflows || 0), 0);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg" role="tooltip">
          <p className="font-medium text-gray-900">{data.fullMonth}</p>
          <p className="text-blue-600 font-semibold">
            {payload[0].value.toLocaleString()} workflows
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: { active?: boolean; payload?: any }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg" role="tooltip">
          <p className="font-medium text-gray-900">{data.name} Plan</p>
          <p className="text-sm text-gray-600">{data.users.toLocaleString()} users</p>
          <p className="font-semibold" style={{ color: data.color }}>
            {data.value}% of total users
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" role="region" aria-label="Analytics charts">
      {/* Workflow Monitoring Trend Card */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-start justify-between w-full">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-gray-900">Workflow Monitoring Trend</CardTitle>
              <p className="text-sm text-gray-600">Monitoring activity over the last 6 months</p>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  isPositive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  <TrendingUp className={`h-3 w-3 ${isPositive ? 'text-green-600' : 'text-red-600 rotate-180'}`} aria-hidden="true" />
                  <span>{Math.abs(parseFloat(percentageChange))}% vs last month</span>
                </div>
                <span className="text-sm text-gray-500">
                  {currentMonth.toLocaleString()} workflows this month
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="hover:bg-gray-100" aria-label="More options">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-80" role="img" aria-label="Workflow monitoring trend chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#f1f5f9" 
                  horizontal={true}
                  vertical={false}
                />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs text-gray-500"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs text-gray-500"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dx={-10}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="workflows" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ 
                    fill: "#3B82F6", 
                    strokeWidth: 3, 
                    r: 6,
                    stroke: "#ffffff"
                  }}
                  activeDot={{ 
                    r: 8, 
                    fill: "#3B82F6",
                    stroke: "#ffffff",
                    strokeWidth: 3,
                    filter: "drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))"
                  }}
                  filter="drop-shadow(0 1px 2px rgba(59, 130, 246, 0.1))"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Detailed statistics section */}
          <div className="space-y-3 mt-6" role="list" aria-label="Workflow statistics">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150" role="listitem">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm" aria-hidden="true"></div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Current Month</span>
                  <div className="text-xs text-gray-500">{currentMonth.toLocaleString()} workflows</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">Latest</div>
                <div className="text-xs text-gray-500">current data</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150" role="listitem">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm" aria-hidden="true"></div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Peak Month</span>
                  <div className="text-xs text-gray-500">{maxWorkflows.toLocaleString()} workflows</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">Highest</div>
                <div className="text-xs text-gray-500">peak activity</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150" role="listitem">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-gray-400 shadow-sm" aria-hidden="true"></div>
                <div>
                  <span className="text-sm font-medium text-gray-900">6-Month Average</span>
                  <div className="text-xs text-gray-500">{averageWorkflows.toLocaleString()} workflows</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">Average</div>
                <div className="text-xs text-gray-500">period average</div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Data updates every hour
            </div>
            <div className="text-xs text-gray-500">
              Last updated 2 hours ago
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Distribution Card */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-start justify-between w-full">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-gray-900">Plan Distribution</CardTitle>
              <p className="text-sm text-gray-600">Current user base across subscription tiers</p>
              <div className="flex items-center space-x-2 mt-2">
                <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  <Users className="h-3 w-3 text-blue-600" aria-hidden="true" />
                  <span>{totalUsers.toLocaleString()} total users</span>
                </div>
                <span className="text-sm text-gray-500">
                  Professional plan leading
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="hover:bg-gray-100" aria-label="More options">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-80 flex items-center justify-center" role="img" aria-label="Plan distribution pie chart">
            <div className="relative">
              <ResponsiveContainer width={240} height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                        style={{
                          filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))"
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{totalUsers.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Total Users</div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3 mt-6" role="list" aria-label="Plan distribution details">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150" role="listitem">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm" 
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  ></div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    <div className="text-xs text-gray-500">{item.users.toLocaleString()} users</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{item.value}%</div>
                  <div className="text-xs text-gray-500">of total</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Data updates daily
            </div>
            <div className="text-xs text-gray-500">
              Last updated 2 hours ago
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartsSection; 