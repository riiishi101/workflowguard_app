import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ApiService } from "@/lib/api";
import MainAppLayout from "@/components/MainAppLayout";
import ContentSection from "@/components/ContentSection";
import ViewDetailsModal from "@/components/ViewDetailsModal";
import RollbackConfirmModal from "@/components/RollbackConfirmModal";
import {
  WorkflowVersion,
  WorkflowDetails,
  WorkflowVersionsSchema,
  WorkflowDetailsSchema,
} from "@/types/workflow-history-detail.schemas";
import {
  Search,
  ExternalLink,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Download,
  ArrowLeft,
  RotateCcw,
  History,
  Activity,
  CheckCircle,
  FileText,
  Eye,
  Clock,
  GitCompare,
} from "lucide-react";

const WorkflowHistoryDetail = () => {
  const navigate = useNavigate();
  const { workflowId } = useParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workflowDetails, setWorkflowDetails] = useState<WorkflowDetails | null>(null);
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [restoring, setRestoring] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  
  // Compare functionality states
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  
  // Modal states
  const [viewDetailsModal, setViewDetailsModal] = useState<{open: boolean, version: any}>({
    open: false,
    version: null
  });
  const [rollbackModal, setRollbackModal] = useState<{open: boolean, version: any}>({
    open: false,
    version: null
  });

  useEffect(() => {
    if (workflowId) {
      fetchWorkflowHistory();
      fetchWorkflowDetails();
    }
  }, [workflowId]);

  const fetchWorkflowDetails = async () => {
    try {
      const response = await ApiService.getWorkflowDetails(workflowId);
      const validationResult = WorkflowDetailsSchema.safeParse(response.data);

      if (!validationResult.success) {
        console.error("Zod validation for workflow details failed:", validationResult.error.errors);
        return;
      }
      
      setWorkflowDetails(validationResult.data);

    } catch (error) {
      console.error('Failed to fetch workflow details:', error);
    }
  };

  const fetchWorkflowHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 WorkflowHistoryDetail - Fetching history for workflowId:', workflowId);
      
      const response = await ApiService.getWorkflowHistory(workflowId);
      const validationResult = WorkflowVersionsSchema.safeParse(response.data);

      if (!validationResult.success) {
        console.error("Zod validation for workflow history failed:", validationResult.error.errors);
        throw new Error("Received invalid version history data from the server.");
      }

      if (validationResult.data.length > 0) {
        setVersions(validationResult.data);
      } else {
        setVersions([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch workflow history:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load workflow history';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToHubSpot = () => {
    if (workflowDetails?.hubspotUrl) {
      window.open(workflowDetails.hubspotUrl, '_blank');
    }
  };

  const handleViewDetails = (version: WorkflowVersion) => {
    setViewDetailsModal({ open: true, version });
  };

  const handleRollbackClick = (version: WorkflowVersion) => {
    setRollbackModal({ open: true, version });
  };

  const handleRollbackVersion = async (versionId: string) => {
    setRestoring(versionId);
    try {
      await ApiService.restoreWorkflowVersion(workflowDetails?.id, versionId);
      toast({
        title: "Version Restored",
        description: "The workflow has been successfully rolled back to the selected version.",
      });
      fetchWorkflowHistory();
    } catch (err: any) {
      console.error('Rollback failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to rollback to the selected version';
      toast({
        title: "Rollback Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setRestoring(null);
      setRollbackModal({ open: false, version: null });
    }
  };

  const handleDownloadVersion = async (versionId: string) => {
    setDownloading(versionId);
    try {
      const version = await ApiService.downloadWorkflowVersion(workflowDetails?.id, versionId);
      const blob = new Blob([JSON.stringify(version, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-version-${versionId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Download Complete",
        description: "Version has been downloaded successfully.",
      });
    } catch (err: any) {
      console.error('Download failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to download the version';
      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  // Compare functionality handlers
  const handleVersionSelection = (versionId: string, checked: boolean) => {
    if (checked) {
      if (selectedVersions.length < 2) {
        setSelectedVersions([...selectedVersions, versionId]);
      }
    } else {
      setSelectedVersions(selectedVersions.filter(id => id !== versionId));
    }
  };

  const handleCompareSelected = () => {
    if (selectedVersions.length === 2) {
      navigate(`/compare-versions?workflowId=${workflowId}&versionA=${selectedVersions[0]}&versionB=${selectedVersions[1]}`);
    }
  };

  const handleCompareWithVersion = (versionId: string) => {
    // If only one version is selected, use it as the second version
    if (selectedVersions.length === 1) {
      const otherVersion = selectedVersions[0];
      navigate(`/compare-versions?workflowId=${workflowId}&versionA=${otherVersion}&versionB=${versionId}`);
    } else {
      // If no versions are selected, select this one
      setSelectedVersions([versionId]);
    }
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    if (compareMode) {
      setSelectedVersions([]);
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

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "manual save":
        return "bg-blue-100 text-blue-800";
      case "auto backup":
        return "bg-purple-100 text-purple-800";
      case "system backup":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter versions based on search term
  const filteredVersions = versions.filter(version =>
    version.changeSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    version.modifiedBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    version.versionNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <MainAppLayout title="Workflow History Detail">
        <ContentSection>
          <div className="space-y-6" data-testid="loading-skeleton">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </ContentSection>
      </MainAppLayout>
    );
  }

  return (
    <MainAppLayout title="Workflow History Detail">
      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Header Section */}
      <ContentSection>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>
            {workflowDetails?.hubspotUrl && (
              <Button
                variant="outline"
                onClick={handleGoToHubSpot}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open in HubSpot
              </Button>
            )}
          </div>

          {workflowDetails && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {workflowDetails.name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={getStatusColor(workflowDetails.status)}
                  >
                    {workflowDetails.status}
                  </Badge>
                </div>
                <span>•</span>
                <span>Last modified: {workflowDetails.lastModified}</span>
                <span>•</span>
                <span>{workflowDetails.totalVersions} versions</span>
              </div>
            </div>
          )}
        </div>
      </ContentSection>

      {/* Statistics Cards */}
      <ContentSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                {versions.filter(v => v.status === 'current').length}
              </div>
              <div className="text-sm text-gray-600">Current Version</div>
              <div className="text-xs text-gray-500 mt-1">Active now</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <History className="w-4 h-4 text-blue-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {versions.length}
              </div>
              <div className="text-sm text-gray-600">Total Versions</div>
              <div className="text-xs text-gray-500 mt-1">All time</div>
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
                {versions.filter(v => v.type === 'Manual Save').length}
              </div>
              <div className="text-sm text-gray-600">Manual Changes</div>
              <div className="text-xs text-gray-500 mt-1">User initiated</div>
            </CardContent>
          </Card>
        </div>
      </ContentSection>

      {/* Version History - Dashboard Style Cards */}
      <ContentSection>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Version History ({filteredVersions.length})
              </h2>
              <div className="flex items-center gap-3">
                {compareMode && selectedVersions.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{selectedVersions.length}/2 versions selected</span>
                    {selectedVersions.length === 2 && (
                      <Button
                        data-testid="compare-selected-button"
                        variant="default"
                        size="sm"
                        onClick={handleCompareSelected}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <GitCompare className="w-4 h-4 mr-1" />
                        Compare Selected
                      </Button>
                    )}
                  </div>
                )}
                <Button
                  data-testid="compare-mode-toggle"
                  variant={compareMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleCompareMode}
                  className={compareMode ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  {compareMode ? "Exit Compare" : "Compare Mode"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchWorkflowHistory}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Search Filter */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                data-testid="search-input"
                placeholder="Search versions by changes, user, or version..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Version Cards */}
          <div className="p-6">
            {filteredVersions.length > 0 ? (
              <div className="space-y-4">
                {filteredVersions.map((version, index) => (
                  <Card key={version.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Timeline indicator */}
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              version.status === 'current' ? 'bg-green-500' : 'bg-blue-500'
                            }`}></div>
                            {index < filteredVersions.length - 1 && (
                              <div className="w-px h-16 bg-gray-300 mt-2"></div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            {/* Version Header */}
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                Version {version.versionNumber}
                              </h3>
                              {version.status === 'current' && (
                                <Badge className="bg-green-100 text-green-800">
                                  Current
                                </Badge>
                              )}
                              <Badge className={getTypeColor(version.type)}>
                                {version.type}
                              </Badge>
                            </div>
                            
                            {/* Change Summary */}
                            <p className="text-gray-900 mb-4 text-base leading-relaxed">
                              {version.changeSummary}
                            </p>
                            
                            {/* Metadata */}
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {new Date(version.dateTime).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
                                    {version.modifiedBy.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{version.modifiedBy.name}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 ml-4">
                          {compareMode && (
                            <Checkbox
                              checked={selectedVersions.includes(version.id)}
                              onCheckedChange={(checked) => handleVersionSelection(version.id, checked as boolean)}
                              disabled={selectedVersions.length >= 2 && !selectedVersions.includes(version.id)}
                            />
                          )}
                          <Button
                            data-testid="view-details-button"
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => handleViewDetails(version)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleDownloadVersion(version.id)}
                            disabled={downloading === version.id}
                          >
                            {downloading === version.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                              <Download className="w-4 h-4 mr-1" />
                            )}
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-purple-600 hover:text-purple-700"
                            onClick={() => handleCompareWithVersion(version.id)}
                            disabled={compareMode && selectedVersions.length >= 2 && !selectedVersions.includes(version.id)}
                          >
                            <GitCompare className="w-4 h-4 mr-1" />
                            Compare
                          </Button>
                          {version.status !== 'current' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-orange-600 hover:text-orange-700"
                              onClick={() => handleRollbackClick(version)}
                              disabled={restoring === version.id}
                            >
                              {restoring === version.id ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                              ) : (
                                <RotateCcw className="w-4 h-4 mr-1" />
                              )}
                              Rollback
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Versions Found
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? "No versions match your search criteria. Try adjusting your search."
                    : "No version history found for this workflow."
                  }
                </p>
              </div>
            )}
          </div>

          {/* Results Summary */}
          {filteredVersions.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing {filteredVersions.length} of {versions.length} versions
              </div>
            </div>
          )}
        </div>
      </ContentSection>

      {/* Modals */}
      <ViewDetailsModal
        open={viewDetailsModal.open}
        onClose={() => setViewDetailsModal({ open: false, version: null })}
        version={viewDetailsModal.version}
      />
      
      <RollbackConfirmModal
        open={rollbackModal.open}
        onClose={() => setRollbackModal({ open: false, version: null })}
        onConfirm={() => handleRollbackVersion(rollbackModal.version?.id)}
        version={rollbackModal.version}
        loading={restoring === rollbackModal.version?.id}
      />
    </MainAppLayout>
  );
};

export default WorkflowHistoryDetail;
