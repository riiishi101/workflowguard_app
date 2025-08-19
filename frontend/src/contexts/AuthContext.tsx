import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ApiService from '../lib/api';
import { getToken, setToken, removeToken, isAuthenticated as checkAuth } from '../utils/tokenUtils';
import { useToast } from '../components/ui/use-toast';

interface User {
  id: string;
  email: string;
  name: string;
  hubspotPortalId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  connectHubSpot: (isMarketplace?: boolean) => void;
  isConnecting: boolean;
  disconnectHubSpot: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  testAuthentication?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This function must be consistent for HMR to work properly
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (hasInitialized) {
      return;
    }

    const initializeAuth = async () => {
      try {
        // Check for token in URL after OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const successParam = urlParams.get('success');
        const tokenParam = urlParams.get('token');
        const isMarketplace = urlParams.get('marketplace') === 'true';

        // Handle OAuth callback
        if (successParam === 'true' && tokenParam) {
          setToken(tokenParam);
          
          // Clean up URL without triggering a navigation
          const newUrl = window.location.pathname + 
            (urlParams.get('marketplace') === 'true' ? '?source=marketplace' : '');
          window.history.replaceState({}, document.title, newUrl);
        }

        const token = getToken();

        if (token) {
          try {
            const response = await ApiService.getCurrentUser();

            if (response.success && response.data) {
              setUser(response.data);

              // Don't redirect here - let the OnboardingFlow handle navigation
              if (successParam === 'true' && tokenParam) {
              }
            } else {
              removeToken();
              setUser(null);
            }
          } catch (error) {
            removeToken();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        removeToken();
        setUser(null);
      } finally {
        setLoading(false);
        setHasInitialized(true);
        setTimeout(() => {
        }, 0);
      }
    };

    initializeAuth();
  }, [hasInitialized]);

  const connectHubSpot = async (isMarketplace: boolean = false) => {
    setIsConnecting(true);
    try {
      const response = await ApiService.getHubSpotAuthUrl(isMarketplace);
      if (response.success && response.data?.url) {
        window.location.href = response.data.url;
      } else {
        console.error('Failed to get HubSpot auth URL');
        // Show error toast notification
        toast({
          title: "Connection Failed",
          description: "Failed to get HubSpot authorization URL. Please try again or contact support.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error connecting to HubSpot:', error);
      // Show error toast notification
      toast({
        title: "Connection Failed",
        description: "Failed to connect to HubSpot. Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectHubSpot = async () => {
    try {
      const response = await ApiService.disconnectHubSpot();
      if (response.success) {
        setUser(prevUser => prevUser ? { ...prevUser, hubspotPortalId: undefined } : null);
      } else {
        console.error('Failed to disconnect HubSpot');
      }
    } catch (error) {
      console.error('Error disconnecting from HubSpot:', error);
    }
  };

  const testAuthentication = async () => {
    const token = localStorage.getItem('authToken');
    return;
  };

  const logout = async () => {
    try {
      // Clear auth state
      setUser(null);
      localStorage.removeItem('authToken');
    } catch (error) {
      // Force logout even on error
      setUser(null);
      localStorage.removeItem('authToken');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    connectHubSpot,
    isConnecting,
    disconnectHubSpot,
    logout,
    isAuthenticated: !!user,
    testAuthentication, // Add this for debugging
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};