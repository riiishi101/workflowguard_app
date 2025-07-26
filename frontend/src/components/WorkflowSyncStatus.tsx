import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './progress';
import { Alert, AlertDescription } from './alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  RotateCcw, 
  XCircle,
  Info,
  RotateCw
} from 'lucide-react';
import apiService from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface SyncStatus {
  workflowId: string;
  workflowName: string;
  hubspotId: string;
  status: 'synced' | 'syncing' | 'error' | 'pending' | 'outdated';
  lastSyncAt: string;
  nextSyncAt?: string;
  errorMessage?: string;
  progress?: number;
}

interface WorkflowSyncStatusProps {
  workflowId?: string;
  showAll?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const WorkflowSyncStatus: React.FC<WorkflowSyncStatusProps> = ({
  workflowId,
  showAll = false,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSyncStatus = async () => {
    try {
      setError(null);
      // This would be implemented in the backend
      const response = await apiService.getWorkflowSyncStatus(workflowId);
      setSyncStatuses(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sync status');
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch sync status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
  }, [workflowId]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setRefreshing(true);
      fetchSyncStatus();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const handleManualSync = async (workflowId: string) => {
    try {
      await apiService.syncWorkflowFromHubSpot(workflowId);
      toast({
        title: 'Sync Started',
        description: 'Workflow sync has been initiated',
      });
      // Refresh status after a short delay
      setTimeout(() => {
        setRefreshing(true);
        fetchSyncStatus();
      }, 2000);
    } catch (err: any) {
      toast({
        title: 'Sync Failed',
        description: err.message || 'Failed to start workflow sync',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSyncStatus();
  };

  const getStatusIcon = (status: SyncStatus['status']) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'syncing':
        return <RotateCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'outdated':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: SyncStatus['status']) => {
    const variants = {
      synced: 'default',
      syncing: 'secondary',
      error: 'destructive',
      pending: 'outline',
      outdated: 'secondary'
    } as const;

    const colors = {
      synced: 'bg-green-100 text-green-800',
      syncing: 'bg-blue-100 text-blue-800',
      error: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      outdated: 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge className={colors[status]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  const getStatusDescription = (status: SyncStatus['status']) => {
    switch (status) {
      case 'synced':
        return 'Workflow is up to date with HubSpot';
      case 'syncing':
        return 'Currently syncing with HubSpot';
      case 'error':
        return 'Sync failed - check error details';
      case 'pending':
        return 'Sync scheduled for next update';
      case 'outdated':
        return 'Workflow may be out of sync with HubSpot';
      default:
        return 'Unknown sync status';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sync className="h-5 w-5" />
            Workflow Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading sync status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sync className="h-5 w-5" />
            Workflow Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="mt-4"
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const filteredStatuses = showAll ? syncStatuses : syncStatuses.slice(0, 5);
  const hasErrors = syncStatuses.some(s => s.status === 'error');
  const hasOutdated = syncStatuses.some(s => s.status === 'outdated');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sync className="h-5 w-5" />
            <CardTitle>Workflow Sync Status</CardTitle>
            {refreshing && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <CardDescription>
          Real-time status of workflow synchronization with HubSpot
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {(hasErrors || hasOutdated) && (
          <Alert variant={hasErrors ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {hasErrors 
                ? `${syncStatuses.filter(s => s.status === 'error').length} workflow(s) have sync errors`
                : `${syncStatuses.filter(s => s.status === 'outdated').length} workflow(s) may be outdated`
              }
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {filteredStatuses.map((status) => (
            <div key={status.workflowId} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{status.workflowName}</h4>
                  {getStatusBadge(status.status)}
                </div>
                <p className="text-xs text-gray-600 mb-1">
                  {getStatusDescription(status.status)}
                </p>
                <p className="text-xs text-gray-500">
                  Last sync: {new Date(status.lastSyncAt).toLocaleString()}
                  {status.nextSyncAt && (
                    <span className="ml-2">
                      • Next sync: {new Date(status.nextSyncAt).toLocaleString()}
                    </span>
                  )}
                </p>
                {status.errorMessage && (
                  <p className="text-xs text-red-600 mt-1">
                    Error: {status.errorMessage}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                                    {status.status === 'syncing' && status.progress !== undefined && (
                      <div className="w-20">
                        <Progress value={status.progress} className="h-2" />
                      </div>
                    )}
                    {status.status !== 'syncing' && (
                      <Button
                        onClick={() => handleManualSync(status.workflowId)}
                        variant="outline"
                        size="sm"
                        disabled={status.status === 'syncing'}
                      >
                        <RotateCw className="h-3 w-3 mr-1" />
                        Sync
                      </Button>
                    )}
              </div>
            </div>
          ))}
        </div>

        {!showAll && syncStatuses.length > 5 && (
          <div className="text-center pt-2">
            <Button variant="ghost" size="sm">
              View all {syncStatuses.length} workflows
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowSyncStatus; 