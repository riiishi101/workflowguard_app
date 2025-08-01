import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import MainAppLayout from "@/components/MainAppLayout";
import ContentSection from "@/components/ContentSection";
import EmptyWorkflowHistory from "@/components/EmptyWorkflowHistory";
import ViewDetailsModal from "@/components/ViewDetailsModal";
import CreateNewWorkflowModal from "@/components/CreateNewWorkflowModal";
import RestoreVersionModal from "@/components/RestoreVersionModal";
import { WorkflowState } from "@/lib/workflowState";
import { ApiService, WorkflowHistoryVersion } from "@/lib/api";

interface ExtendedWorkflowHistoryVersion extends WorkflowHistoryVersion {
  selected?: boolean;
}
import {
  MoreHorizontal,
  ExternalLink,
  Eye,
  RotateCcw,
  Download,
  Copy,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface WorkflowDetails {
  id: string;
  name: string;
  status: string;
  hubspotId: string;
  lastModified: string;
  totalVersions: number;
}

const WorkflowHistory = () => {
  const navigate = useNavigate();
  const { workflowId } = useParams<{ workflowId: string }>();
  const { toast } = useToast();
  
  const [hasWorkflows, setHasWorkflows] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<ExtendedWorkflowHistoryVersion[]>([]);
  const [workflowDetails, setWorkflowDetails] = useState<WorkflowDetails | null>(null);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ExtendedWorkflowHistoryVersion | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    setHasWorkflows(WorkflowState.hasSelectedWorkflows());
  }, []);

  useEffect(() => {
    if (workflowId) {
      fetchWorkflowData();
    }
  }, [workflowId]);

  const fetchWorkflowData = async () => {
    if (!workflowId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch workflow details and history in parallel
      const [detailsResponse, historyResponse] = await Promise.all([
        ApiService.getWorkflowDetails(workflowId),
        ApiService.getWorkflowHistory(workflowId)
      ]);
      
      setWorkflowDetails(detailsResponse.data);
      setVersions(historyResponse.data.map((version: WorkflowHistoryVersion) => ({
        ...version,
        selected: false
      })));
      
    } catch (err: any) {
      console.error('Failed to fetch workflow data:', err);
      setError(err.response?.data?.message || 'Failed to load workflow history. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load workflow history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setError(null);
    fetchWorkflowData();
  };

  const handleRestoreVersion = async (version: ExtendedWorkflowHistoryVersion) => {
    if (!workflowId) return;
    
    try {
      setRestoring(true);
      const response = await ApiService.restoreWorkflowVersion(workflowId, version.id);
      
      toast({
        title: "Version Restored",
        description: response.data?.message || `Successfully restored version from ${version.date}`,
      });
      
      // Refresh the data
      fetchWorkflowData();
      setShowRestore(false);
      
    } catch (err: any) {
      console.error('Failed to restore version:', err);
      toast({
        title: "Restore Failed",
        description: err.response?.data?.message || "Failed to restore version. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRestoring(false);
    }
  };

  const handleDownloadVersion = async (version: ExtendedWorkflowHistoryVersion) => {
    if (!workflowId) return;
    
    try {
      const response = await ApiService.downloadWorkflowVersion(workflowId, version.id);
      
      // Create and download the file
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-${workflowDetails?.name}-version-${version.versionNumber}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Complete",
        description: "Workflow version downloaded successfully.",
      });
      
    } catch (err: any) {
      console.error('Failed to download version:', err);
      toast({
        title: "Download Failed",
        description: "Failed to download workflow version. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!hasWorkflows) {
    return <EmptyWorkflowHistory />;
  }

  if (!workflowId) {
    return (
      <MainAppLayout title="Workflow History">
        <ContentSection>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No workflow ID provided. Please select a workflow from the dashboard.
            </AlertDescription>
          </Alert>
        </ContentSection>
      </MainAppLayout>
    );
  }

  if (loading) {
    return (
      <MainAppLayout title="Workflow History">
        <ContentSection>
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </ContentSection>
        <ContentSection>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ContentSection>
      </MainAppLayout>
    );
  }

  if (error) {
    return (
      <MainAppLayout title="Workflow History">
        <ContentSection>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="ml-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </ContentSection>
      </MainAppLayout>
    );
  }

  const selectedCount = versions.filter((v) => v.selected).length;
  const selectedVersions = versions.filter((v) => v.selected);

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
          if (version.selected) {
            return { ...version, selected: false };
          }
          if (currentSelected.length < 2) {
            return { ...version, selected: true };
          }
          return version;
        }
        return version;
      });
    });
  };

  const handleViewDetails = (version: ExtendedWorkflowHistoryVersion) => {
    setSelectedVersion(version);
    setShowViewDetails(true);
  };

  const handleCreateNew = (version: ExtendedWorkflowHistoryVersion) => {
    setSelectedVersion(version);
    setShowCreateNew(true);
  };

  const handleRestore = (version: ExtendedWorkflowHistoryVersion) => {
    setSelectedVersion(version);
    setShowRestore(true);
  };

  const handleCopyVersionInfo = (version: ExtendedWorkflowHistoryVersion) => {
    const versionInfo = {
      id: version.id,
      versionNumber: version.versionNumber,
      date: version.date,
      type: version.type,
      initiator: version.initiator,
      notes: version.notes,
    };
    
    navigator.clipboard.writeText(JSON.stringify(versionInfo, null, 2));
    toast({
      title: "Version Info Copied",
      description: "Version information has been copied to clipboard.",
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "On-Publish Save":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "Manual Snapshot":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "Daily Backup":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      case "System Backup":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-gray-400";
      case "restored":
        return "bg-blue-500";
      default:
        return "bg-gray-400";
    }
  };

  const getChangesSummary = (version: ExtendedWorkflowHistoryVersion) => {
    if (!version.changes) return "No changes recorded";
    
    const { added, modified, removed } = version.changes;
    const changes = [];
    
    if (added > 0) changes.push(`${added} added`);
    if (modified > 0) changes.push(`${modified} modified`);
    if (removed > 0) changes.push(`${removed} removed`);
    
    return changes.length > 0 ? changes.join(', ') : "No changes recorded";
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRefresh}
        disabled={loading}
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh
      </Button>
      {workflowDetails?.hubspotId && (
        <Button 
          variant="outline" 
          size="sm" 
          className="text-blue-600"
          onClick={() => {
            const hubspotUrl = `https://app.hubspot.com/workflows/${workflowDetails.hubspotId}`;
            window.open(hubspotUrl, '_blank');
          }}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Go to Workflow in HubSpot
        </Button>
      )}
    </div>
  );

  return (
    <MainAppLayout 
      title="Workflow History"
      headerActions={headerActions}
    >
      {/* Workflow Info */}
      <ContentSection>
        {workflowDetails && (
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {workflowDetails.name}
              </h2>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(workflowDetails.status)}`}></div>
                <span className="text-sm text-gray-600 capitalize">{workflowDetails.status}</span>
              </div>
              <span className="text-sm text-gray-500">ID: {workflowDetails.id}</span>
            </div>
            <div className="text-sm text-gray-500">
              Last modified: {new Date(workflowDetails.lastModified).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>📊 {versions.length} versions</span>
              <span>📅 {new Date(versions[0]?.date || Date.now()).toLocaleDateString()} - {new Date(versions[versions.length - 1]?.date || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </ContentSection>

      {/* Versions Table */}
      <ContentSection>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {versions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No versions found
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                This workflow doesn't have any saved versions yet.
              </p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
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
                        Changes
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
                          <Checkbox
                            checked={version.selected}
                            onCheckedChange={() => handleVersionToggle(version.id)}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(version.date).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="secondary"
                            className={getTypeColor(version.type)}
                          >
                            {version.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <span>👤</span>
                            <span>{version.initiator}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <span>📝</span>
                            <span
                              className={
                                version.notes === "No notes available"
                                  ? "italic"
                                  : ""
                              }
                            >
                              {version.notes}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <span>📊</span>
                            <span className="text-xs">
                              {getChangesSummary(version)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(version)}
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
                                  onClick={() => handleViewDetails(version)}
                                >
                                  <Eye className="w-4 h-4 mr-3" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRestore(version)}
                                  disabled={restoring}
                                >
                                  <RotateCcw className="w-4 h-4 mr-3" />
                                  {restoring ? "Restoring..." : "Restore this Version"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDownloadVersion(version)}
                                >
                                  <Download className="w-4 h-4 mr-3" />
                                  Download Workflow JSON
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCreateNew(version)}
                                >
                                  <Copy className="w-4 h-4 mr-3" />
                                  Set as Base for New Workflow
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCopyVersionInfo(version)}
                                >
                                  <Copy className="w-4 h-4 mr-3" />
                                  Copy Version Info
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
                    {selectedCount === 2 && " (ready to compare)"}
                  </p>
                  <Button
                    onClick={handleCompareVersions}
                    disabled={selectedCount !== 2}
                    className="bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Compare Selected Versions
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </ContentSection>

      {/* Modals */}
      <ViewDetailsModal
        open={showViewDetails}
        onClose={() => setShowViewDetails(false)}
        version={selectedVersion}
      />

      <CreateNewWorkflowModal
        open={showCreateNew}
        onClose={() => setShowCreateNew(false)}
        version={selectedVersion}
      />

      <RestoreVersionModal
        open={showRestore}
        onClose={() => setShowRestore(false)}
        version={selectedVersion}
        onRestore={handleRestoreVersion}
        loading={restoring}
      />
    </MainAppLayout>
  );
};

export default WorkflowHistory;
