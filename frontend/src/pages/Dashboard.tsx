import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflows } from '../contexts/WorkflowContext';
import { useAuth } from '../components/AuthContext';
import { usePlan } from '../components/AuthContext';
import { useToast } from '../hooks/use-toast';
import { AppLayout, PageHeader, ContentSection, GridLayout } from '../components/layout/AppLayout';
import { EnhancedCard, EnhancedCardHeader, EnhancedCardContent } from '../components/ui/EnhancedCard';
import { EnhancedButton } from '../components/ui/EnhancedButton';
import { EnhancedInput } from '../components/ui/EnhancedInput';
import { EnhancedTable } from '../components/ui/EnhancedTable';
import { StatusBadge } from '../components/ui/EnhancedBadge';
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
  BarChart3,
  Settings,
  History,
  Play,
  Pause,
  Trash2,
} from 'lucide-react';
import apiService from '../services/api';

interface DashboardStats {
  totalWorkflows: number;
  activeWorkflows: number;
  monitoredWorkflows: number;
  recentActivity: number;
  lastSync: Date | null;
  syncSuccess: number;
  syncErrors: number;
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
    syncSuccess: 0,
    syncErrors: 0,
  });
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');

  // Calculate stats from workflows
  useEffect(() => {
    if (workflows) {
      const total = workflows.length;
      const active = workflows.filter(w => w.status === 'active').length;
             const monitored = workflows.filter(w => w.autoSync).length;
       const recent = workflows.filter(w => {
         const lastActivity = new Date(w.updatedAt || w.createdAt || Date.now());
         const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
         return lastActivity > oneWeekAgo;
       }).length;

       setStats({
         totalWorkflows: total,
         activeWorkflows: active,
         monitoredWorkflows: monitored,
         recentActivity: recent,
         lastSync: lastUpdate,
         syncSuccess: workflows.filter(w => w.status === 'active').length,
         syncErrors: workflows.filter(w => w.status === 'inactive').length,
       });
    }
  }, [workflows, lastUpdate]);

  // Filter workflows based on search and status
  const filteredWorkflows = workflows?.filter(workflow => {
         const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          workflow.hubspotId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      header: 'Workflow Name',
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
                         <div className="text-sm text-gray-500">{row.hubspotId || 'No ID'}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => <StatusBadge status={value as any} />,
      sortable: true,
      align: 'center' as const,
    },
    {
      key: 'lastSync',
      header: 'Last Sync',
      render: (value: string) => (
        <div className="text-sm text-gray-600">
          {value ? new Date(value).toLocaleDateString() : 'Never'}
        </div>
      ),
      sortable: true,
      align: 'center' as const,
    },
    {
      key: 'isMonitored',
      header: 'Monitoring',
      render: (value: boolean) => (
        <StatusBadge 
          status={value ? 'active' : 'inactive'} 
          size="sm"
        />
      ),
      sortable: true,
      align: 'center' as const,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          <EnhancedButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/workflow/${row.id}/history`)}
            icon={<Eye className="w-4 h-4" />}
          >
            View
          </EnhancedButton>
          <EnhancedButton
            variant="ghost"
            size="sm"
            onClick={() => handleWorkflowAction(row.id, 'sync')}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Sync
          </EnhancedButton>
        </div>
      ),
      sortable: false,
    },
  ];

  // Handle workflow actions
  const handleWorkflowAction = async (workflowId: string, action: string) => {
    try {
      switch (action) {
        case 'sync':
          // Trigger workflow sync
          toast({
            title: "Sync initiated",
            description: "Workflow sync has been started.",
          });
          break;
        case 'delete':
          await deleteWorkflow(workflowId);
          toast({
            title: "Workflow deleted",
            description: "The workflow has been successfully deleted.",
          });
          break;
        default:
          break;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while performing the action.",
        variant: "destructive",
      });
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedWorkflows.length === 0) {
      toast({
        title: "No workflows selected",
        description: "Please select workflows to perform bulk actions.",
        variant: "destructive",
      });
      return;
    }

    try {
      switch (action) {
        case 'sync':
          toast({
            title: "Bulk sync initiated",
            description: `Syncing ${selectedWorkflows.length} workflows.`,
          });
          break;
        case 'delete':
          // Implement bulk delete
          toast({
            title: "Bulk delete",
            description: `Deleting ${selectedWorkflows.length} workflows.`,
          });
          break;
        default:
          break;
      }
      setSelectedWorkflows([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while performing bulk actions.",
        variant: "destructive",
      });
    }
  };

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Workflows',
      value: stats.totalWorkflows,
      icon: <Activity className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Active Workflows',
      value: stats.activeWorkflows,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+5%',
      changeType: 'positive' as const,
    },
    {
      title: 'Monitored',
      value: stats.monitoredWorkflows,
      icon: <Shield className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      title: 'Recent Activity',
      value: stats.recentActivity,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: '+15%',
      changeType: 'positive' as const,
    },
  ];

  return (
    <AppLayout>
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        subtitle="Monitor and manage your HubSpot workflows"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="flex items-center space-x-3">
            <EnhancedButton
              variant="outline"
              onClick={() => navigate('/workflow/new')}
              icon={<Plus className="w-4 h-4" />}
            >
              New Workflow
            </EnhancedButton>
            <EnhancedButton
              variant="primary"
              onClick={() => navigate('/settings')}
              icon={<Settings className="w-4 h-4" />}
            >
              Settings
            </EnhancedButton>
          </div>
        }
      />

      {/* Real-time Status Alert */}
      {!isConnected && (
        <ContentSection className="mb-6">
          <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <ZapOff className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Real-time updates connecting...
              </h3>
              <p className="text-sm text-yellow-700">
                Updates will appear automatically once connected.
              </p>
            </div>
          </div>
        </ContentSection>
      )}

      {/* Stats Cards */}
      <GridLayout cols={4} gap="lg" className="mb-8">
        {statsCards.map((stat, index) => (
          <EnhancedCard key={index} variant="elevated" hover>
            <EnhancedCardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">from last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <div className={stat.color}>{stat.icon}</div>
                </div>
              </div>
            </EnhancedCardContent>
          </EnhancedCard>
        ))}
      </GridLayout>

      {/* Workflows Table Section */}
      <ContentSection
        title="Workflows"
        subtitle={`${filteredWorkflows.length} workflows found`}
      >
        {/* Filters and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <EnhancedInput
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={setSearchTerm}
              icon={<Search className="w-4 h-4" />}
              size="md"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedWorkflows.length > 0 && (
              <EnhancedButton
                variant="outline"
                onClick={() => handleBulkAction('sync')}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Sync Selected ({selectedWorkflows.length})
              </EnhancedButton>
            )}
            <EnhancedButton
              variant="outline"
              onClick={() => navigate('/analytics')}
              icon={<BarChart3 className="w-4 h-4" />}
            >
              Analytics
            </EnhancedButton>
            <EnhancedButton
              variant="outline"
              onClick={() => navigate('/workflow/history')}
              icon={<History className="w-4 h-4" />}
            >
              History
            </EnhancedButton>
          </div>
        </div>

        {/* Workflows Table */}
        <EnhancedTable
          data={filteredWorkflows}
          columns={columns}
          loading={workflowsLoading}
          onRowClick={(workflow) => navigate(`/workflow/${workflow.id}/history`)}
          emptyMessage="No workflows found. Create your first workflow to get started."
        />
      </ContentSection>

      {/* Quick Actions */}
      <GridLayout cols={3} gap="lg" className="mt-8">
        <EnhancedCard variant="outlined" hover onClick={() => navigate('/workflow/new')}>
          <EnhancedCardContent>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Workflow</h3>
              <p className="text-gray-600">Set up a new workflow to monitor</p>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>

        <EnhancedCard variant="outlined" hover onClick={() => navigate('/analytics')}>
          <EnhancedCardContent>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">View Analytics</h3>
              <p className="text-gray-600">Analyze workflow performance</p>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>

        <EnhancedCard variant="outlined" hover onClick={() => navigate('/settings')}>
          <EnhancedCardContent>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
              <p className="text-gray-600">Configure your account</p>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>
      </GridLayout>
    </AppLayout>
  );
};

export default Dashboard;
