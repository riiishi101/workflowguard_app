import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ApiService from '../lib/api';
import { getToken, setToken, removeToken } from '../utils/tokenUtils';
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
  connectHubSpot: (isMarketplace?: boolean) => Promise<void>;
  isConnecting: boolean;
  disconnectHubSpot: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook to access authentication context
 * @throws {Error} When used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
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
        toast({
          title: "Connection Failed",
          description: response.error || "Failed to get HubSpot authorization URL. Please try again or contact support.",
          variant: "destructive",
        });
        if (response.error) {
          console.error("HubSpot Auth Error:", response.error);
        }
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error?.message || "Failed to connect to HubSpot. Please check your internet connection and try again.",
        variant: "destructive",
      });
      console.error("HubSpot Auth Exception:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectHubSpot = async () => {
    try {
      const response = await ApiService.disconnectHubSpot();
      if (response.success) {
        setUser(prevUser => prevUser ? { ...prevUser, hubspotPortalId: undefined } : null);
      }
    } catch (error) {
      // Silently handle error - user will see if disconnection failed through UI state
    }
  };

  const logout = async () => {
    setUser(null);
    removeToken();
  };

  const value: AuthContextType = {
    user,
    loading,
    connectHubSpot,
    isConnecting,
    disconnectHubSpot,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};