import { Button } from "@/components/ui/button";
import TopNavigation from "@/components/TopNavigation";
import { FileText, Plus, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EmptyWorkflowHistory() {
  return (
    <div className="text-center text-gray-500 py-8" data-testid="empty-workflow-history">
      No Workflow History Yet
    </div>
  );
}
