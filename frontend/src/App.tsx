import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import TrialAccessGuard from "@/components/TrialAccessGuard";
import OnboardingFlow from "@/components/OnboardingFlow";
import WorkflowSelection from "./pages/WorkflowSelection";
import Dashboard from "./pages/Dashboard";
import WorkflowHistory from "./pages/WorkflowHistory";
import WorkflowHistoryDetail from "./pages/WorkflowHistoryDetail";
import CompareVersions from "./pages/CompareVersions";
import Settings from "./pages/Settings";
import HelpSupport from "./pages/HelpSupport";
import ConnectHubSpotGuide from "./pages/help/ConnectHubSpotGuide";
import RestoreWorkflowGuide from "./pages/help/RestoreWorkflowGuide";

import UserManual from "./pages/help/UserManual";
import FeatureSpotlights from "./pages/help/FeatureSpotlights";
import AdvancedUseCases from "./pages/help/AdvancedUseCases";
import Troubleshooting from "./pages/help/Troubleshooting";
import ApiDocs from "./pages/help/ApiDocs";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ContactUs from "./pages/ContactUs";
import SetupGuide from "./pages/SetupGuide";
import NotFound from "./pages/NotFound";
import { HubSpotOAuthCallback } from "./components/auth/HubSpotOAuthCallback";

const queryClient = new QueryClient();

// Component to conditionally render OnboardingFlow or handle OAuth callback
const RootRoute = () => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  
  // Show OnboardingFlow on root route if not authenticated
  if (location.pathname === '/' && !loading && !isAuthenticated) {
    return <OnboardingFlow />;
  }
  
  // If user is authenticated and on root route, redirect to dashboard
  if (location.pathname === '/' && !loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // For all other routes, return null (let other routes handle rendering)
  return null;
};


import { useEffect } from "react";

const App = () => {
  // No need for token handling here, it's all in AuthContext now

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route path="/workflow-selection" element={<ProtectedRoute><TrialAccessGuard><WorkflowSelection /></TrialAccessGuard></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><TrialAccessGuard><Dashboard /></TrialAccessGuard></ProtectedRoute>} />
              <Route path="/workflow-history" element={<ProtectedRoute><TrialAccessGuard><WorkflowHistory /></TrialAccessGuard></ProtectedRoute>} />
              <Route
                path="/workflow-history/:workflowId"
                element={<ProtectedRoute><TrialAccessGuard><WorkflowHistoryDetail /></TrialAccessGuard></ProtectedRoute>}
              />
              <Route path="/compare-versions" element={<ProtectedRoute><TrialAccessGuard><CompareVersions /></TrialAccessGuard></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/help-support" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
              <Route path="/help/connect-hubspot" element={<ProtectedRoute><TrialAccessGuard><ConnectHubSpotGuide /></TrialAccessGuard></ProtectedRoute>} />
              <Route path="/help/restore-workflow" element={<ProtectedRoute><TrialAccessGuard><RestoreWorkflowGuide /></TrialAccessGuard></ProtectedRoute>} />
      
              <Route path="/help/user-manual" element={<ProtectedRoute><TrialAccessGuard><UserManual /></TrialAccessGuard></ProtectedRoute>} />
              <Route path="/help/feature-spotlights" element={<ProtectedRoute><TrialAccessGuard><FeatureSpotlights /></TrialAccessGuard></ProtectedRoute>} />
              <Route path="/help/advanced-use-cases" element={<ProtectedRoute><TrialAccessGuard><AdvancedUseCases /></TrialAccessGuard></ProtectedRoute>} />
              <Route path="/help/troubleshooting" element={<ProtectedRoute><TrialAccessGuard><Troubleshooting /></TrialAccessGuard></ProtectedRoute>} />
              <Route path="/help/api-docs" element={<ProtectedRoute><TrialAccessGuard><ApiDocs /></TrialAccessGuard></ProtectedRoute>} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/setup-guide" element={<ProtectedRoute><TrialAccessGuard><SetupGuide /></TrialAccessGuard></ProtectedRoute>} />
              <Route path="/auth/hubspot/callback" element={<HubSpotOAuthCallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
