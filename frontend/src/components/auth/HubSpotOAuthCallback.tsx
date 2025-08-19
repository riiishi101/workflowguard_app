import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ApiService } from '@/lib/api';

export const HubSpotOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    const handleOAuthCallback = async () => {
      try {
        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('Authorization code not found in the URL');
        }

        // Exchange the authorization code for access tokens
        const response = await ApiService.completeHubSpotOAuth(code);
        
        if (response.success && response.data?.token) {
          // Store the token
          localStorage.setItem('authToken', response.data.token);
          
          toast({
            title: 'Success!',
            description: 'Successfully connected to HubSpot',
            variant: 'default',
          });
          
          // Navigate to workflow selection
          navigate('/workflow-selection');
        } else {
          throw new Error(response.error || 'Failed to complete OAuth flow');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        toast({
          title: 'Connection Failed',
          description: 'Failed to connect to HubSpot. Please try again.',
          variant: 'destructive',
        });
        navigate('/settings?tab=integrations');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md text-center space-y-4">
        {error ? (
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-destructive">Connection Failed</h2>
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={() => navigate('/settings?tab=integrations')}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Back to Settings
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <h2 className="text-2xl font-bold">Connecting to HubSpot...</h2>
            <p className="text-muted-foreground">Please wait while we connect your HubSpot account.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HubSpotOAuthCallback;
