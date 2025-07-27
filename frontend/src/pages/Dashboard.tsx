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
  Wifi,
  WifiOff,
} from "lucide-react";
import EmptyDashboard from '../components/EmptyDashboard';
import { usePlan } from '../components/AuthContext';
import { useWorkflows } from '@/contexts/WorkflowContext';
import RoleGuard from '../components/RoleGuard';
import UpgradeRequiredModal from '@/components/UpgradeRequiredModal';
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CreateNewWorkflowModal from "@/components/CreateNewWorkflowModal";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import RollbackConfirmModal from "@/components/RollbackConfirmModal";
import SuccessErrorBanner from '@/components/ui/SuccessErrorBanner';

// Define the workflow type
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

const PAGE_SIZE = 10;
const STATUS_COLORS = {
  Active: "bg-green-100 text-green-800",
  Inactive: "bg-gray-100 text-gray-800",
  Error: "bg-red-100 text-red-800",
  Syncing: "bg-yellow-100 text-yellow-800",
} as const;

const Dashboard = () => {
  const { plan, hasFeature, isTrialing } = usePlan();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    workflows, 
    workflowsLoading, 
    workflowsError: error,
    isConnected,
    lastUpdate,
    deleteWorkflow,
    addWorkflow
  } = useWorkflows();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [rollbackWorkflow, setRollbackWorkflow] = useState<Workflow | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canAddMoreWorkflows = hasFeature('unlimited_workflows') || hasFeature('advanced_monitoring');

  // Filter workflows based on search and status
  const filteredWorkflows = workflows?.filter((workflow) => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || (workflow.status || "Active").toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredWorkflows.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedWorkflows = filteredWorkflows.slice(startIndex, startIndex + PAGE_SIZE);

  // Master checkbox logic
  const allSelected = paginatedWorkflows.length > 0 && paginatedWorkflows.every(w => selectedIds.includes(w.id));
  const someSelected = paginatedWorkflows.some(w => selectedIds.includes(w.id));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedWorkflows.map(w => w.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    setActionLoading(true);
    try {
      await Promise.all(selectedIds.map(id => deleteWorkflow(id)));
      setSelectedIds([]);
      toast({
        title: "Workflows Deleted",
        description: `${selectedIds.length} workflows have been deleted successfully.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete some workflows. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddWorkflow = () => {
    if (!canAddMoreWorkflows) {
      setShowUpgradeModal(true);
      return;
    }
    setShowCreateModal(true);
  };

  const handleExport = async () => {
    setActionLoading(true);
    try {
      const data = filteredWorkflows.map(w => ({
        name: w.name,
        hubspotId: w.hubspotId,
        status: w.status,
        lastModified: w.updatedAt,
        versionsCount: w.versions?.length || 0
      }));
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
        description: "Workflow data has been exported successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export workflow data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRollback = async () => {
    if (!rollbackWorkflow) return;
    
    setActionLoading(true);
    try {
      // This would call the rollback API
      toast({
        title: "Rollback Successful",
        description: `Workflow "${rollbackWorkflow.name}" has been rolled back successfully.`,
        variant: "default",
      });
      setShowRollbackModal(false);
      setRollbackWorkflow(null);
    } catch (error) {
      toast({
        title: "Rollback Failed",
        description: "Failed to rollback workflow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getLastSnapshot = (workflow: Workflow) => {
    if (!workflow.versions || workflow.versions.length === 0) {
      return "No snapshots";
    }
    const latest = workflow.versions[workflow.versions.length - 1];
    return new Date(latest.createdAt).toLocaleDateString();
  };

  const getVersionsCount = (workflow: Workflow) => {
    return workflow.versions?.length || 0;
  };

  const getLastModifiedBy = (workflow: Workflow) => {
    return workflow.owner?.name || workflow.owner?.email || "Unknown";
  };

  if (workflowsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Failed to load workflows</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!workflows || workflows.length === 0) {
    return <EmptyDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      
      {banner && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <SuccessErrorBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Real-time status indicator */}
        <div className="flex items-center gap-2 mb-4">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className="text-sm text-gray-600">
            {isConnected ? 'Real-time updates enabled' : 'Real-time updates disabled'}
          </span>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Monitor and manage your protected workflows
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleExport}
                variant="outline"
                disabled={actionLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={handleAddWorkflow}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Workflow
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {selectedIds.length > 0 && (
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                size="sm"
                disabled={actionLoading}
              >
                Delete Selected ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        {/* Workflows Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Workflow</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Last Snapshot</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Versions</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Last Modified By</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedWorkflows.map((workflow) => (
                  <tr key={workflow.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(workflow.id)}
                        onChange={() => handleSelectOne(workflow.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{workflow.name}</div>
                        <div className="text-sm text-gray-500">ID: {workflow.hubspotId}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="default"
                        className={STATUS_COLORS[workflow.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.Active}
                      >
                        {workflow.status || "Active"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getLastSnapshot(workflow)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getVersionsCount(workflow)} versions
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Avatar className="w-6 h-6 mr-2">
                          <AvatarFallback className="text-xs">
                            {getLastModifiedBy(workflow).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600">{getLastModifiedBy(workflow)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/workflow-history/${workflow.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRollbackWorkflow(workflow);
                            setShowRollbackModal(true);
                          }}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, filteredWorkflows.length)} of {filteredWorkflows.length} workflows
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showCreateModal && (
        <CreateNewWorkflowModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(workflow) => {
            setShowCreateModal(false);
            toast({
              title: "Workflow Added",
              description: `Workflow "${workflow.name}" has been added successfully.`,
              variant: "default",
            });
          }}
        />
      )}

      {showRollbackModal && rollbackWorkflow && (
        <RollbackConfirmModal
          workflow={rollbackWorkflow}
          onClose={() => {
            setShowRollbackModal(false);
            setRollbackWorkflow(null);
          }}
          onConfirm={handleConfirmRollback}
          loading={actionLoading}
        />
      )}

      {showUpgradeModal && (
        <UpgradeRequiredModal
          onClose={() => setShowUpgradeModal(false)}
          feature="unlimited_workflows"
        />
      )}
    </div>
  );
};

export default Dashboard;
