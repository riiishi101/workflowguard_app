import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TopNavigation from "@/components/TopNavigation";
import {
  Search,
  ChevronDown,
  ExternalLink,
  MoreHorizontal,
  Eye,
  RotateCcw,
  Copy,
  Download,
  Loader2,
  AlertCircle,
  Info,
  Clock,
  User,
  Activity,
  FileText,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useRequireAuth, useAuth } from '../components/AuthContext';
import RollbackConfirmModal from "@/components/RollbackConfirmModal";
import ViewDetailsModal from "@/components/ViewDetailsModal";
import apiService from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isThisWeek, isThisMonth, parseISO, subDays, subHours } from 'date-fns';
import { saveAs } from 'file-saver';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// TypeScript interfaces
interface WorkflowVersion {
  id: string;
  versionNumber: number;
  version?: string;
  dateTime?: string;
  createdAt?: string;
  modifiedBy?: {
    name?: string;
    email?: string;
    initials?: string;
  };
  changeSummary?: string;
  data?: any;
  [key: string]: any;
}

interface Workflow {
  id: string;
  name: string;
  hubspotId?: string;
  ownerId?: string;
  isLive?: boolean;
  lastModified?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  description?: string;
  [key: string]: any;
}

interface AuditLog {
  id: string;
  action: string;
  user?: {
    name?: string;
    email?: string;
  };
  userId?: string;
  timestamp?: string;
  details?: any;
  entityType?: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  [key: string]: any;
}

// Sample data for demonstration
const SAMPLE_VERSIONS: WorkflowVersion[] = [
  {
    id: 'v1',
    versionNumber: 1,
    version: 'v1.0',
    dateTime: format(subHours(new Date(), 2), 'PPpp'),
    createdAt: subHours(new Date(), 2).toISOString(),
    modifiedBy: {
      name: 'John Smith',
      email: 'john.smith@company.com',
      initials: 'JS'
    },
    changeSummary: 'Initial workflow setup with lead qualification steps'
  },
  {
    id: 'v2',
    versionNumber: 2,
    version: 'v1.1',
    dateTime: format(subDays(new Date(), 1), 'PPpp'),
    createdAt: subDays(new Date(), 1).toISOString(),
    modifiedBy: {
      name: 'Sarah Johnson',
      email: 'sarah.j@company.com',
      initials: 'SJ'
    },
    changeSummary: 'Added email notification step for qualified leads'
  },
  {
    id: 'v3',
    versionNumber: 3,
    version: 'v1.2',
    dateTime: format(subDays(new Date(), 3), 'PPpp'),
    createdAt: subDays(new Date(), 3).toISOString(),
    modifiedBy: {
      name: 'Mike Davis',
      email: 'mike.davis@company.com',
      initials: 'MD'
    },
    changeSummary: 'Updated lead scoring criteria and added follow-up task'
  },
  {
    id: 'v4',
    versionNumber: 4,
    version: 'v1.3',
    dateTime: format(subDays(new Date(), 5), 'PPpp'),
    createdAt: subDays(new Date(), 5).toISOString(),
    modifiedBy: {
      name: 'John Smith',
      email: 'john.smith@company.com',
      initials: 'JS'
    },
    changeSummary: 'Optimized workflow performance and reduced processing time'
  },
  {
    id: 'v5',
    versionNumber: 5,
    version: 'v1.4',
    dateTime: format(subDays(new Date(), 7), 'PPpp'),
    createdAt: subDays(new Date(), 7).toISOString(),
    modifiedBy: {
      name: 'Lisa Chen',
      email: 'lisa.chen@company.com',
      initials: 'LC'
    },
    changeSummary: 'Added integration with CRM system and custom fields'
  }
];

const SAMPLE_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit1',
    action: 'Workflow Viewed',
    user: { name: 'John Smith', email: 'john.smith@company.com' },
    timestamp: format(subHours(new Date(), 1), 'PPpp'),
    details: { page: 'workflow-history', action: 'view' },
    entityType: 'workflow',
    entityId: 'workflow-123',
    ipAddress: '192.168.1.100'
  },
  {
    id: 'audit2',
    action: 'Version Created',
    user: { name: 'Sarah Johnson', email: 'sarah.j@company.com' },
    timestamp: format(subDays(new Date(), 1), 'PPpp'),
    details: { version: 'v1.1', changes: 'Added email notification' },
    entityType: 'workflow-version',
    entityId: 'v2',
    oldValue: { notifications: false },
    newValue: { notifications: true },
    ipAddress: '192.168.1.101'
  },
  {
    id: 'audit3',
    action: 'Workflow Modified',
    user: { name: 'Mike Davis', email: 'mike.davis@company.com' },
    timestamp: format(subDays(new Date(), 3), 'PPpp'),
    details: { field: 'lead-scoring', action: 'update' },
    entityType: 'workflow',
    entityId: 'workflow-123',
    oldValue: { score: 50 },
    newValue: { score: 75 },
    ipAddress: '192.168.1.102'
  },
  {
    id: 'audit4',
    action: 'Snapshot Taken',
    user: { name: 'John Smith', email: 'john.smith@company.com' },
    timestamp: format(subDays(new Date(), 5), 'PPpp'),
    details: { snapshotType: 'manual', version: 'v1.3' },
    entityType: 'workflow-snapshot',
    entityId: 'snapshot-456',
    ipAddress: '192.168.1.100'
  },
  {
    id: 'audit5',
    action: 'Rollback Performed',
    user: { name: 'Lisa Chen', email: 'lisa.chen@company.com' },
    timestamp: format(subDays(new Date(), 7), 'PPpp'),
    details: { fromVersion: 'v1.4', toVersion: 'v1.3', reason: 'Performance issues' },
    entityType: 'workflow-rollback',
    entityId: 'rollback-789',
    oldValue: { version: 'v1.4' },
    newValue: { version: 'v1.3' },
    ipAddress: '192.168.1.103'
  }
];

const WorkflowHistoryDetail = () => {
  useRequireAuth();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { workflowId } = useParams();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<WorkflowVersion | null>(null);
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedModifiedBy, setSelectedModifiedBy] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditUserFilter, setAuditUserFilter] = useState('all');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [showAuditLogModal, setShowAuditLogModal] = useState(false);
  const [auditCurrentPage, setAuditCurrentPage] = useState(1);
  const [auditRowsPerPage, setAuditRowsPerPage] = useState(10);
  const [auditSearchTerm, setAuditSearchTerm] = useState("");
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [useSampleData, setUseSampleData] = useState(false);
  const [workflowData, setWorkflowData] = useState<Workflow | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState("");
  
  // Fetch workflow details
  useEffect(() => {
    if (!workflowId) return;
    console.log('🔍 WorkflowHistoryDetail: Fetching workflow with ID:', workflowId);
    setWorkflowLoading(true);
    setWorkflowError("");
    
    // First, try to get workflow from localStorage (Dashboard data)
    const savedWorkflows = localStorage.getItem('selectedWorkflows');
    console.log('🔍 WorkflowHistoryDetail: localStorage savedWorkflows:', savedWorkflows);
    
    if (savedWorkflows) {
      try {
        const workflows = JSON.parse(savedWorkflows);
        console.log('🔍 WorkflowHistoryDetail: Parsed workflows:', workflows);
        const localWorkflow = workflows.find((w: any) => w.id === workflowId || w.hubspotId === workflowId);
        console.log('🔍 WorkflowHistoryDetail: Found localWorkflow:', localWorkflow);
        
        if (localWorkflow) {
          console.log('🔍 WorkflowHistoryDetail: Found workflow in localStorage:', localWorkflow);
          setWorkflowData({
            id: localWorkflow.id || localWorkflow.hubspotId,
            name: localWorkflow.name || 'HubSpot Workflow',
            hubspotId: localWorkflow.hubspotId,
            isLive: localWorkflow.isLive || true,
            lastModified: localWorkflow.lastModified || localWorkflow.updatedAt || new Date().toISOString(),
            status: localWorkflow.status || 'active',
            description: localWorkflow.description || 'Workflow synchronized from HubSpot'
          });
          setWorkflowLoading(false);
          return;
        } else {
          console.log('🔍 WorkflowHistoryDetail: No matching workflow found in localStorage');
        }
      } catch (e) {
        console.log('Failed to parse localStorage workflows:', e);
      }
    } else {
      console.log('🔍 WorkflowHistoryDetail: No savedWorkflows in localStorage');
    }
    
    // Fallback to API call
    apiService.getWorkflowById(workflowId)
      .then((data: any) => {
        console.log('🔍 WorkflowHistoryDetail: Got workflow from API:', data);
        setWorkflowData(data as Workflow);
      })
      .catch((e) => {
        console.log('Failed to load workflow details from API:', e.message);
        setWorkflowError(e.message || "Failed to load workflow details");
        
        // ALWAYS use sample data as fallback for demo purposes
        const sampleNames = [
          'Lead Nurturing Campaign',
          'Customer Onboarding Flow',
          'Email Marketing Sequence',
          'Sales Follow-up Process',
          'Support Ticket Workflow',
          'Product Demo Scheduling',
          'Newsletter Subscription',
          'Event Registration Flow'
        ];
        const sampleName = sampleNames[parseInt(workflowId) % sampleNames.length] || 'Sample Workflow';
        
        console.log('🔍 WorkflowHistoryDetail: Using sample data with name:', sampleName);
        
        setWorkflowData({
          id: workflowId,
          name: sampleName,
          hubspotId: workflowId,
          isLive: true,
          lastModified: new Date().toISOString(),
          status: 'active',
          description: `This is a sample ${sampleName.toLowerCase()} for demonstration purposes`
        });
      })
      .finally(() => setWorkflowLoading(false));
  }, [workflowId]);
  
  useEffect(() => {
    if (!workflowId) return;
    setLoading(true);
    setError("");
    
    // Try to load real data first, fallback to sample data
    console.log('🔍 WorkflowHistoryDetail: Loading versions for workflowId:', workflowId);
    
    apiService.getWorkflowVersions(workflowId)
      .then((data) => {
        const realData = Array.isArray(data) ? data : [];
        if (realData.length > 0) {
          console.log('🔍 WorkflowHistoryDetail: Got real versions:', realData.length);
          setVersions(realData);
          setUseSampleData(false);
        } else {
          console.log('🔍 WorkflowHistoryDetail: No real versions, using sample data');
          setVersions(SAMPLE_VERSIONS);
          setUseSampleData(true);
        }
      })
      .catch((e) => {
        console.log('🔍 WorkflowHistoryDetail: API error, using sample data:', e.message);
        setVersions(SAMPLE_VERSIONS);
        setUseSampleData(true);
        setError(""); // Don't show error when using sample data
      })
      .finally(() => setLoading(false));
  }, [workflowId]);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedModifiedBy, selectedDateRange]);

  // Filtering logic
  const filteredVersions = versions.filter((version) => {
    const matchesSearch = (version.changeSummary || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModifier = selectedModifiedBy === "all" || version.modifiedBy?.name === selectedModifiedBy;
    let matchesDate = true;
    if (selectedDateRange !== "all" && version.createdAt) {
      const date = parseISO(version.createdAt);
      if (selectedDateRange === "today") matchesDate = isToday(date);
      else if (selectedDateRange === "week") matchesDate = isThisWeek(date);
      else if (selectedDateRange === "month") matchesDate = isThisMonth(date);
    }
    return matchesSearch && matchesModifier && matchesDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredVersions.length / rowsPerPage);
  const paginatedVersions = filteredVersions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Fetch audit logs for this workflow
  useEffect(() => {
    if (!workflowId) return;
    setAuditLoading(true);
    setAuditError("");
    
    // Try to load real audit logs first, fallback to sample data
    console.log('🔍 WorkflowHistoryDetail: Loading audit logs for workflowId:', workflowId);
    
    apiService.getAuditLogs(undefined, 'workflow', workflowId)
      .then((logs) => {
        const realLogs = Array.isArray(logs) ? logs : [];
        if (realLogs.length > 0) {
          console.log('🔍 WorkflowHistoryDetail: Got real audit logs:', realLogs.length);
          setAuditLogs(realLogs);
        } else {
          console.log('🔍 WorkflowHistoryDetail: No real audit logs, using sample data');
          setAuditLogs(SAMPLE_AUDIT_LOGS);
        }
      })
      .catch((e) => {
        console.log('🔍 WorkflowHistoryDetail: API error, using sample audit logs:', e.message);
        setAuditLogs(SAMPLE_AUDIT_LOGS);
        setAuditError(""); // Don't show error when using sample data
      })
      .finally(() => setAuditLoading(false));
  }, [workflowId]);

  // Reset audit log page when filters change
  useEffect(() => {
    setAuditCurrentPage(1);
  }, [auditActionFilter, auditUserFilter]);

  // Audit log pagination logic
  const auditTotalPages = Math.ceil(auditLogs.length / auditRowsPerPage);
  const paginatedAuditLogs = auditLogs.slice(
    (auditCurrentPage - 1) * auditRowsPerPage,
    auditCurrentPage * auditRowsPerPage
  );

  // Filtered audit logs (with search)
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesAction = auditActionFilter === 'all' || log.action === auditActionFilter;
    const matchesUser = auditUserFilter === 'all' || (log.user?.name || log.user?.email || log.userId) === auditUserFilter;
    const search = auditSearchTerm.toLowerCase();
    const matchesSearch =
      log.action?.toLowerCase().includes(search) ||
      (log.user?.name || '').toLowerCase().includes(search) ||
      (log.user?.email || '').toLowerCase().includes(search) ||
      (log.userId || '').toLowerCase().includes(search) ||
      (log.details ? JSON.stringify(log.details).toLowerCase() : '').includes(search) ||
      (log.entityType || '').toLowerCase().includes(search) ||
      (log.entityId || '').toLowerCase().includes(search);
    return matchesAction && matchesUser && (!auditSearchTerm || matchesSearch);
  });

  // Export filtered audit logs as CSV
  const handleExportAuditLogs = () => {
    if (!filteredAuditLogs.length) return;
    const headers = ['Action', 'User', 'Timestamp', 'Details'];
    const rows = filteredAuditLogs.map(log => [
      log.action,
      log.user?.name || log.user?.email || log.userId || 'Unknown',
      log.timestamp ? format(new Date(log.timestamp), 'PPpp') : '',
      log.details ? JSON.stringify(log.details) : '-'
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'audit-log.csv');
  };

  // Export filtered audit logs as JSON
  const handleExportAuditLogsJSON = () => {
    if (!filteredAuditLogs.length) return;
    const blob = new Blob([JSON.stringify(filteredAuditLogs, null, 2)], { type: 'application/json' });
    saveAs(blob, 'audit-log.json');
  };

  const handleAuditLogRowClick = (log: AuditLog) => {
    setSelectedAuditLog(log);
    setShowAuditLogModal(true);
  };

  // Get action icon for audit logs
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'workflow viewed':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'version created':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'workflow modified':
        return <Activity className="w-4 h-4 text-orange-500" />;
      case 'snapshot taken':
        return <Download className="w-4 h-4 text-purple-500" />;
      case 'rollback performed':
        return <RotateCcw className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get action badge color
  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'workflow viewed':
        return 'bg-blue-100 text-blue-800';
      case 'version created':
        return 'bg-green-100 text-green-800';
      case 'workflow modified':
        return 'bg-orange-100 text-orange-800';
      case 'snapshot taken':
        return 'bg-purple-100 text-purple-800';
      case 'rollback performed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TopNavigation />

      <main className="max-w-7xl mx-auto px-6 py-8">


        {/* Sample Data Alert */}
        {(useSampleData || !workflowData?.hubspotId) && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Demo Mode:</strong> Showing sample data to demonstrate functionality. 
              Connect to HubSpot to see real workflow data and version history.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {workflowLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Loading workflow...
                  </h1>
                </div>
              ) : workflowError ? (
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Workflow History: {workflowData?.name || 'Unknown Workflow'}
                  </h1>
                </div>
              ) : (
                <h1 className="text-2xl font-semibold text-gray-900">
                  Workflow History: {workflowData?.name || 'Loading...'}
                </h1>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://app.hubspot.com", "_blank")}
                className="text-blue-600"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View in HubSpot
              </Button>
              {user && user.role === 'admin' && (
              <Button
                onClick={() => {
                  if (filteredVersions.length > 0) {
                    setSelectedVersion(filteredVersions[0]);
                    setShowRollbackModal(true);
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
                disabled={filteredVersions.length === 0}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Rollback Latest
              </Button>
              )}
              {user && user.role === 'admin' && (
                <Button
                  data-snapshot-btn
                  onClick={async () => {
                    if (!workflowId) return;
                    setSnapshotLoading(true);
                    
                    // Simulate API delay for demo
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    try {
                                          // Try real API call first, fallback to demo simulation
                    try {
                      await apiService.syncWorkflowFromHubSpot(workflowId);
                      toast({ title: 'Snapshot Created', description: 'A new version was created from HubSpot.' });
                      
                      // Refresh version list from API
                      const data = await apiService.getWorkflowVersions(workflowId);
                      const realData = Array.isArray(data) ? data : [];
                      if (realData.length > 0) {
                        setVersions(realData);
                        setUseSampleData(false);
                      } else {
                        // If no real data, create demo version
                        console.log('🔍 Demo: Creating demo version after API call');
                        const newVersion: WorkflowVersion = {
                          id: `demo-${Date.now()}`,
                          versionNumber: versions.length + 1,
                          version: `v${versions.length + 1}.0`,
                          dateTime: format(new Date(), 'PPpp'),
                          createdAt: new Date().toISOString(),
                          modifiedBy: {
                            name: user?.name || 'Current User',
                            email: user?.email || 'user@example.com',
                            initials: (user?.name || 'CU').split(' ').map(n => n[0]).join('').toUpperCase()
                          },
                          changeSummary: 'Snapshot taken from HubSpot - Demo mode'
                        };
                        setVersions([newVersion, ...versions]);
                      }
                    } catch (apiError) {
                      console.log('🔍 Demo: API failed, using demo simulation:', apiError);
                      
                      // Fallback to demo simulation
                      const newVersion: WorkflowVersion = {
                        id: `demo-${Date.now()}`,
                        versionNumber: versions.length + 1,
                        version: `v${versions.length + 1}.0`,
                        dateTime: format(new Date(), 'PPpp'),
                        createdAt: new Date().toISOString(),
                        modifiedBy: {
                          name: user?.name || 'Current User',
                          email: user?.email || 'user@example.com',
                          initials: (user?.name || 'CU').split(' ').map(n => n[0]).join('').toUpperCase()
                        },
                        changeSummary: 'Snapshot taken from HubSpot - Demo mode'
                      };
                      
                      setVersions([newVersion, ...versions]);
                      toast({ 
                        title: 'Snapshot Created', 
                        description: 'A new version was created from HubSpot (Demo Mode).' 
                      });
                    }
                      
                    } catch (e: any) {
                      console.error('Demo snapshot error:', e);
                      toast({ 
                        title: 'Demo Error', 
                        description: 'Failed to create demo snapshot', 
                        variant: 'destructive' 
                      });
                    } finally {
                      setSnapshotLoading(false);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                  disabled={snapshotLoading}
                >
                  {snapshotLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Snapshot from HubSpot
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Workflow Status */}
        <div className="flex items-center justify-between mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {workflowLoading ? 'Loading...' : workflowData?.name || 'Unknown Workflow'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${workflowData?.isLive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} hover:bg-opacity-80`}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {workflowData?.isLive ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-sm text-gray-600">•</span>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last modified: {workflowData?.lastModified ? format(new Date(workflowData.lastModified), 'PPpp') : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{versions.length}</div>
            <div className="text-sm text-gray-600">versions tracked</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search history by change summary or..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedModifiedBy} onValueChange={setSelectedModifiedBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Modified By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Array.from(new Set(versions.map(v => v.modifiedBy?.name).filter(Boolean))).map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="text-blue-600" onClick={() => { setSelectedModifiedBy("all"); setSelectedDateRange("all"); setSearchTerm(""); }}>
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Version History Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
            <p className="text-sm text-gray-600 mt-1">Track all changes and modifications to this workflow</p>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                  Version
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                  Date & Time
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                  Modified By
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                  Change Summary
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <p className="text-gray-600">Loading workflow history...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                      <p className="text-red-600">{error}</p>
                      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : paginatedVersions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No versions found</h3>
                        <p className="text-gray-600 mb-4 max-w-md">
                          {searchTerm || selectedModifiedBy !== 'all' || selectedDateRange !== 'all' 
                            ? 'No versions match your current filters. Try adjusting your search criteria.'
                            : 'Take your first snapshot to start tracking workflow versions and changes.'
                          }
                        </p>
                        {!searchTerm && selectedModifiedBy === 'all' && selectedDateRange === 'all' && (
                          <Button 
                            onClick={() => {
                              if (user?.role === 'admin') {
                                // Trigger snapshot
                                const snapshotBtn = document.querySelector('[data-snapshot-btn]') as HTMLButtonElement;
                                if (snapshotBtn) snapshotBtn.click();
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Take First Snapshot
                          </Button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedVersions.map((version) => (
                  <tr key={version.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-sm">
                          {version.version}
                        </Badge>
                        {version.versionNumber === 1 && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            Initial
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {version.dateTime}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
                            {version.modifiedBy?.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-900">
                          {version.modifiedBy?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                      <p className="line-clamp-2">{version.changeSummary}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          aria-label={`View changes for ${version.version}`}
                          onClick={() => {
                            setSelectedVersion(version);
                            setShowViewDetailsModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {user && user.role === 'admin' && version.versionNumber > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-orange-600 hover:text-orange-700"
                          aria-label={`Rollback to ${version.version}`}
                          onClick={() => {
                            setSelectedVersion(version);
                            setShowRollbackModal(true);
                          }}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Rollback
                        </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Version ID
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Export Version
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <Select value={String(rowsPerPage)} onValueChange={v => setRowsPerPage(Number(v))}>
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500 ml-4">
              Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredVersions.length)} of {filteredVersions.length} versions
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Audit Log</h2>
              <p className="text-sm text-gray-600 mt-1">Complete activity trail for this workflow</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-blue-600" onClick={handleExportAuditLogs} disabled={filteredAuditLogs.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" className="text-blue-600" onClick={handleExportAuditLogsJSON} disabled={filteredAuditLogs.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search audit logs..."
                value={auditSearchTerm}
                onChange={e => setAuditSearchTerm(e.target.value)}
                className="pl-10"
                aria-label="Search audit logs"
              />
            </div>
            <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {Array.from(new Set(auditLogs.map(log => log.action).filter(Boolean))).map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={auditUserFilter} onValueChange={setAuditUserFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {Array.from(new Set(auditLogs.map(log => log.user?.name || log.user?.email || log.userId).filter(Boolean))).map(user => (
                  <SelectItem key={user} value={user}>{user}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="text-blue-600" onClick={() => { setAuditActionFilter('all'); setAuditUserFilter('all'); setAuditSearchTerm(''); }}>
              Clear Filters
            </Button>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Action</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">User</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Timestamp</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {auditLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <p className="text-gray-600">Loading audit logs...</p>
                      </div>
                    </td>
                  </tr>
                ) : auditError ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                        <p className="text-red-600">{auditError}</p>
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : paginatedAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Activity className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No audit log entries found</h3>
                          <p className="text-gray-600 mb-4 max-w-md">
                            {auditSearchTerm || auditActionFilter !== 'all' || auditUserFilter !== 'all'
                              ? 'No audit entries match your current filters. Try adjusting your search criteria.'
                              : 'Audit logs will appear here as users interact with this workflow.'
                            }
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleAuditLogRowClick(log)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-green-100 text-green-800">
                              {(log.user?.name || log.user?.email || log.userId || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-900">
                            {log.user?.name || log.user?.email || log.userId || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.timestamp ? format(new Date(log.timestamp), 'PPpp') : ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                        <p className="line-clamp-2">
                          {log.details ? (
                            typeof log.details === 'string' 
                              ? log.details 
                              : JSON.stringify(log.details)
                          ) : '-'}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <Select value={String(auditRowsPerPage)} onValueChange={v => setAuditRowsPerPage(Number(v))}>
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500 ml-4">
              Showing {((auditCurrentPage - 1) * auditRowsPerPage) + 1} to {Math.min(auditCurrentPage * auditRowsPerPage, filteredAuditLogs.length)} of {filteredAuditLogs.length} entries
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAuditCurrentPage(p => Math.max(1, p - 1))}
              disabled={auditCurrentPage === 1}
              aria-label="Previous audit log page"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {auditCurrentPage} of {auditTotalPages || 1}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAuditCurrentPage(p => Math.min(auditTotalPages, p + 1))}
              disabled={auditCurrentPage === auditTotalPages || auditTotalPages === 0}
              aria-label="Next audit log page"
            >
              Next
            </Button>
          </div>
        </div>
      </main>

      <RollbackConfirmModal
        open={showRollbackModal}
        onClose={() => { setShowRollbackModal(false); setSelectedVersion(null); }}
        onConfirm={async () => {
          if (!selectedVersion || !workflowId || !user) return;
          setLoading(true);
          try {
            await apiService.createWorkflowVersion({
              workflowId,
              versionNumber: selectedVersion.versionNumber,
              snapshotType: "restore",
              createdBy: user.id,
              data: selectedVersion.data,
            });
            toast({
              title: "Rollback Successful",
              description: `Workflow has been rolled back to version ${selectedVersion.versionNumber}.`,
              variant: 'default',
              duration: 4000,
            });
            // Refetch versions
            const data = await apiService.getWorkflowVersions(workflowId);
            setVersions(Array.isArray(data) ? data : []);
          } catch (e: any) {
            toast({
              title: "Error",
              description: e.message || "Failed to rollback workflow.",
              variant: 'destructive',
              duration: 5000,
            });
          } finally {
            setShowRollbackModal(false);
            setSelectedVersion(null);
            setLoading(false);
          }
        }}
        workflowName={selectedVersion?.version}
      />
      <ViewDetailsModal
        open={showViewDetailsModal}
        onClose={() => { setShowViewDetailsModal(false); setSelectedVersion(null); }}
        version={selectedVersion}
      />

      {/* Audit Log Details Modal */}
      <Dialog open={showAuditLogModal} onOpenChange={setShowAuditLogModal}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>
            Detailed information about the selected audit log entry.
          </DialogDescription>
          {selectedAuditLog && (
            <div className="space-y-2 mt-4">
              <div><strong>Action:</strong> {selectedAuditLog.action}</div>
              <div><strong>User:</strong> {selectedAuditLog.user?.name || selectedAuditLog.user?.email || selectedAuditLog.userId || 'Unknown'}</div>
              <div><strong>Timestamp:</strong> {selectedAuditLog.timestamp ? format(new Date(selectedAuditLog.timestamp), 'PPpp') : ''}</div>
              <div><strong>Entity Type:</strong> {selectedAuditLog.entityType}</div>
              <div><strong>Entity ID:</strong> {selectedAuditLog.entityId}</div>
              <div><strong>Old Value:</strong> <pre className="bg-gray-100 rounded p-2 overflow-x-auto text-xs">{selectedAuditLog.oldValue ? JSON.stringify(selectedAuditLog.oldValue, null, 2) : '-'}</pre></div>
              <div><strong>New Value:</strong> <pre className="bg-gray-100 rounded p-2 overflow-x-auto text-xs">{selectedAuditLog.newValue ? JSON.stringify(selectedAuditLog.newValue, null, 2) : '-'}</pre></div>
              <div><strong>IP Address:</strong> {selectedAuditLog.ipAddress || '-'}</div>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowAuditLogModal(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowHistoryDetail;
