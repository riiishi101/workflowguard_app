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

// Helper: Show Welcome/Connect modals based on context
const ModalsManager = () => {
  const { user } = useAuth();
  const { plan } = usePlan();
  const [welcomeOpen, setWelcomeOpen] = useState(!user);
  const [connectOpen, setConnectOpen] = useState(false);

  // Show WelcomeModal if not logged in
  // Show ConnectHubSpotModal if logged in but not connected to HubSpot
  React.useEffect(() => {
    if (!user) {
      setWelcomeOpen(true);
      setConnectOpen(false);
    } else {
      // Check if user has HubSpot connection by looking at plan features OR user data
      const hasHubSpotConnection = plan?.features?.includes('hubspot_connected') || 
                                  user.hubspotPortalId;
      
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
    window.location.href = 'https://www.workflowguard.pro/api/auth/hubspot';
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

  // Helper: Check if user has selected workflows (onboarding complete)
  const hasSelectedWorkflows = React.useMemo(() => {
    const selected = localStorage.getItem('selectedWorkflows');
    try {
      const workflows = selected ? JSON.parse(selected) : [];
      return Array.isArray(workflows) && workflows.length > 0;
    } catch {
      return false;
    }
  }, [user, location.key]);

  // Centralized user flow logic
  React.useEffect(() => {
    // 1. Not authenticated: show WelcomeModal (handled by ModalsManager)
    if (!user) return;

    // 2. Authenticated but not connected to HubSpot: show ConnectHubSpotModal (handled by ModalsManager)
    if (user && (!plan || !(plan.features && plan.features.includes('hubspot_connected')))) return;

    // 3. Authenticated, connected, but no workflows selected: redirect to onboarding
    if (user && plan && plan.features.includes('hubspot_connected') && !hasSelectedWorkflows && location.pathname !== '/select-workflows') {
      window.location.replace('/select-workflows');
      return;
    }

    // 4. If on /select-workflows but onboarding is complete, go to dashboard
    if (user && plan && plan.features.includes('hubspot_connected') && hasSelectedWorkflows && location.pathname === '/select-workflows') {
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
        {/* Add more routes as needed */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <PlanProvider>
        <Router>
          <AppRoutes />
          <Footer />
        </Router>
      </PlanProvider>
    </AuthProvider>
  );
};

export default App;
