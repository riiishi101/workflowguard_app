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
import { useAuth, usePlan } from '../components/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const Settings = () => {

  const { user, loading } = useAuth();
  const { plan } = usePlan();
  const [activeTab, setActiveTab] = useState("plan-billing");
  const { toast } = useToast();
  
  // Ensure plan always has a valid structure to prevent controlled/uncontrolled Tabs warning
  const safePlan = plan && Array.isArray(plan.features)
    ? plan
    : {
        name: 'Starter',
        features: [],
        status: 'active'
      };
  const safeSetActiveTab = (tab) => {
    if (typeof tab === 'string' && tab) {
      setActiveTab(tab);
    } else {
      setActiveTab('plan-billing');
    }
  };

  // Debug log for user and plan
  // console.log('Settings debug:', { user, plan: safePlan });

  const HUBSPOT_MANAGE_SUBSCRIPTION_URL = user?.hubspotPortalId
    ? `https://app.hubspot.com/ecosystem/${user.hubspotPortalId}/marketplace/apps`
    : 'https://app.hubspot.com/ecosystem/marketplace/apps';

  const showPortalWarning = !user?.hubspotPortalId;

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
    setActiveTab(tab.key);
  };

  const handleDisconnectHubSpot = async () => {
    if (!window.confirm('Are you sure you want to disconnect your HubSpot account? This will disable all HubSpot features.')) return;
    try {
      await fetch('/api/users/me/disconnect-hubspot', { method: 'POST', credentials: 'include' });
      toast({ title: 'Disconnected', description: 'Your HubSpot account has been disconnected.' });
      window.location.reload();
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to disconnect HubSpot account.', variant: 'destructive' });
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

        {user && user.role === 'admin' && (
          <div className="mb-8 flex items-center gap-4">
            <h2 className="text-lg font-semibold mr-4">User Management (Admin Only)</h2>
            <Button onClick={() => setActiveTab('user-permissions')}>Manage Users</Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={safeSetActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-gray-50 p-1 rounded-lg">
            <TabsTrigger key="plan-billing" value="plan-billing" onClick={() => safeSetActiveTab('plan-billing')}>
              My Plan & Billing
            </TabsTrigger>
            <TabsTrigger key="profile" value="profile" onClick={() => safeSetActiveTab('profile')}>
              My Profile
            </TabsTrigger>
            {Array.isArray(safePlan.features) && safePlan.features.includes('custom_notifications') && (
              <TabsTrigger key="notifications" value="notifications" onClick={() => safeSetActiveTab('notifications')}>
                Notifications
              </TabsTrigger>
            )}
            {user && user.role === 'admin' && (
              <TabsTrigger key="user-permissions" value="user-permissions" onClick={() => safeSetActiveTab('user-permissions')}>
                User Permissions
              </TabsTrigger>
            )}
            {user && (user.role === 'admin' || user.role === 'restorer') && (
              <TabsTrigger key="audit-log" value="audit-log" onClick={() => safeSetActiveTab('audit-log')}>
                Audit Log
              </TabsTrigger>
            )}
            {user && user.role === 'admin' && (
              <TabsTrigger key="api-access" value="api-access" onClick={() => safeSetActiveTab('api-access')}>
                API Access
              </TabsTrigger>
            )}
          </TabsList>

          <div className="mt-8">
            <TabsContent value="plan-billing">
              <PlanBillingTab />
            </TabsContent>
            <TabsContent value="notifications">
              <NotificationsTab setActiveTab={safeSetActiveTab} />
            </TabsContent>
            {user && user.role === 'admin' && (
              <TabsContent value="user-permissions">
                <UserPermissionsTab setActiveTab={safeSetActiveTab} />
              </TabsContent>
            )}
            {user && (user.role === 'admin' || user.role === 'restorer') && (
              <TabsContent value="audit-log">
                <AuditLogTab />
              </TabsContent>
            )}
            {user && user.role === 'admin' && (
              <TabsContent value="api-access">
                <ApiAccessTab setActiveTab={safeSetActiveTab} />
              </TabsContent>
            )}
            <TabsContent value="profile">
              <ProfileTab />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
