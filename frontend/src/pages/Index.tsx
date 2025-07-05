import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WelcomeModal from "@/components/WelcomeModal";
import ConnectHubSpotModal from "@/components/ConnectHubSpotModal";
import apiService from "@/services/api";
import { useAuth } from "@/components/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);
  const [showConnect, setShowConnect] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const handleConnectHubSpot = () => {
    setShowWelcome(false);
    setShowConnect(true);
  };

  const handleConnect = () => {
    setShowConnect(false);
    apiService.initiateHubSpotOAuth();
  };

  const handleCloseWelcome = () => {
    setShowWelcome(false);
  };

  const handleCloseConnect = () => {
    setShowConnect(false);
  };

  // Show a simple test page for debugging
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          WorkflowGuard - Routing Test
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          If you can see this page, SPA routing is working correctly!
        </p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Current path: {window.location.pathname}
          </p>
          <p className="text-sm text-gray-500">
            User: {user ? user.email : 'Not logged in'}
          </p>
          <div className="space-x-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Go to Dashboard
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
