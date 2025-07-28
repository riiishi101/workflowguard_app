import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import WorkflowGuardLogo from "./WorkflowGuardLogo";
import { Lock, Info } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import React, { useState } from "react";

interface ConnectHubSpotModalProps {
  open: boolean;
  onClose: () => void;
  onConnect: () => void;
}

const ConnectHubSpotModal = ({
  open,
  onClose,
  onConnect,
}: ConnectHubSpotModalProps) => {
  const [error, setError] = useState<string | null>(null);

  // Listen for OAuth errors in the URL (e.g., /?oauth_error=...)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("oauth_error");
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-8 bg-gray-50 border-0">
        <VisuallyHidden>
          <DialogTitle>Connect Your HubSpot Account</DialogTitle>
          <DialogDescription>
            Authorize WorkflowGuard to access your HubSpot Workflows for automatic version control.
          </DialogDescription>
        </VisuallyHidden>
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-blue-500" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-3">
              Connect Your HubSpot Account
            </h1>
            <p className="text-gray-600 text-sm">
              Authorize WorkflowGuard to access your HubSpot Workflows
            </p>
          </div>

          <div className="flex items-center justify-center space-x-4 py-4">
            <WorkflowGuardLogo showText={false} />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Lock className="w-3 h-3 text-blue-500" />
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
            </div>
            <div className="flex items-center gap-2">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Ffae26f580f3f4b359fc5216711c44c53%2F2384bbe9d45a43a4b222a18fb4a481ac?format=webp&width=800"
                alt="HubSpot Logo"
                className="w-8 h-8"
              />
              <span className="text-sm font-medium text-gray-700">HubSpot</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  This secure connection allows WorkflowGuard to automatically
                  save versions of your HubSpot Workflows.
                </p>
                <p className="text-sm text-blue-800">
                  You'll be redirected to HubSpot's authorization page. Please
                  ensure you select the correct HubSpot portal if you have
                  multiple.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 text-red-800 rounded p-3 mb-2 text-sm font-medium border border-red-200" data-testid="oauth-error">
              {error}
            </div>
          )}

          <Button
            onClick={() => {
              setError(null);
              onConnect();
            }}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Ffae26f580f3f4b359fc5216711c44c53%2F2384bbe9d45a43a4b222a18fb4a481ac?format=webp&width=800"
              alt="HubSpot Logo"
              className="w-5 h-5 brightness-0 invert"
            />
            Connect to HubSpot
          </Button>

          <div className="flex items-center justify-center gap-6 text-xs">
            <a href="#" className="text-blue-500 hover:underline">
              Why do we need access?
            </a>
            <span className="text-gray-400">•</span>
            <a href="#" className="text-blue-500 hover:underline">
              Trouble connecting?
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Secure Connection</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>SSL Protected</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectHubSpotModal;
