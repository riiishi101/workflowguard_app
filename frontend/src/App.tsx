import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, PlanProvider, useAuth, usePlan } from './components/AuthContext';
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
      background: 'rgba(255,255,255,0.7)',
      zIndex: 1000,
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
    }}
    tabIndex={-1}
    aria-hidden="true"
  >
    <div style={{ width: '100%', maxWidth: 900, marginTop: 40 }}>
      <LockoutBanner message="Your free trial has ended. Please upgrade your plan to continue using WorkflowGuard. You can manage your subscription below." />
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
  const isOnPlanBilling = location.pathname === '/settings';

  return (
    <>
      <ModalsManager />
      {isTrialExpired && !isOnPlanBilling && <LockoutOverlay />}
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workflow-history" element={<WorkflowHistory />} />
        <Route path="/workflow-history/:id" element={<WorkflowHistoryDetail />} />
        <Route path="/select-workflows" element={<WorkflowSelection />} />
        <Route path="/compare-versions" element={<CompareVersions />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/overage" element={<OverageDashboard />} />
        <Route path="/realtime" element={<RealtimeDashboard />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/help" element={<HelpSupport />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/logged-out" element={<LoggedOut />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
    <AuthProvider>
      <PlanProvider>
          <ErrorBoundary>
          <AppRoutes />
            <Toaster />
            <PerformanceMonitor />
            <Footer />
          </ErrorBoundary>
      </PlanProvider>
    </AuthProvider>
    </Router>
  );
}

export default App;
