import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import WorkflowGuardLogo from "./WorkflowGuardLogo";
import { Shield, RotateCcw, FileText, CheckCircle } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  onConnectHubSpot: () => void;
}

const WelcomeModal = ({
  open,
  onClose,
  onConnectHubSpot,
}: WelcomeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md p-8 bg-gray-50 border-0">
        <VisuallyHidden>
          <DialogTitle>Welcome to WorkflowGuard</DialogTitle>
        </VisuallyHidden>
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <WorkflowGuardLogo />
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-3">
              Welcome to WorkflowGuard!
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Protect your HubSpot automations from accidental changes and
              easily recover lost work.
            </p>
          </div>

          <div className="flex justify-center gap-8 py-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-sm text-gray-700 font-medium">
                Never lose a change
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <RotateCcw className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-sm text-gray-700 font-medium">
                Rollback instantly
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-sm text-gray-700 font-medium">
                Track all modifications
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Professional Trial Active
              </h3>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-gray-700">
                  Daily & on-publish snapshots
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-gray-700">90 days of history</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-gray-700">Workflow comparison</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            You're currently on a 21-day free trial with access to Professional
            Plan features
          </p>

          <Button
            onClick={onConnectHubSpot}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium"
          >
            Connect Your HubSpot Account
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
