import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          WorkflowGuard - Minimal Test
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          This is a minimal test page to isolate the error.
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
        </div>
      </div>
    </div>
  );
};

export default App;
