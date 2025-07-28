import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { Button } from './button';

interface AppLoadingStateProps {
  message?: string;
  timeout?: number;
  onTimeout?: () => void;
  onRetry?: () => void;
  showRetry?: boolean;
}

const AppLoadingState: React.FC<AppLoadingStateProps> = ({
  message = 'Loading WorkflowGuard...',
  timeout = 30000, // 30 seconds
  onTimeout,
  onRetry,
  showRetry = true
}) => {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingTime(prev => {
        const newTime = prev + 1000;
        if (newTime >= timeout && !hasTimedOut) {
          setHasTimedOut(true);
          onTimeout?.();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeout, hasTimedOut, onTimeout]);

  if (hasTimedOut) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Timeout</h2>
            <p className="text-gray-600 mb-4">
              The app is taking longer than expected to load. This might be due to network issues or server load.
            </p>
          </div>
          
          {showRetry && onRetry && (
            <div className="space-y-3">
              <Button 
                onClick={onRetry}
                className="w-full"
                variant="default"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
                variant="outline"
              >
                Refresh Page
              </Button>
            </div>
          )}
          
          <div className="mt-6 text-sm text-gray-500">
            <p>If the problem persists, please:</p>
            <ul className="mt-2 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Try again in a few minutes</li>
              <li>• Contact support if the issue continues</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" text={message} />
        {loadingTime > 10000 && (
          <p className="mt-4 text-sm text-gray-500">
            This is taking longer than usual... Please wait.
          </p>
        )}
      </div>
    </div>
  );
};

export default AppLoadingState; 