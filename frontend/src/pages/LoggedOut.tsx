import React from 'react';

const LoggedOut: React.FC = () => {
  const handleLogin = () => {
    window.location.href = '/api/auth/hubspot';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-semibold mb-4">You have been logged out</h2>
        <p className="mb-6 text-gray-600">Thank you for using WorkflowGuard. To access your dashboard again, please log in with HubSpot.</p>
        <button
          onClick={handleLogin}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Log in with HubSpot
        </button>
      </div>
    </div>
  );
};

export default LoggedOut; 