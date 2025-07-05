import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          WorkflowGuard - Router Test
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          React Router is now working!
        </p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Current path: {window.location.pathname}
          </p>
          <p className="text-sm text-gray-500">
            React version: {React.version}
          </p>
          <p className="text-sm text-gray-500">
            Timestamp: {new Date().toISOString()}
          </p>
          <div className="space-x-4">
            <a href="/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Go to Dashboard
            </a>
            <a href="/settings" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Go to Settings
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Dashboard Page
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          SPA routing is working correctly!
        </p>
        <a href="/" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Back to Home
        </a>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Settings Page
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Settings page is working!
        </p>
        <a href="/" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Back to Home
        </a>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
};

export default App;
