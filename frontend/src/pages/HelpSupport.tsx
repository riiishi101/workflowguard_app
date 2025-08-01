import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import MainAppLayout from "@/components/MainAppLayout";
import ContentSection from "@/components/ContentSection";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const HelpSupport = () => {
  const navigate = useNavigate();
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const popularTopics = [
    {
      icon: Link,
      title: "How to connect your HubSpot account",
      color: "text-blue-500",
      route: "/help/connect-hubspot"
    },
    {
      icon: RotateCcw,
      title: "Restoring a workflow to a previous state",
      color: "text-blue-500",
      route: "/help/restore-workflow"
    },
    {
      icon: Users,
      title: "Managing user permissions",
      color: "text-blue-500",
      route: "/help/user-permissions"
    },
    {
      icon: MessageSquare,
      title: "Integrating with Slack",
      color: "text-blue-500",
      route: "/help/slack-integration"
    },
  ];

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

  const documentationCards = [
    {
      icon: FileText,
      title: "User Manual",
      description:
        "Complete step-by-step guide to using all WorkflowGuard features.",
      color: "text-blue-500",
      route: "/help/user-manual"
    },
    {
      icon: Lightbulb,
      title: "Feature Spotlights",
      description:
        "In-depth tutorials highlighting specific features and capabilities.",
      color: "text-blue-500",
      route: "/help/feature-spotlights"
    },
    {
      icon: Rocket,
      title: "Advanced Use Cases",
      description: "Real-world examples and complex workflow implementations.",
      color: "text-blue-500",
      route: "/help/advanced-use-cases"
    },
    {
      icon: AlertTriangle,
      title: "Troubleshooting",
      description:
        "Common issues and their solutions to keep your workflows running smoothly.",
      color: "text-blue-500",
      route: "/help/troubleshooting"
    },
    {
      icon: Code,
      title: "API Docs",
      description:
        "Technical documentation for developers integrating with our API.",
      color: "text-blue-500",
      route: "/help/api-docs"
    },
  ];

  const handleTopicClick = (route: string) => {
    navigate(route);
  };

  return (
    <MainAppLayout 
      title="Help & Support Center"
      description="Find answers to your questions, explore tutorials, and connect with our support team"
    >
      {/* Search Bar */}
      <ContentSection>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search for articles, topics, or FAQs..."
            className="pl-10 py-3 text-base"
          />
        </div>
      </ContentSection>

      {/* Popular Topics */}
      <ContentSection>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Popular Topics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {popularTopics.map((topic, index) => {
            const IconComponent = topic.icon;
            return (
              <Card
                key={index}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleTopicClick(topic.route)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <IconComponent
                      className={`w-5 h-5 ${topic.color} flex-shrink-0`}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {topic.title}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ContentSection>

      {/* Common Questions */}
      <ContentSection>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Common Questions
        </h2>
        <div className="space-y-3">
          {commonQuestions.map((question) => (
            <Collapsible
              key={question.id}
              open={openQuestion === question.id}
              onOpenChange={(isOpen) =>
                setOpenQuestion(isOpen ? question.id : null)
              }
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-medium text-gray-900 text-left">
                    {question.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      openQuestion === question.id ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 py-3 text-sm text-gray-600 bg-gray-50 border-l border-r border-b border-gray-200 rounded-b-lg">
                  {question.answer}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ContentSection>

      {/* Documentation */}
      <ContentSection>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Comprehensive Guides & Documentation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documentationCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <Card
                key={index}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleTopicClick(card.route)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <IconComponent
                      className={`w-6 h-6 ${card.color} flex-shrink-0 mt-1`}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {card.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ContentSection>
    </MainAppLayout>
  );
};

export default HelpSupport;
