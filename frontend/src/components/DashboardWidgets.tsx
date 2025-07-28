import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './progress';
import { Alert, AlertDescription } from './alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  Shield,
  Activity,
  BarChart3,
  Zap,
  Eye,
  RotateCcw
} from 'lucide-react';
import { useAuth } from './AuthContext';
import apiService from '@/services/api';
import { useToast } from '@/hooks/use-toast';

// Quick Stats Widget
interface QuickStatsWidgetProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  description?: string;
  onClick?: () => void;
}

const QuickStatsWidget: React.FC<QuickStatsWidgetProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  description,
  onClick
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className={`${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="ml-1">{Math.abs(change)}%</span>
            <span className="ml-1">from last month</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

// Activity Feed Widget
interface ActivityItem {
  id: string;
  type: 'workflow_created' | 'workflow_updated' | 'workflow_deleted' | 'rollback' | 'sync' | 'error';
  message: string;
  timestamp: string;
  workflowName?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface ActivityFeedWidgetProps {
  limit?: number;
  showAll?: boolean;
}

const ActivityFeedWidget: React.FC<ActivityFeedWidgetProps> = ({ limit = 5, showAll = false }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // This would fetch from the audit log
        const response = await apiService.getAuditLogs();
        setActivities(response.slice(0, limit));
      } catch (error: any) {
        toast({
          title: 'Error',
          description: 'Failed to load activity feed',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [limit, toast]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'workflow_created':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'workflow_updated':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'workflow_deleted':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'rollback':
        return <RotateCcw className="h-4 w-4 text-orange-500" />;
      case 'sync':
        return <Zap className="h-4 w-4 text-purple-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity?: ActivityItem['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-300';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest workflow activities and system events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start space-x-3 p-2 rounded-lg border-l-4 ${getSeverityColor(activity.severity)} bg-gray-50`}
              >
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.message}
                  </p>
                  {activity.workflowName && (
                    <p className="text-xs text-gray-600">
                      Workflow: {activity.workflowName}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        {!showAll && activities.length >= limit && (
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm">
              View all activity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// System Health Widget
interface SystemHealthWidgetProps {
  autoRefresh?: boolean;
}

const SystemHealthWidget: React.FC<SystemHealthWidgetProps> = ({ autoRefresh = true }) => {
  const [healthStatus, setHealthStatus] = useState({
    overall: 'healthy' as 'healthy' | 'warning' | 'error',
    database: 'healthy' as 'healthy' | 'warning' | 'error',
    hubspot: 'healthy' as 'healthy' | 'warning' | 'error',
    sync: 'healthy' as 'healthy' | 'warning' | 'error',
    lastCheck: new Date(),
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkSystemHealth = async () => {
    try {
      setLoading(true);
      // This would call a health check endpoint
      const response = await apiService.request('/health');
      setHealthStatus({
        overall: response.status === 'ok' ? 'healthy' : 'error',
        database: response.database === 'ok' ? 'healthy' : 'error',
        hubspot: response.hubspot === 'ok' ? 'healthy' : 'error',
        sync: response.sync === 'ok' ? 'healthy' : 'error',
        lastCheck: new Date(),
      });
    } catch (error) {
      setHealthStatus(prev => ({
        ...prev,
        overall: 'error',
        lastCheck: new Date(),
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSystemHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(checkSystemHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Health
          </CardTitle>
          <Button
            onClick={checkSystemHealth}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <CardDescription>
          System status and service health
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Status</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(healthStatus.overall)}
              <span className={`text-sm font-medium ${getStatusColor(healthStatus.overall)}`}>
                {healthStatus.overall.charAt(0).toUpperCase() + healthStatus.overall.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(healthStatus.database)}
                <span className={`text-xs ${getStatusColor(healthStatus.database)}`}>
                  {healthStatus.database}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">HubSpot API</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(healthStatus.hubspot)}
                <span className={`text-xs ${getStatusColor(healthStatus.hubspot)}`}>
                  {healthStatus.hubspot}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Sync Service</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(healthStatus.sync)}
                <span className={`text-xs ${getStatusColor(healthStatus.sync)}`}>
                  {healthStatus.sync}
                </span>
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500">
              Last checked: {healthStatus.lastCheck.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Usage Metrics Widget
interface UsageMetricsWidgetProps {
  showDetails?: boolean;
}

const UsageMetricsWidget: React.FC<UsageMetricsWidgetProps> = ({ showDetails = false }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    workflowsUsed: 0,
    workflowsLimit: 10,
    storageUsed: 0,
    storageLimit: 1000, // MB
    apiCallsUsed: 0,
    apiCallsLimit: 1000,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // This would fetch from the user's plan and usage
        const plan = await apiService.getMyPlan();
        const usage = await apiService.getMyAnalytics();
        
        setMetrics({
          workflowsUsed: usage.workflowsCount || 0,
          workflowsLimit: plan.maxWorkflows || 10,
          storageUsed: usage.storageUsed || 0,
          storageLimit: plan.storageLimit || 1000,
          apiCallsUsed: usage.apiCallsUsed || 0,
          apiCallsLimit: plan.apiCallsLimit || 1000,
        });
      } catch (error) {
        console.error('Failed to fetch usage metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex justify-between mb-1">
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Usage Metrics
        </CardTitle>
        <CardDescription>
          Your current plan usage and limits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Workflows</span>
              <span className={getUsageColor(getUsagePercentage(metrics.workflowsUsed, metrics.workflowsLimit))}>
                {metrics.workflowsUsed} / {metrics.workflowsLimit}
              </span>
            </div>
            <Progress 
              value={getUsagePercentage(metrics.workflowsUsed, metrics.workflowsLimit)} 
              className="h-2"
            />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Storage</span>
              <span className={getUsageColor(getUsagePercentage(metrics.storageUsed, metrics.storageLimit))}>
                {metrics.storageUsed}MB / {metrics.storageLimit}MB
              </span>
            </div>
            <Progress 
              value={getUsagePercentage(metrics.storageUsed, metrics.storageLimit)} 
              className="h-2"
            />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>API Calls</span>
              <span className={getUsageColor(getUsagePercentage(metrics.apiCallsUsed, metrics.apiCallsLimit))}>
                {metrics.apiCallsUsed} / {metrics.apiCallsLimit}
              </span>
            </div>
            <Progress 
              value={getUsagePercentage(metrics.apiCallsUsed, metrics.apiCallsLimit)} 
              className="h-2"
            />
          </div>
          
          {showDetails && (
            <div className="pt-2 border-t">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View Detailed Usage
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export {
  QuickStatsWidget,
  ActivityFeedWidget,
  SystemHealthWidget,
  UsageMetricsWidget,
}; 