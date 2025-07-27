import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflows } from '../contexts/WorkflowContext';
import { useAuth } from '../components/AuthContext';
import { usePlan } from '../components/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import TopNavigation from '@/components/TopNavigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Eye,
  RefreshCw,
  Plus,
  Download,
  Search,
  Filter,
  MoreHorizontal,
  Zap,
  ZapOff,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Activity,
  TrendingUp,
  Shield,
} from 'lucide-react';
import apiService from '@/services/api';

interface DashboardStats {
  totalWorkflows: number;
  activeWorkflows: number;
  monitoredWorkflows: number;
  recentActivity: number;
  lastSync: Date | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, hasFeature } = usePlan();
  const { toast } = useToast();
  
  // Workflow context
  const {
    workflows,
    workflowsLoading,
    workflowsError,
    isConnected,
    lastUpdate,
    deleteWorkflow,
    addWorkflow,
  } = useWorkflows();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkflows: 0,
    activeWorkflows: 0,
    monitoredWorkflows: 0,
    recentActivity: 0,
    lastSync: null,
  });
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');

  // Calculate stats when workflows change
  useEffect(() => {
    if (workflows) {
      const activeWorkflows = workflows.filter(w => w.status === 'active').length;
      const monitoredWorkflows = workflows.filter(w => w.autoSync).length;
      
      setStats({
        totalWorkflows: workflows.length,
        activeWorkflows,
        monitoredWorkflows,
        recentActivity: workflows.filter(w => {
          const updatedAt = new Date(w.updatedAt || w.createdAt || Date.now());
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return updatedAt > oneDayAgo;
        }).length,
        lastSync: lastUpdate,
      });
    }
  }, [workflows, lastUpdate]);

  // Filter workflows based on search and status
  const filteredWorkflows = workflows?.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.hubspotId?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Handle workflow selection
  const handleWorkflowSelect = (workflowId: string) => {
    setSelectedWorkflows(prev => 
      prev.includes(workflowId) 
        ? prev.filter(id => id !== workflowId)
        : [...prev, workflowId]
    );
  };

  // Handle bulk selection
  const handleBulkSelect = () => {
    if (selectedWorkflows.length === filteredWorkflows.length) {
      setSelectedWorkflows([]);
    } else {
      setSelectedWorkflows(filteredWorkflows.map(w => w.id));
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedWorkflows.length === 0) {
      toast({
        title: 'No workflows selected',
        description: 'Please select workflows to perform this action.',
        variant: 'destructive',
      });
      return;
    }

    try {
      switch (action) {
        case 'delete':
          for (const workflowId of selectedWorkflows) {
            await deleteWorkflow(workflowId);
          }
          toast({
            title: 'Workflows deleted',
            description: `Successfully deleted ${selectedWorkflows.length} workflow(s).`,
          });
          break;
        case 'sync':
          // Trigger sync for selected workflows
          toast({
            title: 'Sync initiated',
            description: `Syncing ${selectedWorkflows.length} workflow(s)...`,
          });
          break;
      }
      setSelectedWorkflows([]);
    } catch (error) {
      toast({
        title: 'Action failed',
        description: 'Failed to perform bulk action. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle workflow actions
  const handleWorkflowAction = async (workflowId: string, action: string) => {
    try {
      switch (action) {
        case 'view':
          navigate(`/workflow-history/${workflowId}`);
          break;
        case 'sync':
          toast({
            title: 'Sync initiated',
            description: 'Workflow sync started...',
          });
          break;
        case 'delete':
          await deleteWorkflow(workflowId);
          toast({
            title: 'Workflow deleted',
            description: 'Workflow has been removed.',
          });
          break;
      }
    } catch (error) {
      toast({
        title: 'Action failed',
        description: 'Failed to perform action. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle export
  const handleExport = () => {
    const exportData = filteredWorkflows.map(w => ({
      name: w.name,
      hubspotId: w.hubspotId,
      status: w.status,
      folder: w.folder,
      autoSync: w.autoSync,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflowguard-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export completed',
      description: 'Workflow data has been exported.',
    });
  };

  if (workflowsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (workflowsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Failed to load workflows</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Monitor and manage your protected workflows</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => navigate('/workflow-selection')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Workflow
            </Button>
          </div>
        </div>
      </div>

      {/* Real-time Status Alert */}
      {!isConnected && (
        <div className="px-6 py-3">
          <Alert variant="default">
            <ZapOff className="h-4 w-4" />
            <AlertDescription>
              Real-time updates are connecting... Updates will appear automatically once connected.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Stats Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkflows}</div>
              <p className="text-xs text-muted-foreground">
                {plan?.planId === 'trial' ? `${stats.totalWorkflows}/500 used` : 'No limit'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeWorkflows}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalWorkflows > 0 ? `${Math.round((stats.activeWorkflows / stats.totalWorkflows) * 100)}% active` : 'No workflows'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monitored</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monitoredWorkflows}</div>
              <p className="text-xs text-muted-foreground">
                Auto-sync enabled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentActivity}</div>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedWorkflows.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <span className="text-sm text-blue-800">
              {selectedWorkflows.length} workflow(s) selected
            </span>
            <div className="flex space-x-2">
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Bulk actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sync">Sync Selected</SelectItem>
                  <SelectItem value="delete">Delete Selected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={() => handleBulkAction(bulkAction)}
                disabled={!bulkAction}
              >
                Apply
              </Button>
            </div>
          </div>
        )}

        {/* Workflows Table */}
        <Card>
          <CardHeader>
            <CardTitle>Protected Workflows</CardTitle>
            <CardDescription>
              Manage and monitor your HubSpot workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredWorkflows.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding workflows to protect'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={() => navigate('/workflow-selection')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Workflows
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedWorkflows.length === filteredWorkflows.length && filteredWorkflows.length > 0}
                        onChange={handleBulkSelect}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Snapshot</TableHead>
                    <TableHead>Versions</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedWorkflows.includes(workflow.id)}
                          onChange={() => handleWorkflowSelect(workflow.id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{workflow.name}</div>
                          <div className="text-sm text-gray-500">ID: {workflow.hubspotId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                          {workflow.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {workflow.autoSync ? (
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              Auto-sync
                            </div>
                          ) : (
                            'Manual'
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {/* This would be populated from workflow versions */}
                          0 versions
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {workflow.updatedAt 
                            ? new Date(workflow.updatedAt).toLocaleDateString()
                            : 'Unknown'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleWorkflowAction(workflow.id, 'view')}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleWorkflowAction(workflow.id, 'sync')}>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Sync Now
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleWorkflowAction(workflow.id, 'delete')}
                              className="text-red-600"
                            >
                              <MoreHorizontal className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
