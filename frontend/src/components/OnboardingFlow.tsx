import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import WelcomeModal from "./WelcomeModal";
import ConnectHubSpotModal from "./ConnectHubSpotModal";
import WorkflowSelection from "@/pages/WorkflowSelection";
import { useToast } from "@/hooks/use-toast";
import { WorkflowState } from "@/lib/workflowState";

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'connect' | 'workflow-selection' | 'dashboard'>('welcome');
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [hasProcessedOAuth, setHasProcessedOAuth] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const { isAuthenticated, loading, user, connectHubSpot, isConnecting } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  // Don't render OnboardingFlow if user is on dashboard route
  if (location.pathname === '/dashboard') {
    console.log('OnboardingFlow - User is on dashboard, not rendering');
    return null;
  }

  // Timeout mechanism to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('OnboardingFlow - Timeout reached');
      setTimeoutReached(true);
      setHasProcessedOAuth(true);
      
      // If user is authenticated, go to workflow selection
      // If not authenticated, show connect modal
      if (isAuthenticated) {
        setCurrentStep('workflow-selection');
      } else {
        setCurrentStep('connect');
        setShowConnectModal(true);
      }
    }, 30000); // Reduced to 30 seconds timeout for backend processing

    return () => {
      clearTimeout(timeout);
    };
  }, [isAuthenticated]);

  // Handle timeout state changes and recover from OAuth
  useEffect(() => {
    // Check for stored pre-OAuth state
    const storedState = sessionStorage.getItem('preOAuthState');
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      const timeSinceStore = Date.now() - parsedState.timestamp;
      
      console.log('🔄 OnboardingFlow - Found stored state:', {
        storedState: parsedState,
        timeSinceStore: `${Math.round(timeSinceStore / 1000)}s`,
        currentAuth: { isAuthenticated, currentStep }
      });

      // Clear stored state to prevent reuse
      sessionStorage.removeItem('preOAuthState');
    }

    if (timeoutReached && !isAuthenticated && currentStep !== 'connect') {
      console.log('🔄 OnboardingFlow - Timeout reached, no auth', {
        timeoutReached,
        isAuthenticated,
        currentStep
      });
      setCurrentStep('connect');
      setShowConnectModal(true);
    }
    
    return () => {
      // Cleanup stored state on unmount
      sessionStorage.removeItem('preOAuthState');
    };
  }, [timeoutReached, isAuthenticated, currentStep]);

  useEffect(() => {
    if (loading || isInitialized) {
      console.log('🔄 OnboardingFlow - Skipping initialization:', { loading, isInitialized });
      return;
    }

    console.log('🔄 OnboardingFlow - Starting initialization', {
      loading,
      isInitialized,
      isAuthenticated,
      currentStep,
      hasProcessedOAuth,
      pathname: window.location.pathname,
      search: window.location.search
    });

    // Check for OAuth callback success or errors
    const urlParams = new URLSearchParams(window.location.search);
    const isOAuthSuccess = urlParams.get('success') === 'true';
    const hasToken = urlParams.get('token');
    const errorParam = urlParams.get('error');
    
    console.log('🔄 OnboardingFlow - OAuth check:', { isOAuthSuccess, hasToken, errorParam });

    // Handle OAuth errors
    if (errorParam) {
      console.log('🔄 OnboardingFlow - OAuth error detected:', errorParam);
      setHasProcessedOAuth(true);
      setCurrentStep('connect');
      setShowWelcomeModal(false);
      setShowConnectModal(true);
      setIsInitialized(true);
      
      // Show appropriate error message based on error type
      let errorMessage = "Failed to connect to HubSpot. Please try again.";
      
      if (errorParam === 'user_creation_failed') {
        errorMessage = "Failed to create user account. Please try again or contact support.";
      } else if (errorParam === 'email_already_exists') {
        errorMessage = "An account with this email already exists. Please use a different HubSpot account.";
      } else if (errorParam === 'missing_email') {
        errorMessage = "Email information is missing from your HubSpot account. Please update your HubSpot profile.";
      } else if (errorParam === 'missing_portal_id') {
        errorMessage = "HubSpot portal ID is missing. Please try again with a valid HubSpot account.";
      } else if (errorParam === 'token_error') {
        errorMessage = "Authentication token error. Please try connecting again.";
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    // Handle OAuth callback success - immediately go to workflow selection
    if (isOAuthSuccess && hasToken) {
      console.log('🔄 OnboardingFlow - OAuth callback success, going to workflow selection');
      setHasProcessedOAuth(true);
      setCurrentStep('workflow-selection');
      setShowWelcomeModal(false);
      setShowConnectModal(false);
      setIsInitialized(true);
      return;
    }

    // If user is authenticated (from stored token), go directly to workflow selection
    if (isAuthenticated && !hasProcessedOAuth) {
      console.log('🔄 OnboardingFlow - User authenticated, going to workflow selection');
      setCurrentStep('workflow-selection');
      setShowWelcomeModal(false);
      setShowConnectModal(false);
      setHasProcessedOAuth(true);
      setIsInitialized(true);
      return;
    }

    // If user is not authenticated, show welcome
    if (!isAuthenticated) {
      console.log('🔄 OnboardingFlow - User not authenticated, showing welcome');
      setCurrentStep('welcome');
      setShowWelcomeModal(true);
      setShowConnectModal(false);
      setIsInitialized(true);
      return;
    }

    setIsInitialized(true);
  }, [loading, isAuthenticated, hasProcessedOAuth, isInitialized]);

  const handleWelcomeComplete = () => {
    console.log('🔄 OnboardingFlow - Welcome complete', {
      currentStep,
      isAuthenticated,
    });
    setShowWelcomeModal(false);
    setShowConnectModal(true);
    setCurrentStep('connect');
  };

  const handleConnectHubSpot = () => {
    console.log('🔄 OnboardingFlow - Initiating HubSpot connection', {
      currentStep,
      isAuthenticated,
      hasProcessedOAuth,
      currentUrl: window.location.href
    });

    // Store current state before redirect
    sessionStorage.setItem('preOAuthState', JSON.stringify({
      currentStep,
      isAuthenticated,
      hasProcessedOAuth,
      timestamp: Date.now()
    }));

    // Use the connectHubSpot function from AuthContext
    const urlParams = new URLSearchParams(window.location.search);
    const isMarketplace = urlParams.get('marketplace') === 'true';
    connectHubSpot(isMarketplace);
  };

  const handleWorkflowSelectionComplete = () => {
    console.log('🔄 OnboardingFlow - Workflow selection complete', {
      currentStep,
      isAuthenticated,
      hasProcessedOAuth,
      hasWorkflows: WorkflowState.hasSelectedWorkflows(),
      workflowCount: WorkflowState.getSelectedCount()
    });
    
    // Ensure workflow state is properly set
    if (!WorkflowState.hasSelectedWorkflows()) {
      console.log('🔄 OnboardingFlow - Warning: No workflow selection state found');
    }
    
    // Clear onboarding state completely
    setCurrentStep('dashboard');
    setHasProcessedOAuth(true);
    setIsInitialized(true);
    
    // Add a small delay to ensure state is properly set
    setTimeout(() => {
      console.log('OnboardingFlow - Navigating to dashboard');
    navigate('/dashboard');
    toast({
      title: "Setup Complete!",
      description: "Your workflows are now being monitored.",
    });
    }, 100);
  };

  // Show timeout message if loading for too long
  if (timeoutReached && loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Taking longer than expected...</p>
          <p className="mt-1 text-sm text-gray-500">
            {isAuthenticated ? "Redirecting to workflow selection" : "Redirecting to HubSpot connection"}
          </p>
        </div>
      </div>
    );
  }

  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show workflow selection if user is authenticated and on workflow-selection step
  if (isAuthenticated && currentStep === 'workflow-selection') {
    console.log('🔄 OnboardingFlow - Rendering WorkflowSelection');
    return <WorkflowSelection onComplete={handleWorkflowSelectionComplete} />;
  }

    // Force connect modal for authenticated users who need to reconnect
  if (isAuthenticated && currentStep === 'connect') {
    return (
      <div className="min-h-screen bg-gray-50">
        <ConnectHubSpotModal
          open={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          onConnect={handleConnectHubSpot}
          isConnecting={isConnecting}
        />
      </div>
    );
  }

  // Show workflow selection if timeout reached AND user is authenticated
  if (timeoutReached && currentStep === 'workflow-selection' && isAuthenticated) {
    return <WorkflowSelection onComplete={handleWorkflowSelectionComplete} />;
  }

    // If timeout reached but user is not authenticated, show connect modal
  if (timeoutReached && !isAuthenticated && currentStep === 'connect') {
    console.log('OnboardingFlow - Timeout reached but user not authenticated, showing connect modal');
    return (
      <div className="min-h-screen bg-gray-50">
        <ConnectHubSpotModal
          open={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          onConnect={handleConnectHubSpot}
          isConnecting={isConnecting}
        />
      </div>
    );
  }

  // Show dashboard if user is authenticated and on dashboard step
  if (isAuthenticated && currentStep === 'dashboard') {
    return null; // Will be handled by navigation
  }

  // Only show modals if we're on welcome or connect steps AND user is not authenticated
  if (!isAuthenticated && (currentStep === 'welcome' || currentStep === 'connect')) {
    console.log('🔄 OnboardingFlow - Rendering modals', { currentStep, showWelcomeModal, showConnectModal });
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Welcome Modal */}
        <WelcomeModal 
          open={showWelcomeModal && currentStep === 'welcome'} 
          onClose={handleWelcomeComplete}
        />

        {/* Connect HubSpot Modal */}
                <ConnectHubSpotModal
          open={showConnectModal && currentStep === 'connect'}
          onClose={() => setShowConnectModal(false)}
          onConnect={handleConnectHubSpot}
          isConnecting={isConnecting}
        />
      </div>
    );
  }

  // Fallback: show loading
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Setting up...</p>
        
        {/* Debug Button */}
        <button
                    onClick={() => {
            console.log('Manual OAuth trigger');
            const urlParams = new URLSearchParams(window.location.search);
            const isMarketplace = urlParams.get('marketplace') === 'true';
            connectHubSpot(isMarketplace);
          }}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
        >
          Manual OAuth Trigger
        </button>
      </div>
    </div>
  );
};

export default OnboardingFlow;