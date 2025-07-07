import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TopNavigation from "@/components/TopNavigation";
import PlanBillingTab from "@/components/settings/PlanBillingTab";
import NotificationsTab from "@/components/settings/NotificationsTab";
import UserPermissionsTab from "@/components/settings/UserPermissionsTab";
import AuditLogTab from "@/components/settings/AuditLogTab";
import ApiAccessTab from "@/components/settings/ApiAccessTab";
import ProfileTab from "@/components/settings/ProfileTab";
import {
  CreditCard,
  Bell,
  Users,
  FileText,
  Code,
  UserCircle,
} from "lucide-react";
import { useRequireAuth, useAuth, usePlan } from '../components/AuthContext';
import RoleGuard from '../components/RoleGuard';

const Settings = () => {
  useRequireAuth();
  const { user } = useAuth();
  const { plan, loading } = usePlan();
  const [activeTab, setActiveTab] = useState("plan-billing");

  const HUBSPOT_MANAGE_SUBSCRIPTION_URL = plan?.hubspotPortalId
    ? `https://app.hubspot.com/ecosystem/${plan.hubspotPortalId}/marketplace/apps`
    : 'https://app.hubspot.com/ecosystem/marketplace/apps';

  const showPortalWarning = !plan?.hubspotPortalId;

  if (loading) return null;

  const tabs = [
    { key: 'plan-billing', label: 'My Plan & Billing', always: true },
    { key: 'profile', label: 'My Profile', always: true },
    { key: 'notifications', label: 'Notifications', feature: 'custom_notifications', requiredPlan: 'Professional Plan' },
    { key: 'user-permissions', label: 'User Permissions', feature: 'user_permissions', requiredPlan: 'Enterprise Plan' },
    { key: 'audit-log', label: 'Audit Log', feature: 'audit_logs', requiredPlan: 'Enterprise Plan' },
    { key: 'api-access', label: 'API Access', feature: 'api_access', requiredPlan: 'Enterprise Plan' },
  ];

  const handleTabClick = (tab) => {
    if (tab.always || (tab.feature && plan.features.includes(tab.feature))) {
      setActiveTab(tab.key);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TopNavigation />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            App Settings
          </h1>
          <p className="text-gray-600 text-sm">
            Manage app-level configurations, subscriptions, and user access for
            WorkflowGuard.
          </p>
        </div>

        <RoleGuard roles={['admin']}>
          <div className="mb-8 flex items-center gap-4">
            <h2 className="text-lg font-semibold mr-4">User Management (Admin Only)</h2>
            <Button onClick={() => alert('User management feature coming soon!')}>Manage Users</Button>
          </div>
        </RoleGuard>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-gray-50 p-1 rounded-lg">
            <TabsTrigger key="plan-billing" value="plan-billing" onClick={() => handleTabClick({ key: 'plan-billing', always: true })}>
              My Plan & Billing
            </TabsTrigger>
            <TabsTrigger key="profile" value="profile" onClick={() => handleTabClick({ key: 'profile', always: true })}>
              My Profile
            </TabsTrigger>
            {plan.features.includes('custom_notifications') && (
              <TabsTrigger key="notifications" value="notifications" onClick={() => handleTabClick({ key: 'notifications', feature: 'custom_notifications' })}>
                Notifications
              </TabsTrigger>
            )}
            <RoleGuard roles={['admin']}>
              <TabsTrigger key="user-permissions" value="user-permissions" onClick={() => handleTabClick({ key: 'user-permissions', feature: 'user_permissions' })}>
                User Permissions
              </TabsTrigger>
            </RoleGuard>
            <RoleGuard roles={['admin', 'restorer']}>
              <TabsTrigger key="audit-log" value="audit-log" onClick={() => handleTabClick({ key: 'audit-log', feature: 'audit_logs' })}>
                Audit Log
              </TabsTrigger>
            </RoleGuard>
            <RoleGuard roles={['admin']}>
              <TabsTrigger key="api-access" value="api-access" onClick={() => handleTabClick({ key: 'api-access', feature: 'api_access' })}>
                API Access
              </TabsTrigger>
            </RoleGuard>
          </TabsList>

          <div className="mt-8">
            <TabsContent value="plan-billing">
              <PlanBillingTab />
            </TabsContent>
            <TabsContent value="notifications">
              <NotificationsTab setActiveTab={setActiveTab} />
            </TabsContent>
            <RoleGuard roles={['admin']}>
              <TabsContent value="user-permissions">
                <UserPermissionsTab setActiveTab={setActiveTab} />
              </TabsContent>
            </RoleGuard>
            <RoleGuard roles={['admin', 'restorer']}>
              <TabsContent value="audit-log">
                <AuditLogTab setActiveTab={setActiveTab} />
              </TabsContent>
            </RoleGuard>
            <RoleGuard roles={['admin']}>
              <TabsContent value="api-access">
                <ApiAccessTab setActiveTab={setActiveTab} />
              </TabsContent>
            </RoleGuard>
            <TabsContent value="profile">
              <ProfileTab />
            </TabsContent>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">Billing History</h2>
            <p className="mb-4 text-gray-600">
              All invoices and billing history are managed in your HubSpot account.
            </p>
            <Button
              onClick={() => window.open(`https://app.hubspot.com/billing/${plan?.hubspotPortalId || ''}`, '_blank')}
              className="bg-blue-600 text-white mb-4"
            >
              View Invoices in HubSpot
            </Button>
          </div>
        </Tabs>

        {showPortalWarning && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 mt-2 text-yellow-800 rounded">
            <strong>Note:</strong> To manage your subscription, please connect your HubSpot account.
          </div>
        )}

        <Button
          onClick={() => window.open(HUBSPOT_MANAGE_SUBSCRIPTION_URL, '_blank')}
          className="text-blue-600 text-base font-medium bg-transparent shadow-none border-none hover:underline mt-2"
        >
          Manage Subscription
        </Button>

        <Button
          onClick={() => window.location.href = '/api/auth/hubspot'}
          className="bg-orange-600 text-white mt-4 mb-2"
        >
          Reconnect to HubSpot
        </Button>
      </main>
    </div>
  );
};

export default Settings;
