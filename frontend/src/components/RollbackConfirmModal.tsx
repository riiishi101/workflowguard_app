import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import RoleGuard from './RoleGuard';

interface RollbackConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  workflowName?: string;
}

const RollbackConfirmModal = ({
  open,
  onClose,
  onConfirm,
  workflowName = "Customer Onboarding",
}: RollbackConfirmModalProps) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <RoleGuard roles={['admin']}>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg p-0">
          <VisuallyHidden>
            <DialogTitle>Confirm Rollback to Latest Snapshot</DialogTitle>
            <DialogDescription>
              Confirm rollback of workflow '{workflowName}' to its latest saved snapshot. This action cannot be undone.
            </DialogDescription>
          </VisuallyHidden>

          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Confirm Rollback to Latest Snapshot
            </h2>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Warning Icon */}
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>

            {/* Warning Message */}
            <div className="text-center space-y-4">
              <p className="text-lg text-gray-900">
                Are you sure you want to revert the workflow '{workflowName}' to
                its latest saved snapshot?
              </p>
              <p className="text-gray-600">
                This will overwrite the current live version in HubSpot. This
                action cannot be undone.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Confirm Rollback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
};

export default RollbackConfirmModal;
