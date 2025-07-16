import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TopNavigation from "@/components/TopNavigation";
import ViewDetailsModal from "@/components/ViewDetailsModal";
import CreateNewWorkflowModal from "@/components/CreateNewWorkflowModal";
import RestoreVersionModal from "@/components/RestoreVersionModal";
import {
  MoreHorizontal,
  ExternalLink,
  Eye,
  RotateCcw,
  Download,
  Copy,
  Trash2,
  Loader2,
} from "lucide-react";
import EmptyWorkflowHistory from '../components/EmptyWorkflowHistory';
import { useRequireAuth, usePlan } from '../components/AuthContext';
import RoleGuard from '../components/RoleGuard';
import { useToast } from '@/components/ui/use-toast';
import React from 'react';
import apiService from '@/services/api';
import { saveAs } from 'file-saver';
import UpgradeRequiredModal from "../components/UpgradeRequiredModal";
import { useAuth } from '@/components/AuthContext';

// TypeScript interfaces
interface Workflow {
  id: string;
  name: string;
  status: string;
  hubspotId?: string;
  // Add other fields as needed
}

interface WorkflowVersion {
  id: string;
  versionNumber: number;
  snapshotType: string;
  createdBy: string;
  createdAt: string;
  notes?: string;
  data: any;
  selected?: boolean;
  // Add other fields as needed
}

const WorkflowHistory = () => {
  useRequireAuth();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { workflowId } = useParams();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<WorkflowVersion | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [lastDeletedVersion, setLastDeletedVersion] = useState<WorkflowVersion | null>(null);
  const undoTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [lastBulkDeleted, setLastBulkDeleted] = useState<WorkflowVersion[]>([]);
  const { plan, hasFeature, isTrialing } = usePlan();

  if (!workflowId) {
    return <EmptyWorkflowHistory />;
  }

  // Fetch workflow and versions from backend
  useEffect(() => {
    if (!workflowId) return;
    setLoading(true);
    setError("");
    Promise.all([
      apiService.getWorkflowById(workflowId).catch((e: any) => { throw new Error(e.message || "Failed to load workflow"); }),
      apiService.getWorkflowVersions(workflowId).catch((e: any) => { throw new Error(e.message || "Failed to load workflow versions"); })
    ])
      .then(([wf, vers]) => {
        setWorkflow(wf as Workflow);
        setVersions(Array.isArray(vers) ? vers.map((v: WorkflowVersion) => ({ ...v, selected: false })) : []);
      })
      .catch((e: any) => setError(e.message || "Failed to load workflow or versions"))
      .finally(() => setLoading(false));
  }, [workflowId]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600">Loading workflow history...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <span data-testid="workflow-history-error" className="text-red-500 mb-4">API Error</span>
        <Button onClick={() => window.location.reload()} variant="outline">Try Again</Button>
      </div>
    );
  }

  // Show empty state if no workflow is found
  if (!workflow) {
    return <EmptyWorkflowHistory />;
  }

  // Show empty state if workflow is found but has no versions
  if (!versions || versions.length === 0) {
    return <EmptyWorkflowHistory workflow={workflow} />;
  }

  const selectedCount = versions.filter((v) => v.selected).length;
  const selectedVersions = versions.filter((v) => v.selected);

  const canCompareVersions = hasFeature('advanced_monitoring') || hasFeature('unlimited_workflows');

  const handleCompareVersions = () => {
    if (selectedCount === 2) {
      navigate(
        `/compare-versions?versionA=${selectedVersions[0].id}&versionB=${selectedVersions[1].id}`,
      );
    }
  };

  const handleVersionToggle = (versionId: string) => {
    setVersions((prev) => {
      const currentSelected = prev.filter((v) => v.selected);

      return prev.map((version) => {
        if (version.id === versionId) {
          // If trying to unselect, allow it
          if (version.selected) {
            return { ...version, selected: false };
          }
          // If trying to select and less than 2 are selected, allow it
          if (currentSelected.length < 2) {
            return { ...version, selected: true };
          }
          // If 2 are already selected, don't allow more
          return version;
        }
        return version;
      });
    });
  };

  const handleBulkSelect = (versionId: string) => {
    setVersions((prev) => prev.map((v) => v.id === versionId ? { ...v, selected: !v.selected } : v));
  };

  const handleBulkDelete = () => {
    const selectedIds = versions.filter(v => v.selected).map(v => v.id);
    setBulkDeleteIds(selectedIds);
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      for (const id of bulkDeleteIds) {
        await apiService.deleteWorkflowVersion(id);
      }
    setVersions(versions.filter(v => !bulkDeleteIds.includes(v.id)));
      setLastBulkDeleted(versions.filter(v => bulkDeleteIds.includes(v.id)));
    setShowBulkDeleteDialog(false);
    toast({
      title: 'Versions Deleted',
        description: `${bulkDeleteIds.length} workflow version(s) have been deleted.`,
        variant: 'default',
        duration: 4000,
      });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to delete workflow version(s)', variant: 'destructive', duration: 5000 });
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleViewDetails = (version: WorkflowVersion) => {
    setSelectedVersion(version);
    setShowViewDetails(true);
  };

  const handleCreateNew = (version: WorkflowVersion) => {
    setSelectedVersion(version);
    setShowCreateNew(true);
  };

  const handleRestore = async (version: WorkflowVersion) => {
    setShowRestore(true);
    setSelectedVersion(version);
  };

  const confirmRestore = async () => {
    if (!selectedVersion || !workflow?.id) return;
    setLoading(true);
    try {
      await apiService.createWorkflowVersion({
        workflowId: workflow.id,
        versionNumber: selectedVersion.versionNumber,
        snapshotType: 'restore',
        createdBy: user?.id || 'system', // Use actual user id
        data: selectedVersion.data,
      });
      toast({
        title: 'Restore Successful',
        description: 'Workflow version has been restored.',
        variant: 'default',
        duration: 4000,
      });
      // Refetch versions
      const data = await apiService.getWorkflowVersions(workflow.id);
      setVersions(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to restore workflow version',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setShowRestore(false);
      setSelectedVersion(null);
      setLoading(false);
    }
  };

  const handleDeleteVersion = (versionId: string) => {
    setConfirmDeleteId(versionId);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await apiService.deleteWorkflowVersion(confirmDeleteId);
      const deletedVersion = versions.find(v => v.id === confirmDeleteId);
      setVersions(versions.filter(v => v.id !== confirmDeleteId));
      setLastDeletedVersion(deletedVersion);
      toast({
        title: 'Version Deleted',
        description: 'The workflow version has been deleted.',
        variant: 'default',
        duration: 4000,
      });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to delete workflow version', variant: 'destructive', duration: 5000 });
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "On-Publish Save":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "Manual Snapshot":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "Daily Backup":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  // Download workflow version JSON
  const handleDownloadJSON = (version: WorkflowVersion) => {
    if (!version || !version.data) {
      toast({ title: 'Error', description: 'No workflow data to download.', variant: 'destructive', duration: 5000 });
      return;
    }
    const blob = new Blob([JSON.stringify(version.data, null, 2)], { type: 'application/json' });
    saveAs(blob, `workflow-version-${version.versionNumber || version.id}.json`);
    toast({ title: 'Download Started', description: 'Workflow JSON is downloading.', variant: 'default', duration: 4000 });
  };

  return (
    <div className="min-h-screen bg-white">
      <TopNavigation />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Workflow History
          </h1>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  {workflow?.name || 'Unknown Workflow'}
                </h2>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 ${workflow?.status === 'active' ? 'bg-green-500' : 'bg-gray-400'} rounded-full`}></div>
                  <span className="text-sm text-gray-600">{workflow?.status ? workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1) : 'Unknown'}</span>
                </div>
                <span className="text-sm text-gray-500">ID: {workflow?.hubspotId || workflow?.id || '-'}</span>
              </div>
            </div>

            {workflow?.hubspotId && (
              <Button variant="outline" size="sm" className="text-blue-600" asChild>
                <a href={`https://app.hubspot.com/workflows/${workflow.hubspotId}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Go to Workflow in HubSpot
                </a>
            </Button>
            )}
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <Button
            variant="destructive"
            disabled={versions.filter(v => v.selected).length === 0}
            onClick={handleBulkDelete}
          >
            Delete Selected
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-6 py-3"></th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                    Date & Time
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                    Type
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                    Initiator
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                    Notes
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {versions.map((version) => (
                  <tr key={version.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={!!version.selected}
                        onChange={() => handleBulkSelect(version.id)}
                        aria-label={`Select version ${version.versionNumber || version.id}`}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {version.createdAt ? new Date(version.createdAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="secondary"
                        className={getTypeColor(version.snapshotType)}
                      >
                        {version.snapshotType ? (version.snapshotType.charAt(0).toUpperCase() + version.snapshotType.slice(1)) : 'Unknown'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>👤</span>
                        <span>{version.createdBy || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>📝</span>
                        <span className={!version.notes ? 'italic' : ''}>
                          {version.notes || 'No notes available'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowViewDetails(false);
                            setTimeout(() => {
                              setSelectedVersion(version);
                              setShowViewDetails(true);
                            }, 0);
                          }}
                          className="text-blue-600"
                        >
                          View Details
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                              onClick={() => {
                                setShowViewDetails(false);
                                setTimeout(() => {
                                  setSelectedVersion(version);
                                  setShowViewDetails(true);
                                }, 0);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-3" />
                              View Details
                            </DropdownMenuItem>
                            <RoleGuard roles={['admin', 'restorer']}>
                              <DropdownMenuItem
                                onClick={() => {
                                  setShowRestore(false);
                                  setTimeout(() => {
                                    setSelectedVersion(version);
                                    setShowRestore(true);
                                  }, 0);
                                }}
                              >
                                <RotateCcw className="w-4 h-4 mr-3" />
                                Restore this Version
                              </DropdownMenuItem>
                            </RoleGuard>
                            <RoleGuard roles={['viewer']}>
                              <DropdownMenuItem
                                onClick={() => alert('Request sent to admin for rollback.')}
                              >
                                <RotateCcw className="w-4 h-4 mr-3" />
                                Request Rollback
                              </DropdownMenuItem>
                            </RoleGuard>
                            <DropdownMenuItem
                              onClick={() => handleDownloadJSON(version)}
                            >
                              <Download className="w-4 h-4 mr-3" />
                              Download Workflow JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setShowCreateNew(false);
                                setTimeout(() => {
                                  setSelectedVersion(version);
                                  setShowCreateNew(true);
                                }, 0);
                              }}
                            >
                              <Copy className="w-4 h-4 mr-3" />
                              Set as Base for New Workflow
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteVersion(version.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedCount > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                ✓ {selectedCount} versions selected
                {selectedCount === 1 && " (select 1 more to compare)"}
                {selectedCount === 2 && (
                  canCompareVersions ? (
                    <button onClick={handleCompareVersions} className="btn btn-primary">Compare Selected Versions</button>
                  ) : (
                    <UpgradeRequiredModal
                      isOpen={true}
                      onClose={() => {}}
                      feature="version comparison"
                      isTrialing={isTrialing()}
                      planId={plan?.planId}
                      trialPlanId={plan?.trialPlanId}
                    />
                  )
                )}
              </p>
            </div>
          )}
        </div>
      </main>

      <ViewDetailsModal
        open={showViewDetails}
        onClose={() => {
          setShowViewDetails(false);
          setSelectedVersion(null);
        }}
        version={selectedVersion}
      />

      <CreateNewWorkflowModal
        open={showCreateNew}
        onClose={() => {
          setShowCreateNew(false);
          setSelectedVersion(null);
        }}
        version={selectedVersion}
      />

      <RestoreVersionModal
        open={showRestore}
        onClose={() => {
          setShowRestore(false);
          setSelectedVersion(null);
        }}
        version={selectedVersion}
      />

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-8 relative">
            <h2 className="text-lg font-semibold mb-4">Delete Version?</h2>
            <p className="mb-6">Are you sure you want to delete this workflow version? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)} disabled={deleting}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2" onClick={confirmDelete} disabled={deleting}>
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />} Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-8 relative">
            <h2 className="text-lg font-semibold mb-4">Delete Selected Versions?</h2>
            <p className="mb-6">Are you sure you want to delete {bulkDeleteIds.length} selected workflow version(s)? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)} disabled={bulkDeleting}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2" onClick={confirmBulkDelete} disabled={bulkDeleting}>
                {bulkDeleting && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>} Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowHistory;
