import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, usePlan } from './components/AuthContext';
import { Toaster } from './components/ui/toaster';
import { useToast } from './components/ui/use-toast';
import TopNavigation from './components/TopNavigation';
import WelcomeModal from './components/WelcomeModal';
import ConnectHubSpotModal from './components/ConnectHubSpotModal';
import AppLoadingState from './components/ui/AppLoadingState';
import ErrorBoundary from './components/ErrorBoundary';
import PerformanceMonitor from './components/ui/PerformanceMonitor';

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

  return (
    <>
      <ModalsManager />
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
        <ErrorBoundary>
          <AppRoutes />
          <Toaster />
          <PerformanceMonitor />
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;
