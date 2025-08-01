import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { WorkflowHistoryVersion } from "@/lib/api";

interface RestoreVersionModalProps {
  open: boolean;
  onClose: () => void;
  version: WorkflowHistoryVersion | null;
  onRestore: (version: WorkflowHistoryVersion) => Promise<void>;
  loading?: boolean;
}

const RestoreVersionModal = ({
  open,
  onClose,
  version,
  onRestore,
  loading = false,
}: RestoreVersionModalProps) => {
  const [restoreType, setRestoreType] = useState("overwrite");
  const [confirmText, setConfirmText] = useState("");

  const handleRestore = async () => {
    if (confirmText === "RESTORE" && version) {
      await onRestore(version);
      setConfirmText("");
      setRestoreType("overwrite");
    }
  };

  const isConfirmValid = confirmText === "RESTORE";

  if (!version) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <VisuallyHidden>
          <DialogTitle>Confirm Workflow Rollback</DialogTitle>
        </VisuallyHidden>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            WARNING: Confirm Workflow Rollback
          </h2>
        </div>

        <div className="space-y-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Warning</strong>
              <br />
              This action will restore a previous version of the workflow.
              Please review the details carefully before proceeding.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Workflow Version
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Version to Restore:</strong> {new Date(version.date).toLocaleString()} by {version.initiator} ({version.type})
                </p>
                <p>
                  <strong>Version Number:</strong> {version.versionNumber}
                </p>
                {version.notes && version.notes !== "No notes available" && (
                  <p>
                    <strong>Notes:</strong> {version.notes}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-900 mb-3 block">
                Choose restore option:
              </Label>
              <RadioGroup
                value={restoreType}
                onValueChange={setRestoreType}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="overwrite" id="overwrite" />
                    <Label htmlFor="overwrite" className="font-medium">
                      Restore and Overwrite Current Workflow
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    This will replace the current live version in HubSpot. This action cannot be undone.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="new" />
                    <Label htmlFor="new" className="font-medium">
                      Restore as a New Inactive Workflow
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    This will create a new, inactive workflow in HubSpot based on this version. The current live workflow will remain unchanged.
                  </p>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label
                htmlFor="confirm"
                className="text-sm font-medium text-gray-900"
              >
                To confirm, please type <strong>RESTORE</strong>
              </Label>
              <Input
                id="confirm"
                placeholder="Type RESTORE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="mt-1"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleRestore}
              disabled={!isConfirmValid || loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                "Confirm Rollback"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RestoreVersionModal;
