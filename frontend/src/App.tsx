import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, PlanProvider, useAuth, usePlan } from './components/AuthContext';
import WelcomeModal from './components/WelcomeModal';
import ConnectHubSpotModal from './components/ConnectHubSpotModal';
import Dashboard from './pages/Dashboard';
import WorkflowSelection from './pages/WorkflowSelection';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Helper: Show Welcome/Connect modals based on context
const ModalsManager = () => {
  const { user } = useAuth();
  const { plan } = usePlan();
  const [welcomeOpen, setWelcomeOpen] = useState(!user);
  const [connectOpen, setConnectOpen] = useState(false);

  // Show WelcomeModal if not logged in
  // Show ConnectHubSpotModal if logged in but not connected
  React.useEffect(() => {
    if (!user) {
      setWelcomeOpen(true);
      setConnectOpen(false);
    } else if (user && (!plan || !(plan.features && plan.features.includes('hubspot_connected')))) {
      setWelcomeOpen(false);
      setConnectOpen(true);
    } else {
      setWelcomeOpen(false);
      setConnectOpen(false);
    }
  }, [user, plan]);

  const handleConnectHubSpot = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = '/api/auth/hubspot/login';
  };

  return (
    <>
      <WelcomeModal open={welcomeOpen} onClose={() => setWelcomeOpen(false)} onConnectHubSpot={handleConnectHubSpot} />
      <ConnectHubSpotModal open={connectOpen} onClose={() => setConnectOpen(false)} onConnect={handleConnectHubSpot} />
    </>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();
  const location = useLocation();

  // User onboarding logic: if authenticated but no workflows selected, redirect to /select-workflows
  React.useEffect(() => {
    if (user) {
      const selected = localStorage.getItem('selectedWorkflows');
      const workflows = selected ? JSON.parse(selected) : [];
      if ((!workflows || workflows.length === 0) && location.pathname !== '/select-workflows') {
        window.location.replace('/select-workflows');
      }
    }
  }, [user, location.pathname]);

  return (
    <>
      <ModalsManager />
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/select-workflows"} replace />} />
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
        </Router>
      </PlanProvider>
    </AuthProvider>
  );
};

export default App;
