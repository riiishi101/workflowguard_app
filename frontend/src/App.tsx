import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import WorkflowSelection from "./pages/WorkflowSelection";
import Dashboard from "./pages/Dashboard";
import WorkflowHistory from "./pages/WorkflowHistory";
import WorkflowHistoryDetail from "./pages/WorkflowHistoryDetail";
import CompareVersions from "./pages/CompareVersions";
import Settings from "./pages/Settings";
import HelpSupport from "./pages/HelpSupport";
import NotFound from "./pages/NotFound";
import OverageDashboard from "./pages/OverageDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import RealtimeDashboard from "./pages/RealtimeDashboard";
import EmptyDashboard from './components/EmptyDashboard';
import EmptyWorkflowHistory from './components/EmptyWorkflowHistory';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import FullScreenProgress from "@/components/ui/FullScreenProgress";
import ResetPassword from './pages/ResetPassword';

const queryClient = new QueryClient();

// Separate component that uses useAuth hook
const AppContent = () => {
  const { loading } = useAuth();
  
  if (loading) {
    return <FullScreenProgress value={75} label="Securing workflows..." />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/workflow-selection" element={<WorkflowSelection />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/workflow-history" element={<WorkflowHistory />} />
      <Route path="/workflow-history/:id" element={<WorkflowHistoryDetail />} />
      <Route path="/compare-versions/:idA/:idB" element={<CompareVersions />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/overages" element={<OverageDashboard />} />
      <Route path="/analytics" element={<AnalyticsDashboard />} />
      <Route path="/realtime-dashboard" element={<RealtimeDashboard />} />
      <Route path="/help" element={<HelpSupport />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
