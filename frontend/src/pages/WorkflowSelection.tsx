import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import TopNavigation from "@/components/TopNavigation";
import { Search, Info, Loader2 } from "lucide-react";
import apiService from "@/services/api";
import { useRequireAuth } from '../components/AuthContext';
import { useToast } from "@/hooks/use-toast";
import SuccessErrorBanner from '@/components/ui/SuccessErrorBanner';
import { useAuth } from '@/components/AuthContext';

// Define the workflow type
interface Workflow {
  id: string;
  name: string;
  hubspotId: string;
  ownerId: string;
  createdAt?: string;
  updatedAt?: string;
  folder?: string;
  status?: string;
}

// Helper to validate workflow data
function isValidWorkflow(obj: any): obj is Workflow {
  // Basic object check
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  // Check if name exists and is not empty
  const hasValidName = typeof obj.name === 'string' && obj.name.trim() !== '';
  
  // Check if we have either id or hubspotId
  const hasValidId = typeof obj.id === 'string' || typeof obj.hubspotId === 'string';
  
  // Check if ownerId exists (but be more lenient)
  const hasOwnerId = typeof obj.ownerId === 'string';
  
  return hasValidName && hasValidId && hasOwnerId;
}

const MAX_SELECTION = 500;

const WorkflowSelection = () => {
  useRequireAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [folderFilter, setFolderFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch live workflows from HubSpot for the connected user
        const workflowsData = await apiService.getWorkflows();
        console.log('📊 Raw workflows data from API:', workflowsData);
        // Use backend structure directly; fallback for legacy/edge cases
        const normalized = Array.isArray(workflowsData)
          ? workflowsData.map((w: any, index: number) => {
              // Ensure we have a valid ID - prefer hubspotId over id
              const workflowId = w.hubspotId ? String(w.hubspotId) : (w.id ? String(w.id) : `fallback-${index}`);
              const hubspotId = w.hubspotId ? String(w.hubspotId) : (w.id ? String(w.id) : `fallback-${index}`);
              
              return {
                ...w,
                id: workflowId,
                hubspotId: hubspotId,
                name: w.name && w.name.trim() !== '' ? w.name : `Unnamed Workflow ${index + 1}`,
                ownerId: w.ownerId || user?.id || "unknown-owner",
                status: w.status || w.enabled === false ? 'inactive' : 'active',
                folder: w.folder || w.folderId || undefined,
                createdAt: w.createdAt || w.insertedAt || undefined,
                updatedAt: w.updatedAt || undefined,
              };
            })
          : [];
        const validWorkflows = normalized.filter(isValidWorkflow);
        const invalidWorkflows = normalized.filter(w => !isValidWorkflow(w));
        
        // Log invalid workflows for debugging
        if (invalidWorkflows.length > 0) {
          console.log('🚨 INVALID WORKFLOWS DETECTED 🚨');
          console.log('Invalid workflows found:', invalidWorkflows);
          console.log('Validation issues:', invalidWorkflows.map(w => ({
            name: w.name,
            id: w.id,
            hubspotId: w.hubspotId,
            ownerId: w.ownerId,
            hasName: typeof w.name === 'string' && w.name.trim() !== '',
            hasId: typeof w.id === 'string' || typeof w.hubspotId === 'string',
            hasOwnerId: typeof w.ownerId === 'string'
          })));
          
          // Also show in a toast for visibility
          toast({
            title: "Validation Issues Found",
            description: `Found ${invalidWorkflows.length} workflows with validation issues. Check console for details.`,
            variant: "destructive",
          });
        } else {
          console.log('✅ All workflows passed validation');
        }
        
        if (Array.isArray(workflowsData) && validWorkflows.length !== workflowsData.length) {
          setBanner({ type: 'error', message: `Some workflows were ignored due to invalid data. (${invalidWorkflows.length} invalid, ${validWorkflows.length} valid)` });
        }
        setWorkflows(validWorkflows);
      } catch (err: any) {
        // Improved error handling - don't block the UI if workflows fail to load
        const apiError = err?.response?.data?.message || err?.message || String(err);
        setError("Failed to fetch workflows");
        setWorkflows([]);
        // Show a warning toast instead of blocking the UI
        toast({
          title: "Workflows Unavailable",
          description: "Unable to load workflows from HubSpot. You can still proceed and select workflows later from the dashboard.",
          variant: "default",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchWorkflows();
  }, [toast, user]);

  // Filtering logic
  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesName = workflow.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || (workflow.status || "active").toLowerCase() === statusFilter;
    const matchesFolder = folderFilter === "all" || workflow.folder === folderFilter;
    return matchesName && matchesStatus && matchesFolder;
  });

  // Unique folders for filter dropdown
  const uniqueFolders = Array.from(new Set(workflows.map(w => w.folder).filter(Boolean)));

  // Master checkbox logic
  const allSelected = filteredWorkflows.length > 0 && filteredWorkflows.every(w => selectedWorkflows.includes(w.id));
  const someSelected = filteredWorkflows.some(w => selectedWorkflows.includes(w.id));
  const masterIndeterminate = someSelected && !allSelected;

  const handleMasterToggle = () => {
    if (allSelected) {
      setSelectedWorkflows(prev => prev.filter(id => !filteredWorkflows.some(w => w.id === id)));
    } else {
      const toAdd = filteredWorkflows
        .map(w => w.id)
        .filter(id => !selectedWorkflows.includes(id));
      const newSelection = [...selectedWorkflows, ...toAdd];
      if (newSelection.length > MAX_SELECTION) {
        setBanner({ type: 'error', message: `You can select up to ${MAX_SELECTION} workflows in your trial.` });
        setSelectedWorkflows(newSelection.slice(0, MAX_SELECTION));
      } else {
        setSelectedWorkflows(newSelection);
      }
    }
  };

  const handleWorkflowToggle = (workflowId: string) => {
    setSelectedWorkflows((prev) => {
      if (prev.includes(workflowId)) {
        return prev.filter((id) => id !== workflowId);
      } else {
        if (prev.length >= MAX_SELECTION) {
          setBanner({ type: 'error', message: `You can select up to ${MAX_SELECTION} workflows in your trial.` });
          return prev;
        }
        return [...prev, workflowId];
      }
    });
  };

  const handleStartProtecting = async () => {
    setActionLoading(true);
    try {
      // Save selected workflows to localStorage for dashboard access
      const selectedWorkflowData = workflows.filter(w => selectedWorkflows.includes(w.id || w.hubspotId));
      localStorage.setItem('selectedWorkflows', JSON.stringify(selectedWorkflowData));
      
      // Try to save to backend if available
      try {
        await apiService.setMonitoredWorkflows(selectedWorkflows);
      } catch (backendError) {
        console.log('Backend not available, using localStorage fallback');
      }
      
      setBanner({ type: 'success', message: `${selectedWorkflows.length} workflows are now being monitored.` });
      navigate("/dashboard");
    } catch (err) {
      setBanner({ type: 'error', message: 'Failed to save your selection. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async () => {
    setActionLoading(true);
    try {
      setBanner({ type: 'success', message: 'You can select workflows to protect later from the dashboard.' });
      navigate('/dashboard');
    } catch (err) {
      setBanner({ type: 'error', message: 'Failed to skip. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <TopNavigation minimal />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-gray-600">Loading workflows...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <TopNavigation minimal />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">
              Failed to fetch workflows
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TopNavigation minimal />
      {banner && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <SuccessErrorBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Select Workflows to Protect
          </h1>
          <p className="text-gray-600 text-sm">
            Great! Your HubSpot account is connected. Choose the workflows you
            want WorkflowGuard to monitor and protect.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-900">
              Your trial includes Professional Plan features, allowing you to
              monitor up to 500 workflows and retain 90 days of history. Get
              started by selecting your critical workflows below.
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between gap-4">
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
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32" aria-label="Status filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={folderFilter} onValueChange={setFolderFilter}>
                  <SelectTrigger className="w-40" aria-label="Folder filter">
                    <SelectValue placeholder="HubSpot Folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Folders</SelectItem>
                    {uniqueFolders.map((folder) => (
                      <SelectItem key={folder} value={folder}>
                        {folder}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="overflow-hidden">
            {filteredWorkflows.length === 0 && (
              <div className="text-center text-gray-500 py-8" data-testid="no-workflows">
                No workflows found
              </div>
            )}
            {filteredWorkflows.length === 0 ? (
              <div className="text-center py-12">
                {workflows.length === 0 ? (
                  <>
                    <p className="text-gray-500 mb-4">No workflows are currently available from your HubSpot account.</p>
                    <p className="text-gray-400 text-sm mb-6">This might be due to a temporary connection issue or because your HubSpot account doesn't have any workflows yet.</p>
                    <div className="flex justify-center gap-2">
                      <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                        Try Again
                      </Button>
                      <Button onClick={() => navigate('/dashboard')} variant="default" size="sm">
                        Continue to Dashboard
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 mb-4">No workflows found matching your filters.</p>
                    <div className="flex justify-center gap-2">
                      <Button onClick={() => { setSearchTerm(""); setStatusFilter("all"); setFolderFilter("all"); }} variant="outline" size="sm">
                        Clear Filters
                      </Button>
                      <Button onClick={() => navigate('/dashboard')} variant="outline" size="sm">
                        Go to Dashboard
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-4 py-3" scope="col">
                      <Checkbox
                        data-cy="master-checkbox"
                        checked={allSelected}
                        indeterminate={masterIndeterminate}
                        onCheckedChange={handleMasterToggle}
                        aria-label={allSelected ? "Deselect all workflows" : "Select all workflows"}
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700" scope="col">Workflow Name</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700" scope="col">HubSpot ID</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700" scope="col">HubSpot Folder</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700" scope="col">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700" scope="col">Last Modified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredWorkflows.map((workflow, idx) => (
                    <tr key={workflow.id} className="hover:bg-gray-50" tabIndex={0} aria-rowindex={idx + 2}>
                      <td className="px-4 py-3">
                        <Checkbox
                          data-cy="workflow-checkbox"
                          checked={selectedWorkflows.includes(workflow.id)}
                          onCheckedChange={() => handleWorkflowToggle(workflow.id)}
                          aria-label={selectedWorkflows.includes(workflow.id) ? `Deselect workflow ${workflow.name}` : `Select workflow ${workflow.name}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{workflow.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{workflow.hubspotId}</td>
                      <td className="px-4 py-3 text-sm text-gray-600"><span data-cy="folder-cell">{workflow.folder || "-"}</span></td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800 hover:bg-green-100"
                        >
                          <span data-cy="status-cell">{(workflow.status || "Active").charAt(0).toUpperCase() + (workflow.status || "Active").slice(1)}</span>
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600" aria-live="polite">
              Selected {selectedWorkflows.length} of {workflows.length} workflows. You have {MAX_SELECTION - selectedWorkflows.length} workflows remaining in your trial.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleSkip} disabled={actionLoading} aria-label="Skip workflow selection and go to dashboard">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Skip for now"}
              </Button>
              <Button
                onClick={handleStartProtecting}
                disabled={selectedWorkflows.length === 0 || actionLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
                aria-label="Start protecting selected workflows"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Protecting Workflows"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkflowSelection;
