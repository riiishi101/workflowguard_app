import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://www.workflowguard.pro/api';

// --- Auth Context ---
export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  hubspotAccessToken?: string;
  hubspotPortalId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always check for JWT cookie authentication first
    (async () => {
      try {
        console.log('Checking for JWT cookie authentication...');
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: 'include',
        });
        console.log('Auth /me response status:', res.status);
        if (res.ok) {
          const data = await res.json();
          console.log('Auth /me response data:', data);
          setUser(data.user);
          setToken(null); // No Bearer token, but user is authenticated via cookie
          // Clear any old localStorage data since we're using cookie auth
          localStorage.removeItem('authUser');
          localStorage.removeItem('authToken');
        } else {
          console.log('Auth /me failed:', res.status, res.statusText);
          // Fall back to localStorage if cookie auth fails
          const storedUser = localStorage.getItem('authUser');
          const storedToken = localStorage.getItem('authToken');
          if (storedUser && storedToken) {
            console.log('Falling back to localStorage authentication');
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
          }
        }
      } catch (e) {
        console.log('Auth /me error:', e);
        // Fall back to localStorage if cookie auth fails
        const storedUser = localStorage.getItem('authUser');
        const storedToken = localStorage.getItem('authToken');
        if (storedUser && storedToken) {
          console.log('Falling back to localStorage authentication after error');
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem('authUser', JSON.stringify(user));
    localStorage.setItem('authToken', token);
  };

  const logout = async () => {
    try {
      // Call backend to clear JWT cookie
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      // Ignore errors during logout
    }
    setUser(null);
    setToken(null);
    localStorage.clear();
    sessionStorage.clear();
    // Redirect to HubSpot app marketplace listing
    if (typeof window !== 'undefined') {
      window.location.href = 'https://app.hubspot.com/ecosystem/marketplace/apps';
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Hook to require authentication - redirects or shows appropriate UI
export const useRequireAuth = () => {
  const { user, loading } = useAuth();
  
  // If still loading, don't redirect yet
  if (loading) {
    return;
  }
  
  // If no user, the WelcomeModal will be shown by ModalsManager in App.tsx
  // No need to redirect since the modal will handle the flow
  return user;
};

// --- Plan Context ---
export interface PlanStatus {
  planId: string;
  isTrialActive: boolean;
  trialEndDate?: string;
  trialPlanId?: string;
  remainingTrialDays?: number;
}

interface PlanContextType {
  plan: PlanStatus | null;
  setPlan: (plan: PlanStatus) => void;
  isTrialing: () => boolean;
  hasFeature: (feature: string) => boolean;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [plan, setPlan] = useState<PlanStatus | null>(null);

  useEffect(() => {
    async function fetchPlanStatus() {
      try {
        const res = await fetch('/api/users/me/plan-status', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch plan status');
        const data = await res.json();
        setPlan(data);
      } catch (e) {
        setPlan({ planId: 'starter', isTrialActive: false });
      }
    }
    fetchPlanStatus();
  }, []);

  const isTrialing = () => !!plan?.isTrialActive;

  // Example feature map for demo; in production, fetch from backend or config
  const planFeatures: Record<string, string[]> = {
    starter: ['basic_monitoring', 'email_support'],
    professional: ['advanced_monitoring', 'priority_support', 'custom_notifications'],
    enterprise: ['unlimited_workflows', 'advanced_monitoring', '24_7_support', 'api_access', 'user_permissions', 'audit_logs'],
  };

  const hasFeature = (feature: string) => {
    if (!plan) return false;
    if (plan.isTrialActive && plan.trialPlanId) {
      return planFeatures[plan.trialPlanId]?.includes(feature);
    }
    return planFeatures[plan.planId]?.includes(feature);
  };

  return (
    <PlanContext.Provider value={{ plan, setPlan, isTrialing, hasFeature }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}; 