import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import MainAppLayout from "@/components/MainAppLayout";
import ContentSection from "@/components/ContentSection";
import PlanBillingTab from "@/components/settings/PlanBillingTab";
import NotificationsTab from "@/components/settings/NotificationsTab";
import AuditLogTab from "@/components/settings/AuditLogTab";
import ProfileTab from "@/components/settings/ProfileTab";
import ManageSubscriptionTab from "@/components/settings/ManageSubscriptionTab";
import {
  CreditCard,
  Bell,
  FileText,
  UserCircle,
} from "lucide-react";

const Settings = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    () => searchParams.get("tab") || "manage-subscription"
  );

  const tabs = [
    {
      id: "manage-subscription",
      label: "Manage Subscription",
      icon: CreditCard,
      component: ManageSubscriptionTab,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      component: NotificationsTab,
    },
    {
      id: "audit-log",
      label: "Audit Log",
      icon: FileText,
      component: AuditLogTab,
    },
    {
      id: "profile",
      label: "My Profile",
      icon: UserCircle,
      component: ProfileTab,
    },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || PlanBillingTab;
  
  console.log('🔍 Settings - Active tab:', activeTab);
  console.log('🔍 Settings - Active component:', ActiveComponent.name);

  return (
    <MainAppLayout 
      title="App Settings"
      description="Manage app-level configurations, subscriptions, and user access for WorkflowGuard."
    >
      <ContentSection>
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex space-x-1 border-b border-gray-200">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            <ActiveComponent />
          </div>
        </div>
      </ContentSection>
    </MainAppLayout>
  );
};

export default Settings;
