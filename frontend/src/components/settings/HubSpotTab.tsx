import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ApiService } from '@/lib/api';

export const HubSpotTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const connectHubSpot = async () => {
    try {
      setIsLoading(true);
      // Store the current path to return after auth
      localStorage.setItem('hubspot_return_to', '/settings?tab=hubspot');
      
      const response = await ApiService.getHubSpotAuthUrl();
      
      if (response.success && response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('Failed to get HubSpot authorization URL');
      }
    } catch (error) {
      console.error('Error connecting to HubSpot:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect to HubSpot. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">HubSpot Integration</h3>
        <p className="mt-2 text-sm text-gray-500">
          Connect your HubSpot account to sync workflows and manage automations.
        </p>
      </div>

      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Connect to HubSpot</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                By connecting your HubSpot account, you'll be able to manage workflows and automations directly from WorkflowGuard.
              </p>
            </div>
            <div className="mt-4">
              <Button
                type="button"
                onClick={connectHubSpot}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect HubSpot Account'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HubSpotTab;
