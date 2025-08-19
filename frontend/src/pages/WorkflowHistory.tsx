import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Eye,
  RotateCcw,
  Activity,
  AlertCircle,
  CheckCircle,
  History,
  Filter,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import MainAppLayout from "@/components/MainAppLayout";
import ContentSection from "@/components/ContentSection";
import RollbackConfirmModal from "@/components/RollbackConfirmModal";
import { ApiService } from "@/lib/api";

interface ProtectedWorkflow {
  id: string;
  name: string;
  status: string;
  protectionStatus: string;
  lastModified: string;
  versions: number;
  lastModifiedBy: {
    name: string;
    initials: string;
    email: string;
  };
}

interface VersionHistoryItem {
  id: string;
  version: string;
  dateTime: string;
  lastModifiedBy: string;
  changeSummary: string;
  changeType: string;
  isCurrent: boolean;
}

// Helper functions
const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "inactive":
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Activity className="h-4 w-4 text-blue-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-gray-100 text-gray-800";
    case "error":
      return "bg-red-100 text-red-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
};

const WorkflowHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [workflows, setWorkflows] = useState<ProtectedWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [rollbacking, setRollbacking] = useState<string | null>(null);
  const [rollbackModal, setRollbackModal] = useState<{open: boolean, version: any}>({
    open: false,
    version: null
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 WorkflowHistory - Fetching workflows from backend');
      
      // Try to fetch from backend API first
      try {
        const apiResponse = await ApiService.getProtectedWorkflows();
        console.log('🔍 WorkflowHistory - Backend API response:', apiResponse);
        
        // Handle ApiResponse wrapper
        const apiWorkflows = apiResponse.data || apiResponse;
        
        if (apiWorkflows && Array.isArray(apiWorkflows) && apiWorkflows.length > 0) {
          const transformedWorkflows: ProtectedWorkflow[] = apiWorkflows.map((workflow: any) => ({
            id: workflow.id,
            name: workflow.name || `Workflow ${workflow.id}`,
            status: workflow.status || 'active',
            protectionStatus: workflow.protectionStatus || 'protected',
            lastModified: workflow.lastModified || workflow.updatedAt || new Date().toLocaleDateString(),
            versions: workflow.versions?.length || 1,
            lastModifiedBy: {
              name: workflow.owner?.name || 'Unknown User',
              initials: workflow.owner?.name ? workflow.owner.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'UU',
              email: workflow.owner?.email || ''
            }
          }));
          
          setWorkflows(transformedWorkflows);
          return;
        }
      } catch (apiError) {
        console.warn('🔍 WorkflowHistory - Backend API failed, trying localStorage:', apiError);
      }
      
      // No fallback to localStorage or mock data. Only use real API data.
      setWorkflows([]);
    } catch (err: any) {
      console.error('Failed to fetch workflows:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load workflows';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (workflowId: string) => {
    setDownloading(workflowId);
    try {
      // Get the latest version of the workflow
      const version = await ApiService.downloadWorkflowVersion(workflowId, 'latest');
      
      // Create and download the file
      const blob = new Blob([JSON.stringify(version, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-${workflowId}-latest.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Complete",
        description: "Workflow version has been downloaded successfully.",
      });
    } catch (err: any) {
      console.error('Download failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to download workflow version';
      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleRollbackClick = (workflow: ProtectedWorkflow) => {
    // Convert workflow data to version format expected by RollbackConfirmModal
    const versionData = {
      id: workflow.id,
      versionNumber: 'latest',
      dateTime: workflow.lastModified,
      modifiedBy: {
        name: workflow.lastModifiedBy.name,
        initials: workflow.lastModifiedBy.initials
      },
      changeSummary: `Rollback workflow: ${workflow.name}`,
      type: 'rollback',
      status: workflow.status
    };
    setRollbackModal({ open: true, version: versionData });
  };

  const handleRollback = async () => {
    if (!rollbackModal.version) return;
    
    setRollbacking(rollbackModal.version.id);
    try {
      await ApiService.rollbackWorkflow(rollbackModal.version.id);
      toast({
        title: "Rollback Complete",
        description: "Workflow has been rolled back successfully.",
      });
      // Refresh workflows list
      fetchWorkflows();
    } catch (err: any) {
      console.error('Rollback failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to rollback workflow';
      toast({
        title: "Rollback Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setRollbacking(null);
      setRollbackModal({ open: false, version: null });
    }
  };

  // Filter workflows based on search and status
  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats for the header cards
  const activeWorkflowsCount = workflows.filter(w => w.status === 'active').length;
  const protectedWorkflowsCount = workflows.filter(w => w.protectionStatus === 'protected').length;
  const totalVersionsCount = workflows.reduce((total, workflow) => {
    return total + (workflow.versions || 0);
  }, 0);

  return (
    <MainAppLayout title="Workflow History">
      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards - Dashboard Style */}
      <ContentSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {activeWorkflowsCount}
              </div>
              <div className="text-sm text-gray-600">Active Workflows</div>
              <div className="text-xs text-gray-500 mt-1">
                {protectedWorkflowsCount} protected
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <History className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {totalVersionsCount}
              </div>
              <div className="text-sm text-gray-600">Total Versions</div>
              <div className="text-xs text-gray-500 mt-1">Across all workflows</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-purple-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {workflows.length}
              </div>
              <div className="text-sm text-gray-600">Total Workflows</div>
              <div className="text-xs text-gray-500 mt-1">Under protection</div>
            </CardContent>
          </Card>
        </div>
      </ContentSection>

      {/* Workflows Grid - Dashboard Style */}
      <ContentSection>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Workflow History ({filteredWorkflows.length})
              </h2>
              {/* Removed Back to Dashboard button as per request */}
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  placeholder="Search workflows by name..." 
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Skeleton className="h-6 w-48" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Workflows Grid */
            <div className="p-6">
              {filteredWorkflows.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Workflows Found
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== "all" 
                      ? "No workflows match your filters. Try adjusting your search criteria."
                      : "No workflows found. Add your first workflow to get started."
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredWorkflows.map((workflow) => (
                    <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(workflow.status)}
                            <div>
                              <CardTitle className="text-lg">{workflow.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="secondary"
                                  className={getStatusColor(workflow.status)}
                                >
                                  {workflow.status}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className={workflow.protectionStatus === 'protected' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                  }
                                >
                                  {workflow.protectionStatus}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Last Modified: {workflow.lastModified}</span>
                            <span>{workflow.versions} versions</span>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/workflow-history/${workflow.id}`)}
                              className="flex-1"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Full History
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(workflow.id)}
                              disabled={downloading === workflow.id}
                              className="flex-1"
                            >
                              {downloading === workflow.id ? (
                                <>
                                  <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download Latest
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRollbackClick(workflow)}
                              disabled={rollbacking === workflow.id}
                              className="flex-1"
                            >
                              {rollbacking === workflow.id ? (
                                <>
                                  <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin" />
                                  Rolling Back...
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Rollback
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ContentSection>

      {/* Rollback Confirmation Modal */}
      <RollbackConfirmModal
        open={rollbackModal.open}
        onClose={() => setRollbackModal({ open: false, version: null })}
        onConfirm={handleRollback}
        version={rollbackModal.version}
        loading={rollbacking === rollbackModal.version?.id}
      />
    </MainAppLayout>
  );
};

export default WorkflowHistory;
