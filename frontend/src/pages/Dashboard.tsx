import React from 'react';
import { useState, useEffect } from "react";
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
import TopNavigation from "@/components/TopNavigation";
import apiService from "@/services/api";
import {
  Search,
  Plus,
  Download,
  CheckCircle,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  Loader2,
} from "lucide-react";
import EmptyDashboard from '../components/EmptyDashboard';
import { useRequireAuth, usePlan } from '../components/AuthContext';
import RoleGuard from '../components/RoleGuard';
import UpgradeRequiredModal from '@/components/UpgradeRequiredModal';
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CreateNewWorkflowModal from "@/components/CreateNewWorkflowModal";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Navigate } from "react-router-dom";
import RollbackConfirmModal from "@/components/RollbackConfirmModal";
import SuccessErrorBanner from '@/components/ui/SuccessErrorBanner';

// Define the workflow type with proper validation
interface Workflow {
  id: string;
  name: string;
  hubspotId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    name?: string;
    email: string;
  };
  versions?: Array<{
    id: string;
    createdAt: string;
  }>;
  status?: string;
}

// Helper to validate workflow data
function isValidWorkflow(obj: any): obj is Workflow {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.hubspotId === 'string' &&
    typeof obj.ownerId === 'string' &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'
  );
}

const PAGE_SIZE = 10;
const STATUS_COLORS = {
  Active: "bg-green-100 text-green-800",
  Inactive: "bg-gray-100 text-gray-800",
  Error: "bg-red-100 text-red-800",
  Syncing: "bg-yellow-100 text-yellow-800",
} as const;

const Dashboard = () => {
  useRequireAuth();
  const { plan, hasFeature, isTrialing } = usePlan();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [redirect, setRedirect] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [rollbackWorkflow, setRollbackWorkflow] = useState<Workflow | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canAddMoreWorkflows = hasFeature('unlimited_workflows') || hasFeature('advanced_monitoring');

  useEffect(() => {
    fetchWorkflows();
  }, []);

  useEffect(() => {
    if (!plan && workflows.length === 0) {
      // Remove fallback: do not load from localStorage, just show empty state
        setWorkflows([]); // Explicitly set to empty to trigger empty state
    }
  }, [plan, workflows.length]);

  const fetchWorkflows = async () => {
    try {
      setWorkflowsLoading(true);
      setError(null);
      const data = await apiService.getWorkflows() as any[];
      
      // Defensive: Validate and filter out malformed data
      const validWorkflows = Array.isArray(data)
        ? data.filter(isValidWorkflow)
        : [];
      
      if (Array.isArray(data) && validWorkflows.length !== data.length) {
        toast({
          title: "Warning",
          description: "Some workflows were ignored due to invalid data.",
          variant: "destructive",
        });
      }
      
      setWorkflows(validWorkflows);
    } catch (err: any) {
      // Improved error handling
      const apiError = err?.response?.data?.message || err?.message || String(err);
      setError(`Failed to fetch workflows: ${apiError}`);
      console.error("Error fetching workflows:", err);
    } finally {
      setWorkflowsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const data = await apiService.getBusinessIntelligence();
      setAnalytics(data);
    } catch (err) {
      toast({
        title: "Analytics Error",
        description: err?.message || "Failed to load analytics.",
        variant: "destructive",
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || (workflow.status || "Active").toLowerCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getLastSnapshot = (workflow: Workflow) => {
    if (workflow.versions && workflow.versions.length > 0) {
      const latestVersion = workflow.versions[0];
      try {
      return new Date(latestVersion.createdAt).toLocaleString();
      } catch (err) {
        console.error('Error parsing date:', err);
        return "Invalid date";
      }
    }
    return "No snapshots";
  };

  const getVersionsCount = (workflow: Workflow) => {
    return workflow.versions?.length || 0;
  };

  const getLastModifiedBy = (workflow: Workflow) => {
    if (workflow.owner?.name) {
      const names = workflow.owner.name.split(" ");
      const initials = names.map(n => n[0]).join("").toUpperCase();
      return { name: workflow.owner.name, initials };
    }
    return { name: workflow.owner?.email || "Unknown", initials: "U" };
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredWorkflows.length / PAGE_SIZE);
  const paginatedWorkflows = filteredWorkflows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Bulk selection logic
  const allSelected = paginatedWorkflows.length > 0 && paginatedWorkflows.every(w => selectedIds.includes(w.id));
  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(selectedIds.filter(id => !paginatedWorkflows.some(w => w.id === id)));
    } else {
      setSelectedIds([
        ...selectedIds,
        ...paginatedWorkflows.filter(w => !selectedIds.includes(w.id)).map(w => w.id),
      ]);
    }
  };
  
  const handleSelectOne = (id: string) => {
    setSelectedIds(selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id]);
  };
  
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    let successCount = 0;
    let failedCount = 0;
    const failedNames: string[] = [];
    const newWorkflows = [...workflows];
    await Promise.all(selectedIds.map(async (id) => {
      try {
        await apiService.deleteWorkflow(id);
        // Remove from local state
        const idx = newWorkflows.findIndex(w => w.id === id);
        if (idx !== -1) newWorkflows.splice(idx, 1);
        successCount++;
      } catch (err: any) {
        failedCount++;
        const wf = workflows.find(w => w.id === id);
        failedNames.push(wf?.name || id);
      }
    }));
    setWorkflows(newWorkflows);
    setSelectedIds([]);
    if (successCount > 0) {
      toast({
        title: "Workflows Deleted",
        description: `${successCount} workflow(s) have been deleted.`,
      });
    }
    if (failedCount > 0) {
      toast({
        title: "Delete Failed",
        description: `Failed to delete: ${failedNames.join(", ")}`,
        variant: "destructive",
      });
    }
    setActionLoading(false);
  };

  const handleAddWorkflow = () => {
    console.log('Dashboard Add Workflow clicked, navigating to /select-workflows');
    try {
      navigate('/select-workflows');
    } catch (e) {
      console.error('navigate() failed, falling back to <Navigate>', e);
      setRedirect(true);
    }
    setTimeout(() => setRedirect(true), 200);
  };

  const handleExport = async () => {
    setActionLoading(true);
    try {
      // In production, this would generate and download a CSV/JSON file
      const exportData = workflows.map(w => ({
        name: w.name,
        hubspotId: w.hubspotId,
        status: w.status || 'Active',
        lastSnapshot: getLastSnapshot(w),
        versions: getVersionsCount(w),
      }));
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflows-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Workflow data has been exported.",
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "Failed to export workflow data.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for rollback logic
  const handleConfirmRollback = async () => {
    if (!rollbackWorkflow) return;
    setActionLoading(true);
    try {
      await apiService.rollbackWorkflow(rollbackWorkflow.id);
      setBanner({ type: 'success', message: `Workflow '${rollbackWorkflow.name}' was rolled back to the latest version.` });
      fetchWorkflows();
    } catch (err: any) {
      setBanner({ type: 'error', message: err?.message || 'Failed to rollback workflow.' });
    } finally {
      setRollbackWorkflow(null);
      setShowRollbackModal(false);
      setActionLoading(false);
    }
  };

  if (workflowsLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-white">
        <TopNavigation />
        <main className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-center min-h-[60vh]">
          <div aria-live="polite" aria-busy="true">
            <LoadingSpinner role="status" data-testid="loading-spinner" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <TopNavigation />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4" aria-live="assertive">{error}</p>
            <Button onClick={fetchWorkflows} variant="outline">
              Try Again
          </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!plan && !error && workflows.length === 0) {
    return <EmptyDashboard />;
  }

  return (
    <div className="min-h-screen bg-white">
      <TopNavigation />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Dashboard Overview
          </h1>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-900">
                All {workflows.length} active workflows are being monitored
              </p>
              <p className="text-xs text-green-700">
                Last Snapshot: {workflows.length > 0 ? getLastSnapshot(workflows[0]) : "No snapshots"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{analytics?.overview?.activeUsers ?? workflows.length}</div>
              <div className="text-sm text-gray-600">Active Users</div>
              <div className="text-xs text-gray-500 mt-1">
                Users with at least one workflow
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{analytics?.overview?.conversionRate != null ? `${analytics.overview.conversionRate}%` : 'N/A'}</div>
              <div className="text-sm text-gray-600">Conversion Rate</div>
              <div className="text-xs text-gray-500 mt-1">Users with overages / total users</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-500" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{analytics?.overview?.totalUsers ?? 500}</div>
              <div className="text-sm text-gray-600">Total Users</div>
              <div className="text-xs text-gray-500 mt-1">
                Registered users
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              All Protected Workflows
            </h2>
            <div className="flex items-center gap-3">
              <RoleGuard roles={['admin', 'restorer']}>
                <Button
                  onClick={canAddMoreWorkflows ? handleAddWorkflow : () => setShowUpgradeModal(true)}
                  disabled={!canAddMoreWorkflows || actionLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Workflow
                </Button>
              </RoleGuard>
              <RoleGuard roles={['admin', 'restorer']}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExport}
                  disabled={actionLoading || workflows.length === 0}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Export
                </Button>
              </RoleGuard>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search workflows by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  aria-label="Search workflows by name"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32" aria-label="Status filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="px-6 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-4">
              <span className="text-sm text-blue-900" aria-live="polite">
                {selectedIds.length} selected
              </span>
              <RoleGuard roles={['admin', 'restorer']}>
                <Button 
                  onClick={handleBulkDelete} 
                  disabled={selectedIds.length === 0 || actionLoading} 
                  className="text-red-600 border-red-200"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Delete
                </Button>
              </RoleGuard>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-8" scope="col">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      aria-label="Select all workflows"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700" scope="col">
                    Workflow Name
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700" scope="col">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700" scope="col">
                    Last Snapshot
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700" scope="col">
                    Versions
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700" scope="col">
                    Last Modified By
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700" scope="col">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedWorkflows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-lg font-semibold text-gray-700 mb-2">No workflows found</div>
                        <div className="text-gray-500 mb-6">
                          Try adjusting your search or filters.
                        </div>
                        <Button 
                          onClick={handleAddWorkflow} 
                          aria-label="Add Workflow"
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          size="lg"
                        >
                          + Add Workflow
                        </Button>
                        {redirect && <Navigate to="/select-workflows" replace />}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedWorkflows.map((workflow, idx) => {
                    const lastModifiedBy = getLastModifiedBy(workflow);
                    return (
                      <tr key={workflow.id} className="hover:bg-gray-50" tabIndex={0} aria-rowindex={idx + 2}
                          aria-label={`Workflow row for ${workflow.name}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(workflow.id)}
                            onChange={() => handleSelectOne(workflow.id)}
                            aria-label={`Select workflow ${workflow.name}`}
                            tabIndex={0}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {workflow.name}
                          <div className="text-xs text-gray-500">ID: {workflow.hubspotId}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={STATUS_COLORS[workflow.status as keyof typeof STATUS_COLORS] || STATUS_COLORS['Active']}>
                            {workflow.status || 'Active'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {getLastSnapshot(workflow)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge>
                            {getVersionsCount(workflow)} versions
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="w-6 h-6 mr-2">
                              <AvatarFallback className="text-xs">
                                {lastModifiedBy.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-900">
                              {lastModifiedBy.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" aria-label={`View details for ${workflow.name}`} onClick={() => navigate(`/workflow-history/${workflow.id}`)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <RoleGuard roles={['admin', 'restorer']}>
                              <Button variant="ghost" size="sm" aria-label={`Rollback ${workflow.name}`} onClick={() => { setRollbackWorkflow(workflow); setShowRollbackModal(true); }}>
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            </RoleGuard>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Go to previous page"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              <span className="text-sm text-gray-600" aria-live="polite">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Go to next page"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <UpgradeRequiredModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature="more workflows"
          isTrialing={isTrialing()}
          planId={plan?.planId}
          trialPlanId={plan?.trialPlanId}
        />

        <CreateNewWorkflowModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          version={{ id: 'dummy', createdAt: new Date().toISOString(), createdBy: 'System' }}
          onCreated={fetchWorkflows}
        />

        <RollbackConfirmModal
          open={showRollbackModal}
          onClose={() => { setShowRollbackModal(false); setRollbackWorkflow(null); }}
          onConfirm={handleConfirmRollback}
          workflowName={rollbackWorkflow?.name}
        />
        {banner && (
          <div className="max-w-6xl mx-auto px-6 pt-6">
            <SuccessErrorBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
