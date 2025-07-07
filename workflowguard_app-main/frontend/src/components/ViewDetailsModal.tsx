import { Dialog, DialogPortal, DialogOverlay, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown, ChevronRight, Mail, Clock, Zap } from "lucide-react";
import { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ViewDetailsModalProps {
  open: boolean;
  onClose: () => void;
  version: any;
}

const ViewDetailsModal = ({
  open,
  onClose,
  version,
}: ViewDetailsModalProps) => {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    email: true,
    delay: false,
    branch: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!version) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-h-[80vh] overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>View Workflow Version Details</DialogTitle>
            <DialogDescription>Details and actions for the selected workflow version.</DialogDescription>
          </VisuallyHidden>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Customer Onboarding
              </h2>
              <p className="text-sm text-gray-600">
                Version Snapshot from June 20, 2025, 10:00 AM IST by John Doe
              </p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Overview Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Overview
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Status
                    </label>
                    <p className="text-sm text-gray-900 font-medium">Active</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Description
                    </label>
                    <p className="text-sm text-gray-900">
                      Nurtures new customers post-purchase.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Created By
                    </label>
                    <p className="text-sm text-gray-900">John Doe</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Workflow ID
                    </label>
                    <p className="text-sm text-gray-900 font-mono">123456789</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Last Modified
                    </label>
                    <p className="text-sm text-gray-900">
                      June 20, 2025, 10:00 AM IST
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Goal
                    </label>
                    <p className="text-sm text-gray-900">
                      Contact reaches 'Customer' life cycle stage
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow Steps & Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Workflow Steps & Actions
              </h3>
              <div className="space-y-3">
                {/* Send Welcome Email */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection("email")}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-gray-900">
                        Send Welcome Email
                      </span>
                    </div>
                    {expandedSections.email ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {expandedSections.email && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600">
                            Email Name
                          </label>
                          <p className="text-sm text-gray-900">
                            Welcome to Our Service
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">
                            Sender
                          </label>
                          <p className="text-sm text-gray-900">
                            support@example.com
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Delay */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection("delay")}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-orange-500" />
                      <span className="font-medium text-gray-900">
                        Delay for 1 Day
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {/* If/Then Branch */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection("branch")}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-gray-900">
                        If/Then Branch: High Value Leads
                      </span>
                    </div>
                    {expandedSections.branch ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {expandedSections.branch && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600">
                            Condition
                          </label>
                          <p className="text-sm text-gray-900">
                            If Contact Property 'Industry' is 'Tech'
                          </p>
                        </div>
                        <div className="ml-4 space-y-2">
                          <div className="text-xs font-medium text-gray-600">
                            If True
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-900">
                              Send Premium Features Email
                            </span>
                          </div>
                          <div className="text-xs font-medium text-gray-600 mt-2">
                            If False
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm text-gray-900">
                              Send Basic Features Email
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Workflow Settings & Properties */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Workflow Settings & Properties
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Timezone
                    </label>
                    <p className="text-sm text-gray-900">
                      Eastern Time (US & Canada)
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Auto-archive
                    </label>
                    <p className="text-sm text-gray-900">Yes</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Skip Inactive Contacts
                    </label>
                    <p className="text-sm text-gray-900">Yes</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Owner
                    </label>
                    <p className="text-sm text-gray-900">Marketing Team</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Allow Re-enrollment
                    </label>
                    <p className="text-sm text-gray-900">Yes</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Unenrollment Triggers
                    </label>
                    <p className="text-sm text-gray-900">
                      Contact unsubscribes from all emails
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <Button variant="outline" onClick={onClose}>
              Back to History
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              Restore this Version
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default ViewDetailsModal;
