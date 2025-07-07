import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import TopNavigation from "@/components/TopNavigation";
import {
  Search,
  Link,
  RotateCcw,
  Users,
  MessageSquare,
  ChevronDown,
  FileText,
  Lightbulb,
  Rocket,
  AlertTriangle,
  Code,
  Activity,
  MessageCircle,
  Map,
  ExternalLink,
} from "lucide-react";
import { useRequireAuth } from '../components/AuthContext';

const HelpSupport = () => {
  useRequireAuth();
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const commonQuestions = [
    {
      id: "1",
      question: "How do I get started with WorkflowGuard?",
      answer:
        "Getting started with WorkflowGuard is easy! First, connect your HubSpot account, then select the workflows you want to protect. Our onboarding guide will walk you through each step.",
    },
    {
      id: "2",
      question: "Can I restore a workflow to a previous version?",
      answer:
        "Yes! WorkflowGuard automatically saves versions of your workflows. You can restore any previous version through the Workflow History page with just a few clicks.",
    },
    {
      id: "3",
      question: "What integrations are currently supported?",
      answer:
        "WorkflowGuard currently supports HubSpot workflows, Slack notifications, and webhook integrations. We're continuously adding new integrations based on user feedback.",
    },
    {
      id: "4",
      question: "How does billing work for team accounts?",
      answer:
        "Team billing is based on the number of workflows monitored and team members. You can add or remove team members at any time, and billing is prorated automatically.",
    },
    {
      id: "5",
      question: "Is my data secure with WorkflowGuard?",
      answer:
        "Absolutely! We use enterprise-grade security with encrypted data transmission, secure storage, and regular security audits. Your workflow data is never shared with third parties.",
    },
  ];

  // New FAQ questions as provided by the user
  const faqs = [
    {
      question: "How do I connect my HubSpot account to WorkflowGuard?",
      answer: "Go to the app dashboard and click 'Connect your HubSpot Account.' Follow the OAuth prompts to authorize WorkflowGuard. Once connected, you can start protecting your workflows."
    },
    {
      question: "How do I rollback a workflow to a previous version?",
      answer: "Navigate to Workflow History, select the workflow, and choose the version you want to restore. Click 'Rollback' and confirm your action. The workflow will be reverted to the selected version."
    },
    {
      question: "What data does WorkflowGuard back up?",
      answer: "WorkflowGuard backs up your HubSpot workflow definitions, including triggers, actions, and settings. It does not back up workflow execution data or HubSpot contacts."
    },
    {
      question: "How do I manage my WorkflowGuard subscription?",
      answer: "Go to Settings > My Plan & Billing. Here you can view your current plan, usage, and manage your subscription through HubSpot's billing portal."
    },
    {
      question: "How are notifications configured for workflow changes?",
      answer: "Admins can configure notifications in Settings > Notifications. You can set up email, webhook, or Slack notifications for workflow changes, rollbacks, and overages."
    },
    {
      question: "How do I add or remove workflows from monitoring?",
      answer: "On the Dashboard, click 'Add Workflow' to select new workflows to protect. To remove, go to the workflow list, select the workflow, and choose 'Remove from Monitoring.'"
    },
    {
      question: "What are the different types of workflow versions (e.g., snapshot, manual save)?",
      answer: "WorkflowGuard creates automatic snapshots on publish, daily, and when major changes are detected. You can also create manual saves at any time for important milestones."
    },
    {
      question: "Can I download a workflow's JSON data?",
      answer: "Yes, from the Workflow History or Details page, click 'Download JSON' to export the workflow definition for backup or review."
    },
    {
      question: "What are the different user roles (Viewer, Restorer, Admin) and their permissions?",
      answer: "Viewers can see workflows and history. Restorers can rollback workflows. Admins can manage users, settings, and all workflows. Roles are managed in Settings > User Permissions."
    },
    {
      question: "How does WorkflowGuard ensure data security?",
      answer: "All data is encrypted in transit and at rest. Access is role-based, and regular security audits are performed. WorkflowGuard never shares your data with third parties."
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <TopNavigation />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Help & Support Center
          </h1>
          <p className="text-gray-600 text-sm">
            Find answers to your questions in our FAQ below.
          </p>
        </div>

        {/* FAQ Section Only */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4">
                <div className="font-medium text-gray-900 mb-1">{faq.question}</div>
                <div className="text-gray-700 text-sm">{faq.answer}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpSupport;
