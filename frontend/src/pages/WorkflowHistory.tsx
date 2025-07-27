import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkflows } from '../contexts/WorkflowContext';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../hooks/use-toast';
import { AppLayout, PageHeader, ContentSection, GridLayout } from '../components/layout/AppLayout';
import { EnhancedCard, EnhancedCardHeader, EnhancedCardContent } from '../components/ui/EnhancedCard';
import { EnhancedButton } from '../components/ui/EnhancedButton';
import { EnhancedInput } from '../components/ui/EnhancedInput';
import { EnhancedTable } from '../components/ui/EnhancedTable';
import { StatusBadge } from '../components/ui/EnhancedBadge';
import {
  ArrowLeft,
  RefreshCw,
  Download,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  FileText,
  RotateCcw,
  Eye,
  GitCompare,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

interface WorkflowVersion {
  id: string;
  version: number;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
  type: 'manual' | 'auto' | 'backup';
  status: 'active' | 'inactive' | 'draft';
  changes?: string[];
  size?: number;
}

const WorkflowHistory = () => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    workflows,
    workflowsLoading,
    workflowsError,
  } = useWorkflows();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [workflow, setWorkflow] = useState<any>(null);
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [loading, setLoading] = useState(true);

  // Find current workflow
  useEffect(() => {
    if (workflows && workflowId) {
      const found = workflows.find(w => w.id === workflowId);
      setWorkflow(found);
      
      // Mock versions data - in real app this would come from API
      if (found) {
        const mockVersions: WorkflowVersion[] = [
          {
            id: 'v1',
            version: 1,
            name: found.name,
            description: 'Initial version',
            createdAt: new Date(found.createdAt),
            createdBy: user?.name || 'System',
            type: 'manual',
            status: 'active',
            changes: ['Initial workflow setup'],
            size: 1024,
          },
          {
            id: 'v2',
            version: 2,
            name: found.name,
            description: 'Updated trigger conditions',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            createdBy: user?.name || 'System',
            type: 'auto',
            status: 'active',
            changes: ['Modified trigger conditions', 'Added new actions'],
            size: 2048,
          },
          {
            id: 'v3',
            version: 3,
            name: found.name,
            description: 'Backup before major changes',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            createdBy: user?.name || 'System',
            type: 'backup',
            status: 'inactive',
            changes: ['Backup created'],
            size: 1536,
          },
        ];
        setVersions(mockVersions);
      }
      setLoading(false);
    }
  }, [workflows, workflowId, user]);

  // Filter versions
  const filteredVersions = versions.filter(version => {
    const matchesSearch = version.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         version.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || version.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Table columns
  const columns = [
    {
      key: 'version',
      header: 'Version',
      render: (value: number) => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-sm font-semibold text-blue-600">v{value}</span>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'name',
      header: 'Name',
      render: (value: string, row: WorkflowVersion) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.description}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'type',
      header: 'Type',
      render: (value: string) => (
        <StatusBadge 
          status={value === 'manual' ? 'active' : value === 'auto' ? 'running' : 'inactive'} 
          size="sm"
        />
      ),
      sortable: true,
      align: 'center' as const,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (value: Date) => (
        <div className="text-sm text-gray-600">
          <div>{value.toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">{value.toLocaleTimeString()}</div>
        </div>
      ),
      sortable: true,
      align: 'center' as const,
    },
    {
      key: 'createdBy',
      header: 'Created By',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="w-3 h-3 text-gray-600" />
          </div>
          <span className="text-sm text-gray-900">{value}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value: any, row: WorkflowVersion) => (
        <div className="flex items-center space-x-2">
          <EnhancedButton
            variant="ghost"
            size="sm"
            onClick={() => handleVersionAction(row.id, 'view')}
            icon={<Eye className="w-4 h-4" />}
          >
            View
          </EnhancedButton>
          <EnhancedButton
            variant="ghost"
            size="sm"
            onClick={() => handleVersionAction(row.id, 'restore')}
            icon={<RotateCcw className="w-4 h-4" />}
            disabled={row.status === 'active'}
          >
            Restore
          </EnhancedButton>
        </div>
      ),
      sortable: false,
    },
  ];

  // Handle version actions
  const handleVersionAction = async (versionId: string, action: string) => {
    try {
      switch (action) {
        case 'view':
          navigate(`/workflow/${workflowId}/version/${versionId}`);
          break;
        case 'restore':
          toast({
            title: "Restore initiated",
            description: "Workflow version restore has been started.",
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
    if (selectedVersions.length === 0) {
      toast({
        title: "No versions selected",
        description: "Please select versions to perform bulk actions.",
        variant: "destructive",
      });
      return;
    }

    try {
      switch (action) {
        case 'compare':
          if (selectedVersions.length === 2) {
            navigate(`/workflow/${workflowId}/compare?v1=${selectedVersions[0]}&v2=${selectedVersions[1]}`);
          } else {
            toast({
              title: "Invalid selection",
              description: "Please select exactly 2 versions to compare.",
              variant: "destructive",
            });
          }
          break;
        case 'export':
          toast({
            title: "Export initiated",
            description: `Exporting ${selectedVersions.length} versions.`,
          });
          break;
        default:
          break;
      }
      setSelectedVersions([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while performing bulk actions.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </AppLayout>
    );
  }

  if (!workflow) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Workflow not found</h2>
          <p className="text-gray-600 mb-4">The requested workflow could not be found.</p>
          <EnhancedButton onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </EnhancedButton>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Page Header */}
      <PageHeader
        title={`${workflow.name} - History`}
        subtitle="View and manage workflow versions"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard', href: '/dashboard' },
          { label: workflow.name, href: `/workflow/${workflowId}/history` },
        ]}
        actions={
          <div className="flex items-center space-x-3">
            <EnhancedButton
              variant="outline"
              onClick={() => navigate('/dashboard')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </EnhancedButton>
            <EnhancedButton
              variant="primary"
              onClick={() => handleVersionAction('current', 'create')}
              icon={<FileText className="w-4 h-4" />}
            >
              Create Snapshot
            </EnhancedButton>
          </div>
        }
      />

      {/* Workflow Info Card */}
      <EnhancedCard className="mb-8">
        <EnhancedCardContent>
          <GridLayout cols={4} gap="lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{versions.length}</div>
              <div className="text-sm text-gray-600">Total Versions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {versions.filter(v => v.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active Versions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {versions.filter(v => v.type === 'manual').length}
              </div>
              <div className="text-sm text-gray-600">Manual Snapshots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {versions.filter(v => v.type === 'auto').length}
              </div>
              <div className="text-sm text-gray-600">Auto Backups</div>
            </div>
          </GridLayout>
        </EnhancedCardContent>
      </EnhancedCard>

      {/* Versions Table Section */}
      <ContentSection
        title="Version History"
        subtitle={`${filteredVersions.length} versions found`}
      >
        {/* Filters and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <EnhancedInput
              placeholder="Search versions..."
              value={searchTerm}
              onChange={setSearchTerm}
              icon={<Search className="w-4 h-4" />}
              size="md"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="manual">Manual</option>
              <option value="auto">Auto</option>
              <option value="backup">Backup</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedVersions.length > 0 && (
              <>
                <EnhancedButton
                  variant="outline"
                  onClick={() => handleBulkAction('compare')}
                  icon={<GitCompare className="w-4 h-4" />}
                  disabled={selectedVersions.length !== 2}
                >
                  Compare ({selectedVersions.length})
                </EnhancedButton>
                <EnhancedButton
                  variant="outline"
                  onClick={() => handleBulkAction('export')}
                  icon={<Download className="w-4 h-4" />}
                >
                  Export
                </EnhancedButton>
              </>
            )}
            <EnhancedButton
              variant="outline"
              onClick={() => window.location.reload()}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </EnhancedButton>
          </div>
        </div>

        {/* Versions Table */}
        <EnhancedTable
          data={filteredVersions}
          columns={columns}
          loading={loading}
          onRowClick={(version) => handleVersionAction(version.id, 'view')}
          emptyMessage="No versions found. Create your first snapshot to get started."
        />
      </ContentSection>

      {/* Quick Actions */}
      <GridLayout cols={3} gap="lg" className="mt-8">
        <EnhancedCard variant="outlined" hover onClick={() => handleVersionAction('current', 'create')}>
          <EnhancedCardContent>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Snapshot</h3>
              <p className="text-gray-600">Save current workflow state</p>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>

        <EnhancedCard variant="outlined" hover onClick={() => navigate(`/workflow/${workflowId}/compare`)}>
          <EnhancedCardContent>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <GitCompare className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Compare Versions</h3>
              <p className="text-gray-600">Compare different versions</p>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>

        <EnhancedCard variant="outlined" hover onClick={() => navigate(`/workflow/${workflowId}`)}>
          <EnhancedCardContent>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">View Current</h3>
              <p className="text-gray-600">View current workflow</p>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>
      </GridLayout>
    </AppLayout>
  );
};

export default WorkflowHistory;
