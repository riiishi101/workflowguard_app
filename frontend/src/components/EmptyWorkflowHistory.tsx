import { Button } from "@/components/ui/button";
import TopNavigation from "@/components/TopNavigation";
import { FileText, Plus, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import CreateNewWorkflowModal from "./CreateNewWorkflowModal";

// Accept workflow as a prop
interface WorkflowInfo {
  id: string;
  name: string;
  status: string;
  hubspotId?: string;
}

const EmptyWorkflowHistory = ({ workflow }: { workflow?: WorkflowInfo }) => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateWorkflow = () => {
    console.log('Create New Workflow button clicked, opening modal');
    setShowCreateModal(true);
  };

  const handleGoToHubSpot = () => {
    if (workflow?.hubspotId) {
      window.open(`https://app.hubspot.com/workflows/${workflow.hubspotId}`, "_blank");
    } else {
      window.open("https://app.hubspot.com", "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TopNavigation />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-gray-900">
                  Workflow History
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Info (only if workflow is provided) */}
        {workflow && (
          <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {workflow.name}
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{workflow.status || "Active"}</span>
              </div>
              <span className="text-sm text-gray-500">ID: {workflow.id}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoToHubSpot}
              className="text-blue-600"
              disabled={!workflow.hubspotId}
            >
              Go to Workflow in HubSpot
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Empty State */}
        <div className="py-10 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            No Workflow History Yet
          </h3>
          <p className="text-gray-600 mb-2">
            Start creating workflows to track changes and activities.
          </p>
          <p className="text-gray-600 mb-8">
            Your workflow history will appear here.
          </p>
          <Button
            onClick={handleCreateWorkflow}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Workflow
          </Button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-8">
          <p className="text-sm text-gray-600">0 versions selected</p>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="text-gray-400"
          >
            Compare Selected Versions
          </Button>
        </div>
      </main>
      <CreateNewWorkflowModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        version={{ id: 'dummy', createdAt: new Date().toISOString(), createdBy: 'System' }}
        onCreated={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default EmptyWorkflowHistory;
