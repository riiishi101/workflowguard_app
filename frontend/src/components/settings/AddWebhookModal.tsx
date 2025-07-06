import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Eye, EyeOff } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import RoleGuard from '../../components/RoleGuard';

interface AddWebhookModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (webhook: any) => void;
  initialData?: any;
}

const triggerEvents = [
  { id: "workflow-rolled-back", label: "Workflow Rolled Back" },
  { id: "new-version-saved", label: "New Workflow Version Saved" },
  { id: "audit-log-created", label: "Audit Log Entry Created" },
  { id: "workflow-deleted", label: "Workflow Deleted" },
  { id: "workflow-activated", label: "Workflow Activated/Deactivated" },
];

const AddWebhookModal = ({ open, onClose, onAdd, initialData }: AddWebhookModalProps) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    endpointUrl: initialData?.endpointUrl || "",
    secret: initialData?.secret || "",
    selectedEvents: initialData?.eventTypes || [],
  });
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    setFormData({
      name: initialData?.name || "",
      endpointUrl: initialData?.endpointUrl || "",
      secret: initialData?.secret || "",
      selectedEvents: initialData?.eventTypes || [],
    });
  }, [open, initialData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEventToggle = (eventId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedEvents: prev.selectedEvents.includes(eventId)
        ? prev.selectedEvents.filter((id) => id !== eventId)
        : [...prev.selectedEvents, eventId],
    }));
  };

  const handleSubmit = () => {
    onAdd({
      name: formData.name,
      endpointUrl: formData.endpointUrl,
      secret: formData.secret,
      eventTypes: formData.selectedEvents,
    });
  };

  const isValid =
    formData.name.trim() &&
    formData.endpointUrl.trim() &&
    formData.selectedEvents.length > 0;

  return (
    <RoleGuard roles={['admin', 'editor']}>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <VisuallyHidden>
            <DialogTitle>{initialData ? 'Edit Webhook' : 'Add New Webhook'}</DialogTitle>
            <DialogDescription>
              {initialData ? 'Edit webhook configuration and settings.' : 'Configure a new webhook to receive notifications about workflow events.'}
            </DialogDescription>
          </VisuallyHidden>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {initialData ? 'Edit Webhook' : 'Add New Webhook'}
            </h2>
          </div>

          <div className="space-y-6">
            {/* Webhook Name */}
            <div>
              <Label htmlFor="webhook-name" className="text-sm font-medium">
                Webhook Name (Optional)
              </Label>
              <Input
                id="webhook-name"
                placeholder="e.g., Slack DevOps Channel Alerts"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Endpoint URL */}
            <div>
              <Label htmlFor="endpoint-url" className="text-sm font-medium">
                Endpoint URL
              </Label>
              <Input
                id="endpoint-url"
                placeholder="https://your-webhook-receiver.com/"
                value={formData.endpointUrl}
                onChange={(e) => handleInputChange("endpointUrl", e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Trigger Events */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Trigger Events
              </Label>
              <div className="space-y-3">
                {triggerEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={event.id}
                      checked={formData.selectedEvents.includes(event.id)}
                      onCheckedChange={() => handleEventToggle(event.id)}
                    />
                    <Label
                      htmlFor={event.id}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {event.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Webhook Secret */}
            <div>
              <Label htmlFor="webhook-secret" className="text-sm font-medium">
                Webhook Secret (Optional)
              </Label>
              <div className="relative mt-1">
                <Input
                  id="webhook-secret"
                  type={showSecret ? "text" : "password"}
                  placeholder="Enter a secret for signature verification"
                  value={formData.secret}
                  onChange={(e) => handleInputChange("secret", e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  {showSecret ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Provide a secret key to enable signature verification at your
                endpoint.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {initialData ? 'Update Webhook' : 'Add Webhook'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
};

export default AddWebhookModal;
