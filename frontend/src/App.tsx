import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, PlanProvider, useAuth, usePlan } from './components/AuthContext';
import { QueryProvider } from './providers/QueryProvider';
import { WorkflowProvider } from './contexts/WorkflowContext';
import { ProtectedRoute, AuthRequired, HubSpotRequired } from './components/ProtectedRoute';
import { WorkflowRoute, WorkflowHistoryRoute } from './components/WorkflowRoute';
import { Toaster } from './components/ui/toaster';
import { useToast } from './components/ui/use-toast';
import TopNavigation from './components/TopNavigation';
import WelcomeModal from './components/WelcomeModal';
import ConnectHubSpotModal from './components/ConnectHubSpotModal';
import AppLoadingState from './components/ui/AppLoadingState';
import ErrorBoundary from './components/ErrorBoundary';
import PerformanceMonitor from './components/ui/PerformanceMonitor';
import Footer from './components/Footer';
import { Alert } from './components/ui/alert';
import { Lock } from 'lucide-react';

// Pages
import Dashboard from './pages/Dashboard';
import WorkflowHistory from './pages/WorkflowHistory';
import WorkflowHistoryDetail from './pages/WorkflowHistoryDetail';
import WorkflowSelection from './pages/WorkflowSelection';
import CompareVersions from './pages/CompareVersions';
import Settings from './pages/Settings';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import OverageDashboard from './pages/OverageDashboard';
import RealtimeDashboard from './pages/RealtimeDashboard';
import ContactUs from './pages/ContactUs';
import HelpSupport from './pages/HelpSupport';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import LoggedOut from './pages/LoggedOut';
import NotFound from './pages/NotFound';
import Marketplace from './pages/Marketplace';

// Import API service
import apiService from './services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ModalsManager component to handle modal state
const ModalsManager = () => {
  const { user, loading } = useAuth();
  const [welcomeOpen, setWelcomeOpen] = React.useState(false);
  const [connectOpen, setConnectOpen] = React.useState(false);

  React.useEffect(() => {
    if (!loading) {
    if (!user) {
      setWelcomeOpen(true);
      } else if (user && !user.hubspotPortalId) {
        setConnectOpen(true);
      }
    }
  }, [user, loading]);

  const handleConnectHubSpot = () => {
    setWelcomeOpen(false);
    setConnectOpen(true);
  };

  // Only ConnectHubSpotModal triggers OAuth redirect
  const handleHubSpotOAuth = () => {
    window.location.href = "/api/auth/hubspot";
  };

  return (
    <>
      <WelcomeModal open={welcomeOpen} onClose={() => {}} onConnectHubSpot={handleConnectHubSpot} />
      <ConnectHubSpotModal open={connectOpen} onClose={() => setConnectOpen(false)} onConnect={handleHubSpotOAuth} />
    </>
  );
};

const LockoutBanner: React.FC<{ message?: string }> = ({ message }) => (
  <Alert
    variant="default"
    className="flex items-center gap-3 bg-yellow-50 border-yellow-200 text-yellow-900 rounded-xl px-6 py-4 mb-4 shadow-sm"
    style={{ borderWidth: 2 }}
  >
    <Lock className="w-6 h-6 text-yellow-700 mr-2" />
    <span className="font-medium text-base">
      {message || "Your free trial has ended. Upgrade your plan to unlock WorkflowGuard's features."}
    </span>
  </Alert>
);

const LockoutOverlay: React.FC = () => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(255,255,255,0.95)',
      zIndex: 1000,
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}
    tabIndex={-1}
    aria-hidden="true"
  >
    <div style={{ width: '100%', maxWidth: 600, textAlign: 'center', padding: '40px 20px' }}>
      <LockoutBanner message="Your 21-day free trial has ended. Upgrade to continue using WorkflowGuard's features." />
      
      <div className="mt-8 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Trial Expired - Upgrade Required
        </h2>
        
        <p className="text-gray-600 mb-6">
          Your free trial has ended. To continue using WorkflowGuard and protect your HubSpot workflows, 
          please upgrade to one of our paid plans.
        </p>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 border border-gray-200 rounded">
              <div className="font-semibold text-gray-900">Starter</div>
              <div className="text-2xl font-bold text-blue-600">$29</div>
              <div className="text-gray-600">/month</div>
              <div className="text-xs text-gray-500 mt-1">50 Workflows</div>
            </div>
            <div className="text-center p-3 border-2 border-blue-500 rounded bg-blue-50">
              <div className="font-semibold text-gray-900">Professional</div>
              <div className="text-2xl font-bold text-blue-600">$59</div>
              <div className="text-gray-600">/month</div>
              <div className="text-xs text-gray-500 mt-1">500 Workflows</div>
            </div>
            <div className="text-center p-3 border border-gray-200 rounded">
              <div className="font-semibold text-gray-900">Enterprise</div>
              <div className="text-2xl font-bold text-blue-600">$199</div>
              <div className="text-gray-600">/month</div>
              <div className="text-xs text-gray-500 mt-1">Unlimited</div>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => window.location.href = '/settings'}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          Go to Settings & Upgrade
        </button>
        
        <p className="text-xs text-gray-500 mt-4">
          You can only access the Settings page to manage your subscription.
        </p>
      </div>
    </div>
  </div>
);

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const { plan } = usePlan();
  const location = useLocation();

  // Show enhanced loading state while loading auth state
  if (loading) {
    return (
      <AppLoadingState 
        message="Initializing WorkflowGuard..."
        timeout={30000}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // TEMP FIX: Allow all users to proceed to dashboard
  const hasSelectedWorkflows = true;

  // Centralized user flow logic
  React.useEffect(() => {
    // 1. Not authenticated: show WelcomeModal (handled by ModalsManager)
    if (!user) return;

    // 2. Authenticated but not connected to HubSpot: show ConnectHubSpotModal (handled by ModalsManager)
    if (user && !user.hubspotPortalId) return;

    // 3. Authenticated, connected, but no workflows selected: redirect to onboarding
    if (user && user.hubspotPortalId && !hasSelectedWorkflows && location.pathname !== '/select-workflows') {
      window.location.replace('/select-workflows');
      return;
    }

    // 4. If on /select-workflows but onboarding is complete, go to dashboard
    // (Removed to allow users to always access /select-workflows)
    // if (user && user.hubspotPortalId && hasSelectedWorkflows && location.pathname === '/select-workflows') {
    //   window.location.replace('/dashboard');
    //   return;
    // }
  }, [user, location.pathname, hasSelectedWorkflows]);

  // Determine if user is locked out (trial expired, not paid)
  const isTrialExpired = plan && !plan.isTrialActive && plan.trialPlanId === 'professional';
  const isOnBillingPage = location.pathname === '/settings';
  
  // Calculate remaining trial days
  const getRemainingTrialDays = () => {
    if (!plan || !plan.trialEndDate) return null;
    const now = new Date();
    const trialEnd = new Date(plan.trialEndDate);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const remainingTrialDays = getRemainingTrialDays();
  const isTrialActive = plan && plan.isTrialActive && remainingTrialDays && remainingTrialDays > 0;

  return (
    <>
      <ModalsManager />
      
      {/* Trial Expired Lockout - Show overlay on all pages except Settings */}
      {isTrialExpired && !isOnBillingPage && <LockoutOverlay />}
      
      {/* Trial Day Counter Banner - Show on all pages when trial is active */}
      {isTrialActive && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium">
          <span className="flex items-center justify-center gap-2">
            <span>🎉 Free Trial Active</span>
            <span>•</span>
            <span>{remainingTrialDays} days remaining</span>
            <span>•</span>
            <span>Upgrade to continue after trial ends</span>
          </span>
        </div>
      )}

      <Routes>
        <Route path="/dashboard" element={
          <AuthRequired>
            <Dashboard />
          </AuthRequired>
        } />
        <Route path="/workflow-history" element={
          <HubSpotRequired>
            <WorkflowHistory />
          </HubSpotRequired>
        } />
        <Route path="/workflow-history/:workflowId" element={
          <HubSpotRequired>
            <WorkflowHistoryRoute>
              <WorkflowHistory />
            </WorkflowHistoryRoute>
          </HubSpotRequired>
        } />
        <Route path="/select-workflows" element={
          <HubSpotRequired>
            <WorkflowSelection />
          </HubSpotRequired>
        } />
        <Route path="/compare-versions" element={
          <HubSpotRequired>
            <CompareVersions />
          </HubSpotRequired>
        } />
        <Route path="/settings" element={
          <AuthRequired>
            <Settings />
          </AuthRequired>
        } />
        <Route path="/analytics" element={
          <AuthRequired>
            <AnalyticsDashboard />
          </AuthRequired>
        } />
        <Route path="/overage" element={
          <AuthRequired>
            <OverageDashboard />
          </AuthRequired>
        } />
        <Route path="/realtime" element={
          <AuthRequired>
            <RealtimeDashboard />
          </AuthRequired>
        } />
        <Route path="/contact" element={
          <AuthRequired>
            <ContactUs />
          </AuthRequired>
        } />
        <Route path="/help" element={
          <AuthRequired>
            <HelpSupport />
          </AuthRequired>
        } />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/logged-out" element={<LoggedOut />} />
        <Route path="/" element={
          <AuthRequired>
            <Dashboard />
          </AuthRequired>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <QueryProvider>
          <AuthProvider>
            <PlanProvider>
              <WorkflowProvider>
                <AppRoutes />
                <Toaster />
                <PerformanceMonitor />
                <Footer />
              </WorkflowProvider>
            </PlanProvider>
          </AuthProvider>
        </QueryProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
