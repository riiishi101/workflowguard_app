import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Show a simple test page for debugging
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          WorkflowGuard
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Welcome to WorkflowGuard
        </p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Current path: {window.location.pathname}
          </p>
          <p className="text-sm text-gray-500">
            User: {user ? user.email : 'Not logged in'}
          </p>
          <p className="text-sm text-gray-500">
            Role: {user ? user.role : 'N/A'}
          </p>
          <p className="text-sm text-gray-500">
            Loading: {loading ? 'Yes' : 'No'}
          </p>

          {/* Navigation Links */}
          <div className="mt-8 space-y-2">
            <h3 className="text-lg font-semibold text-gray-700">Navigation</h3>
            <div className="space-x-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              >
                Go to Dashboard
              </button>
              <button 
                onClick={() => navigate('/settings')}
                className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
              >
                Go to Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
