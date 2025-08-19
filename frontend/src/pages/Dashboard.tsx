import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkflows } from "@/hooks/use-workflows";
import { useWorkflowStats } from "@/hooks/use-workflow-stats";
import { useWorkflowActions } from "@/hooks/use-workflow-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import MainAppLayout from "@/components/MainAppLayout";
import ContentSection from "@/components/ContentSection";
import EmptyDashboard from "@/components/EmptyDashboard";
import RollbackConfirmModal from "@/components/RollbackConfirmModal";
import { WorkflowState } from "@/lib/workflowState";
import { ApiService } from "@/lib/api";
import WorkflowService from "../services/WorkflowService";
import {
  Search,
  Plus,
  Download,
  CheckCircle,
  TrendingUp,
  Users,
  Eye,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Shield,
  Clock,
  Activity
} from "lucide-react";

interface DashboardWorkflow {
  id: string;
  name: string;
  versions: number;
  lastModifiedBy: {
    name: string;
    initials: string;
    email: string;
  };
  status: "active" | "inactive" | "error";
  protectionStatus: "protected" | "unprotected" | "error";
  lastModified: string;
}

interface DashboardStats {
  totalWorkflows: number;
  activeWorkflows: number;
  protectedWorkflows: number;
  totalVersions: number;
  uptime: number;
  lastSnapshot: string;
  planCapacity: number;
  planUsed: number;
}

const Dashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<DashboardWorkflow | null>(null);

  // Use our custom hooks
  const { 
    workflows, 
    loading, 
    error: fetchError, 
    refetch: refreshWorkflows,
    loading: isRefreshing 
  } = useWorkflows({
    autoRefresh: true,
    refreshInterval: 30000
  } as const);

  const stats = useWorkflowStats(workflows);
  const { 
    handleRollback,
    handleExport,
    loadingStates: rollbacking,
    isLoading: checkLoading
  } = useWorkflowActions();

  const refreshDashboard = () => {
    refreshWorkflows();
    toast({
      title: "Dashboard Refreshed",
      description: "Dashboard data has been updated successfully.",
    });
  };

  // Removed useEffect as data fetching is handled by useWorkflows hook

  const handleViewHistory = (workflowId: string, workflowName: string) => {
    console.log('🔍 Dashboard - handleViewHistory called with:', {
      workflowId,
      workflowName
    });
    
    // Store the current workflow context for the history page
    localStorage.setItem('currentWorkflow', JSON.stringify({ id: workflowId, name: workflowName }));
    
    navigate(`/workflow-history/${workflowId}`, {
      state: { workflowName },
    });
  };

  const handleRollbackLatest = (workflow: DashboardWorkflow) => {
    // Check if workflow has versions to rollback
    if (workflow.versions === 0) {
      toast({
        title: "No Versions Available",
        description: "This workflow has no versions to rollback to.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedWorkflow(workflow);
    setShowRollbackModal(true);
  };

  const handleConfirmRollback = async () => {
    if (!selectedWorkflow) return;
    await handleRollback(selectedWorkflow.id);
    setShowRollbackModal(false);
    setSelectedWorkflow(null);
  };

  const handleAddWorkflow = async () => {
    try {
      // Fetch current subscription status
      const subscriptionResponse = await ApiService.getSubscription();
      const subscription = subscriptionResponse.data;
      
      if (subscription && subscription.planUsed >= subscription.planCapacity) {
        toast({
          title: "Plan Limit Reached",
          description: "You've reached your plan limit. Please upgrade to add more workflows.",
          variant: "destructive",
        });
        return;
      }
      
      navigate("/workflow-selection");
    } catch (error) {
      console.error('Failed to check plan limits:', error);
      // Proceed anyway if check fails
      navigate("/workflow-selection");
    }
  };

  // Removed handleExportData as we use handleExport from useWorkflowActions hook

  // Filter workflows
  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      const matchesSearch =
        workflow.name?.toLowerCase().includes(searchTerm?.toLowerCase() || "") ?? true;
      const matchesStatus =
        statusFilter === "all" || workflow.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [workflows, searchTerm, statusFilter]);

  // Get filtered stats
  const filteredStats = useMemo(() => {
    return {
      total: filteredWorkflows.length,
      active: filteredWorkflows.filter(w => w.status === 'active').length,
      inactive: filteredWorkflows.filter(w => w.status === 'inactive').length,
      error: filteredWorkflows.filter(w => w.status === 'error').length,
    };
  }, [filteredWorkflows]);

  const getStatusColor = (status: string | undefined) => {
    if (!status || typeof status !== 'string') {
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "inactive":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      case "error":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getProtectionStatusColor = (status: string | undefined) => {
    if (!status) {
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    }
    switch (status.toLowerCase()) {
      case "protected":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "unprotected":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "error":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"; // Fallback for unknown status
    }
  };

  // Helper function to safely convert any value to string for rendering
  const safeToString = (value: any, fallback: string = 'Unknown'): string => {
    if (value === null || value === undefined) {
      return fallback;
    }
    if (typeof value === 'object') {
      // If it's a Date object, format it
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      // For other objects, return fallback to avoid rendering [object Object]
      return fallback;
    }
    return String(value);
  };

  if (loading) {
    return (
      <MainAppLayout title="Dashboard Overview">
        <ContentSection>
          <div className="space-y-6">
            {/* Loading Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-center gap-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Setting Up Your Dashboard
                </p>
                <p className="text-xs text-blue-800">
                  Loading your protected workflows and dashboard statistics...
                </p>
              </div>
            </div>

            {/* Loading Skeleton for Status Banner */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <Skeleton className="h-6 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>

            {/* Loading Skeleton for Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-8 w-8 mb-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Loading Skeleton for Workflows Table */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </ContentSection>
      </MainAppLayout>
    );
  }

  // Refactor empty state handling to improve UI consistency
  if (!loading && workflows.length === 0) {
    return (
      <MainAppLayout title="Dashboard Overview">
        <ContentSection>
          <div className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Workflows Found
            </h3>
            <p className="text-gray-600 text-base mb-6 max-w-lg">
              It looks like you haven't added any workflows yet. Start by adding your first workflow to get started with WorkflowGuard.
            </p>
            <Button
              onClick={handleAddWorkflow}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow"
            >
              + Add Workflow
            </Button>
          </div>
        </ContentSection>
      </MainAppLayout>
    );
  }

  // Calculate active and protected workflows count for stats cards
  const activeWorkflowsCount = filteredWorkflows.filter(w => w.status === 'active').length;
  const protectedWorkflowsCount = filteredWorkflows.filter(w => w.protectionStatus === 'protected').length;

  return (
    <MainAppLayout title="Dashboard Overview">
      {/* Error Alert */}
      {fetchError && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {fetchError}
            <Button 
              variant="link" 
              className="p-0 h-auto text-red-800 underline ml-2"
              onClick={refreshDashboard}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Status Banner */}
      <ContentSection>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  {filteredStats.active} of {filteredWorkflows.length} workflows are active
                </p>
                <p className="text-xs text-green-700">
                  Last Snapshot: {stats?.lastSnapshot ? new Date(stats.lastSnapshot).toLocaleString() : 'Not available'}
                </p>
                {(searchTerm || statusFilter !== "all") && (
                  <p className="text-xs text-blue-600 mt-1">
                    Showing {filteredWorkflows.length} of {workflows.length} workflows
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshWorkflows()}
              disabled={isRefreshing}
              aria-label="Refresh Dashboard"
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </ContentSection>

      {/* Statistics Cards */}
      <ContentSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-500" />
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
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats.uptime}%
              </div>
              <div className="text-sm text-gray-600">Total Uptime</div>
              <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-purple-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats?.planUsed || 0}/{stats?.planCapacity || 100}
              </div>
              <div className="text-sm text-gray-600">Plan Usage</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats?.planCapacity && stats?.planUsed ? 
                  Math.round((stats.planUsed / stats.planCapacity) * 100) : 0}% used
              </div>
            </CardContent>
          </Card>
        </div>
      </ContentSection>

      {/* Workflows Table */}
      <ContentSection>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Protected Workflows ({filteredWorkflows.length})
                </h2>
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={handleAddWorkflow}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Workflow
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport('all')}
                  disabled={checkLoading('export')}
                >
                  {checkLoading('export') ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Search workflows by name..." 
                  className="pl-10"
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
                {(searchTerm || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Workflows Table */}
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                    Workflow Name
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                    Protection
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                    Last Modified
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                    Versions
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                    Last Modified By
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWorkflows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm || statusFilter !== "all" 
                        ? "No workflows match your filters. Try adjusting your search criteria."
                        : "No workflows found. Add your first workflow to get started."
                      }
                    </td>
                  </tr>
                ) : (
                  filteredWorkflows.map((workflow) => (
                    <tr key={workflow.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900">
                            {safeToString(workflow.name, 'Unnamed Workflow')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="secondary"
                          className={getStatusColor(workflow.status)}
                        >
                          {safeToString(workflow.status, 'Unknown')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="secondary"
                          className={getProtectionStatusColor(workflow.protectionStatus)}
                        >
                          {safeToString(workflow.protectionStatus, 'Unprotected')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {safeToString(workflow.lastModified, 'Unknown')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {safeToString(workflow.versions, '1')} versions
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                              {(() => {
                                if (!workflow.lastModifiedBy || typeof workflow.lastModifiedBy !== 'object') {
                                  return 'U';
                                }
                                const initials = safeToString(workflow.lastModifiedBy.initials, '');
                                if (initials) return initials;
                                const name = safeToString(workflow.lastModifiedBy.name, 'Unknown');
                                return name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                              })()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-600">
                            {(() => {
                              if (!workflow.lastModifiedBy || typeof workflow.lastModifiedBy !== 'object') {
                                return 'Unknown User';
                              }
                              return safeToString(workflow.lastModifiedBy.name, 'Unknown User');
                            })()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewHistory(workflow.id, workflow.name)}
                            className="text-blue-600"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View History
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRollbackLatest(workflow)}
                            disabled={rollbacking[workflow.id]}
                            className="text-orange-600"
                          >
                            {rollbacking[workflow.id] ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Rolling Back...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Rollback
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ContentSection>

      {/* Rollback Confirmation Modal */}
      <RollbackConfirmModal
        open={showRollbackModal}
        onClose={() => setShowRollbackModal(false)}
        onConfirm={handleConfirmRollback}
        version={selectedWorkflow ? {
          id: selectedWorkflow.id,
          versionNumber: selectedWorkflow.versions || 1,
          dateTime: selectedWorkflow.lastModified || new Date().toISOString(),
          modifiedBy: {
            name: selectedWorkflow.lastModifiedBy?.name || 'Unknown User',
            initials: selectedWorkflow.lastModifiedBy?.initials || 'U'
          },
          changeSummary: `Rollback workflow: ${selectedWorkflow.name}`,
          type: 'rollback',
          status: selectedWorkflow.status || 'unknown'
        } : null}
        loading={selectedWorkflow ? rollbacking[selectedWorkflow.id] : false}
      />
    </MainAppLayout>
  );
};

export default Dashboard;
