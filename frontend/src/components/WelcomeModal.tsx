import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import WorkflowGuardLogo from "./WorkflowGuardLogo";
import { Shield, RotateCcw, FileText, CheckCircle, Star, Zap } from "lucide-react";
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
      <DialogContent className="max-w-4xl p-8 bg-gray-50 border-0">
        <VisuallyHidden>
          <DialogTitle>Welcome to WorkflowGuard</DialogTitle>
          <DialogDescription>
            Welcome to WorkflowGuard - Protect your HubSpot automations from accidental changes and easily recover lost work.
          </DialogDescription>
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

          {/* Trial Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">
                Professional Trial Active
              </h3>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-700">21 Days Free</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-700">Daily & on-publish snapshots</span>
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
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-700">500 workflows monitored</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-700">Advanced monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-700">Priority support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Options After Trial */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg">
              Choose Your Plan After Trial
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Starter Plan */}
              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <h4 className="font-semibold text-gray-900 mb-2">Starter</h4>
                <div className="text-2xl font-bold text-blue-600 mb-2">$29</div>
                <div className="text-sm text-gray-600 mb-3">/month</div>
                <div className="text-xs text-gray-600 mb-3">Perfect for small teams</div>
                <ul className="text-xs text-gray-700 space-y-1 mb-4">
                  <li>• 50 Workflows</li>
                  <li>• 30 Days History</li>
                  <li>• Basic Monitoring</li>
                  <li>• Email Support</li>
                </ul>
                <Button variant="outline" size="sm" className="w-full">
                  Choose Starter
                </Button>
              </div>

              {/* Professional Plan */}
              <div className="border-2 border-blue-500 rounded-lg p-4 text-center relative">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Recommended</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Professional</h4>
                <div className="text-2xl font-bold text-blue-600 mb-2">$59</div>
                <div className="text-sm text-gray-600 mb-3">/month</div>
                <div className="text-xs text-gray-600 mb-3">For growing businesses</div>
                <ul className="text-xs text-gray-700 space-y-1 mb-4">
                  <li>• 500 Workflows</li>
                  <li>• 90 Days History</li>
                  <li>• Advanced Monitoring</li>
                  <li>• Priority Support</li>
                </ul>
                <Button size="sm" className="w-full">
                  Choose Professional
                </Button>
              </div>

              {/* Enterprise Plan */}
              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <h4 className="font-semibold text-gray-900 mb-2">Enterprise</h4>
                <div className="text-2xl font-bold text-blue-600 mb-2">$199</div>
                <div className="text-sm text-gray-600 mb-3">/month</div>
                <div className="text-xs text-gray-600 mb-3">Enterprise solution</div>
                <ul className="text-xs text-gray-700 space-y-1 mb-4">
                  <li>• Unlimited Workflows</li>
                  <li>• Unlimited History</li>
                  <li>• 24/7 Support</li>
                  <li>• API Access</li>
                </ul>
                <Button variant="outline" size="sm" className="w-full">
                  Choose Enterprise
                </Button>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Start your 21-day free trial of the Professional plan. No credit card required.
            You can upgrade, downgrade, or cancel at any time.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={onConnectHubSpot}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              <Shield className="w-4 h-4 mr-2" />
              Connect HubSpot & Start Trial
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="px-8 py-3"
            >
              Learn More
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
