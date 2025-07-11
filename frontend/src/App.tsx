import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, PlanProvider, useAuth, usePlan } from './components/AuthContext';
import WelcomeModal from './components/WelcomeModal';
import ConnectHubSpotModal from './components/ConnectHubSpotModal';
import Dashboard from './pages/Dashboard';
import WorkflowSelection from './pages/WorkflowSelection';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Footer from './components/Footer';
import WorkflowHistory from './pages/WorkflowHistory';
import HelpSupport from './pages/HelpSupport';
import OverageDashboard from './pages/OverageDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import RealtimeDashboard from './pages/RealtimeDashboard';
import ErrorBoundary from './components/ErrorBoundary';

// Helper: Show Welcome/Connect modals based on context
const ModalsManager = () => {
  const { user } = useAuth();
  const { plan } = usePlan();
  const [welcomeOpen, setWelcomeOpen] = useState(!user);
  const [connectOpen, setConnectOpen] = useState(false);

  // Show WelcomeModal if not logged in
  // Show ConnectHubSpotModal if logged in but not connected to HubSpot
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("oauth_error");
    if (oauthError) {
      setConnectOpen(true);
      setWelcomeOpen(false);
      return;
    }
    if (!user) {
      setWelcomeOpen(true);
      setConnectOpen(false);
    } else {
      // Check if user has HubSpot connection by looking at user data
      const hasHubSpotConnection = user.hubspotPortalId;
      
      if (!hasHubSpotConnection) {
        setWelcomeOpen(false);
        setConnectOpen(true);
      } else {
        setWelcomeOpen(false);
        setConnectOpen(false);
      }
    }
  }, [user, plan]);

  // WelcomeModal opens ConnectHubSpotModal
  const handleConnectHubSpot = () => {
    console.log('WelcomeModal Connect button clicked');
    setConnectOpen(true);
  };

  // Only ConnectHubSpotModal triggers OAuth redirect
  const handleHubSpotOAuth = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/hubspot`;
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

  // Show spinner or blank while loading auth state
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="text-gray-500 text-lg">Loading...</span>
      </div>
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
    if (user && user.hubspotPortalId && hasSelectedWorkflows && location.pathname === '/select-workflows') {
      window.location.replace('/dashboard');
      return;
    }
  }, [user, plan, hasSelectedWorkflows, location.pathname]);

  return (
    <>
      <ModalsManager />
      <Routes>
        {/* Default route - redirect based on user state */}
        <Route path="/" element={
          <Navigate to={
            !user ? "/" : // Stay on root if not authenticated (modals will handle)
            !hasSelectedWorkflows ? "/select-workflows" : 
            "/dashboard"
          } replace />
        } />
        {/* WelcomeModal and ConnectHubSpotModal are handled globally */}
        <Route path="/select-workflows" element={<WorkflowSelection />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/workflow-history" element={<WorkflowHistory />} />
        <Route path="/workflow-history/:workflowId" element={<WorkflowHistory />} />
        <Route path="/help" element={<HelpSupport />} />
        <Route path="/overages" element={<OverageDashboard />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/realtime-dashboard" element={<RealtimeDashboard />} />
        {/* Add more routes as needed */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <PlanProvider>
        <Router>
          <AppRoutes />
          <Footer />
        </Router>
      </PlanProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
