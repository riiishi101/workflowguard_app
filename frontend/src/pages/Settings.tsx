import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { usePlan } from '../components/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { AppLayout, PageHeader, ContentSection, GridLayout } from '../components/layout/AppLayout';
import { EnhancedCard, EnhancedCardHeader, EnhancedCardContent } from '../components/ui/EnhancedCard';
import { EnhancedButton } from '../components/ui/EnhancedButton';
import { EnhancedInput } from '../components/ui/EnhancedInput';
import { StatusBadge } from '../components/ui/EnhancedBadge';
import {
  User,
  Shield,
  Bell,
  CreditCard,
  Settings as SettingsIcon,
  Key,
  Globe,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Users,
  Database,
  Activity,
  HelpCircle,
} from 'lucide-react';

// Simple date formatting function
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { plan, hasFeature } = usePlan();
  const { toast } = useToast();

  // Local state
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    company: '',
    phone: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    syncAlerts: true,
    securityAlerts: true,
    weeklyReports: false,
    marketingEmails: false,
  });

  // Tab configuration
  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'integrations', label: 'Integrations', icon: <Globe className="w-4 h-4" /> },
  ];

  // Handle form submissions
  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your new passwords match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Settings updated",
        description: "Your notification settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ContentSection title="Profile Information" subtitle="Update your personal information">
            <div className="space-y-6">
              <GridLayout cols={2} gap="lg">
                <EnhancedInput
                  label="First Name"
                  value={profileForm.firstName}
                  onChange={(value) => setProfileForm(prev => ({ ...prev, firstName: value }))}
                  fullWidth
                />
                <EnhancedInput
                  label="Last Name"
                  value={profileForm.lastName}
                  onChange={(value) => setProfileForm(prev => ({ ...prev, lastName: value }))}
                  fullWidth
                />
              </GridLayout>
              
              <EnhancedInput
                label="Email Address"
                type="email"
                value={profileForm.email}
                onChange={(value) => setProfileForm(prev => ({ ...prev, email: value }))}
                fullWidth
              />
              
              <GridLayout cols={2} gap="lg">
                <EnhancedInput
                  label="Company"
                  value={profileForm.company}
                  onChange={(value) => setProfileForm(prev => ({ ...prev, company: value }))}
                  fullWidth
                />
                <EnhancedInput
                  label="Phone Number"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(value) => setProfileForm(prev => ({ ...prev, phone: value }))}
                  fullWidth
                />
              </GridLayout>
              
              <div className="flex justify-end">
                <EnhancedButton
                  onClick={handleProfileUpdate}
                  loading={loading}
                  icon={<Save className="w-4 h-4" />}
                >
                  Save Changes
                </EnhancedButton>
              </div>
            </div>
          </ContentSection>
        );

      case 'security':
        return (
          <ContentSection title="Security Settings" subtitle="Manage your account security">
            <div className="space-y-6">
              <EnhancedCard variant="outlined">
                <EnhancedCardHeader title="Change Password">
                  <div></div>
                </EnhancedCardHeader>
                <EnhancedCardContent>
                  <div className="space-y-4">
                    <EnhancedInput
                      label="Current Password"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(value) => setPasswordForm(prev => ({ ...prev, currentPassword: value }))}
                      icon={showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      iconPosition="right"
                      fullWidth
                    />
                    <EnhancedInput
                      label="New Password"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(value) => setPasswordForm(prev => ({ ...prev, newPassword: value }))}
                      fullWidth
                    />
                    <EnhancedInput
                      label="Confirm New Password"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(value) => setPasswordForm(prev => ({ ...prev, confirmPassword: value }))}
                      fullWidth
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showPassword"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="showPassword" className="text-sm text-gray-600">
                        Show password
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <EnhancedButton
                        onClick={handlePasswordChange}
                        loading={loading}
                        icon={<Lock className="w-4 h-4" />}
                      >
                        Update Password
                      </EnhancedButton>
                    </div>
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>

              <EnhancedCard variant="outlined">
                <EnhancedCardHeader title="Two-Factor Authentication">
                  <div></div>
                </EnhancedCardHeader>
                <EnhancedCardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">2FA Status</h3>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                    <StatusBadge status="inactive" />
                  </div>
                  <div className="mt-4">
                    <EnhancedButton variant="outline" icon={<Shield className="w-4 h-4" />}>
                      Enable 2FA
                    </EnhancedButton>
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>
            </div>
          </ContentSection>
        );

      case 'notifications':
        return (
          <ContentSection title="Notification Preferences" subtitle="Choose how you want to be notified">
            <div className="space-y-6">
              <EnhancedCard variant="outlined">
                <EnhancedCardHeader title="Email Notifications">
                  <div></div>
                </EnhancedCardHeader>
                <EnhancedCardContent>
                  <div className="space-y-4">
                    {Object.entries(notificationSettings).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Receive notifications about {key.toLowerCase().replace(/([A-Z])/g, ' $1')}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))}
                          className="rounded border-gray-300"
                        />
                      </div>
                    ))}
                    <div className="flex justify-end">
                      <EnhancedButton
                        onClick={handleNotificationUpdate}
                        loading={loading}
                        icon={<Bell className="w-4 h-4" />}
                      >
                        Save Settings
                      </EnhancedButton>
                    </div>
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>
            </div>
          </ContentSection>
        );

      case 'billing':
        return (
          <ContentSection title="Billing & Subscription" subtitle="Manage your subscription and billing">
            <div className="space-y-6">
              <EnhancedCard variant="outlined">
                <EnhancedCardHeader title="Current Plan">
                  <div></div>
                </EnhancedCardHeader>
                <EnhancedCardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {plan?.planId === 'trial' ? 'Professional Trial' : plan?.planId === 'starter' ? 'Starter Plan' : plan?.planId === 'professional' ? 'Professional Plan' : 'Enterprise Plan'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {plan?.planId === 'trial' ? '21-day free trial of Professional features' : 
                         plan?.planId === 'starter' ? 'Perfect for small teams getting started' :
                         plan?.planId === 'professional' ? 'For growing businesses with advanced needs' :
                         'Enterprise-grade solution for large organizations'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        ${plan?.planId === 'trial' ? '0' : plan?.planId === 'starter' ? '29' : plan?.planId === 'professional' ? '59' : '199'}/month
                      </div>
                      <div className="text-sm text-gray-500">
                        {plan?.isTrialActive ? 'Free Trial' : 'Billed monthly'}
                      </div>
                    </div>
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>

              <EnhancedCard variant="outlined">
                <EnhancedCardHeader title="Usage Limits">
                  <div></div>
                </EnhancedCardHeader>
                <EnhancedCardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Workflows</span>
                      <span className="text-sm font-medium">
                        0 / {plan?.planId === 'trial' ? '500' : plan?.planId === 'starter' ? '50' : plan?.planId === 'professional' ? '500' : '∞'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Users</span>
                      <span className="text-sm font-medium">
                        1 / {plan?.planId === 'trial' ? '1' : plan?.planId === 'starter' ? '1' : plan?.planId === 'professional' ? '5' : '∞'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Storage</span>
                      <span className="text-sm font-medium">
                        0 GB / {plan?.planId === 'trial' ? '10 GB' : plan?.planId === 'starter' ? '5 GB' : plan?.planId === 'professional' ? '50 GB' : '∞'}
                      </span>
                    </div>
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>

              <EnhancedCard variant="outlined">
                <EnhancedCardHeader title="Billing Information">
                  <div></div>
                </EnhancedCardHeader>
                <EnhancedCardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Billing Provider</span>
                      <span className="font-medium">HubSpot Marketplace</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Next Billing Date</span>
                      <span className="font-medium">
                        {plan?.trialEndDate ? formatDate(plan.trialEndDate) : 'Monthly'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Payment Method</span>
                      <span className="font-medium">Managed by HubSpot</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex space-x-3">
                    <EnhancedButton
                      variant="outline"
                      onClick={() => window.open('https://app.hubspot.com/ecosystem/marketplace/apps', '_blank')}
                      className="flex-1"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage Billing
                    </EnhancedButton>
                    <EnhancedButton
                      variant="outline"
                      onClick={() => window.open('https://workflowguard.com/support', '_blank')}
                      className="flex-1"
                    >
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Get Help
                    </EnhancedButton>
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>
            </div>
          </ContentSection>
        );

      case 'integrations':
        return (
          <ContentSection title="Integrations" subtitle="Manage your connected services">
            <div className="space-y-6">
              <EnhancedCard variant="outlined">
                <EnhancedCardHeader title="HubSpot Integration">
                  <div></div>
                </EnhancedCardHeader>
                <EnhancedCardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">HubSpot</h3>
                        <p className="text-sm text-gray-600">Connected to your HubSpot account</p>
                      </div>
                    </div>
                    <StatusBadge status="active" />
                  </div>
                  <div className="mt-4">
                    <EnhancedButton variant="outline" icon={<RefreshCw className="w-4 h-4" />}>
                      Reconnect
                    </EnhancedButton>
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>
            </div>
          </ContentSection>
        );

      default:
        return null;
    }
  };

  return (
    <AppLayout>
      {/* Page Header */}
      <PageHeader
        title="Settings"
        subtitle="Manage your account preferences and security"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Settings' },
        ]}
        actions={
          <div className="flex items-center space-x-3">
            <EnhancedButton
              variant="outline"
              onClick={() => navigate('/dashboard')}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Back to Dashboard
            </EnhancedButton>
            <EnhancedButton
              variant="outline"
              onClick={logout}
              icon={<Lock className="w-4 h-4" />}
            >
              Logout
            </EnhancedButton>
          </div>
        }
      />

      {/* Settings Content */}
      <div className="flex space-x-8">
        {/* Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <EnhancedCard variant="outlined">
            <EnhancedCardContent>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </EnhancedCardContent>
          </EnhancedCard>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
