import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) {
  throw new Error('VITE_API_URL must be set in the environment variables');
}

// --- Auth Context ---
export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  hubspotAccessToken?: string;
  hubspotPortalId?: string;
  planId?: string; // Added for fallback
  isTrialActive?: boolean; // Added for fallback
  trialEndDate?: string; // Added for fallback
  trialPlanId?: string; // Added for fallback
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
  const [error, setError] = useState<string | null>(null); // NEW: error state

  useEffect(() => {
    // Always check for JWT cookie authentication first
    (async () => {
      function fetchWithTimeout(resource: RequestInfo, options: RequestInit = {}, timeout = 15000) {
        return Promise.race([
          fetch(resource, options),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout))
        ]);
      }
      try {
        setError(null); // clear error before trying
        console.log('Checking for JWT cookie authentication...');
        const res = await fetchWithTimeout(`${API_BASE_URL}/auth/me`, {
          credentials: 'include',
        }, 15000) as Response;
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
          } else {
            setError('Authentication failed. Please log in again.');
          }
        }
      } catch (e: any) {
        console.log('Auth /me error:', e);
        // Fall back to localStorage if cookie auth fails
        const storedUser = localStorage.getItem('authUser');
        const storedToken = localStorage.getItem('authToken');
        if (storedUser && storedToken) {
          console.log('Falling back to localStorage authentication after error');
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } else {
          setError(e.message || 'Authentication error. Please try again.');
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
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
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
  const { user } = useAuth();

  useEffect(() => {
    async function fetchPlanStatus() {
      try {
        const response = await fetch(`${API_BASE_URL}/users/me/plan-status`, {
          credentials: 'include',
        });
        if (response.ok) {
          const planData = await response.json();
          setPlan(planData);
        } else {
          // Fallback to user data if plan status endpoint fails
          if (user) {
            setPlan({
              planId: user.planId || 'trial',
              isTrialActive: user.isTrialActive || false,
              trialEndDate: user.trialEndDate || null,
              trialPlanId: user.trialPlanId || 'professional',
              remainingTrialDays: user.trialEndDate ?
                Math.max(0, Math.ceil((new Date(user.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) :
                undefined
            });
          } else {
            setPlan({ planId: 'trial', isTrialActive: false });
          }
        }
      } catch (error) {
        console.error('Failed to fetch plan status:', error);
        // Fallback to user data if plan status endpoint fails
        if (user) {
          setPlan({
            planId: user.planId || 'trial',
            isTrialActive: user.isTrialActive || false,
            trialEndDate: user.trialEndDate || null,
            trialPlanId: user.trialPlanId || 'professional',
            remainingTrialDays: user.trialEndDate ?
              Math.max(0, Math.ceil((new Date(user.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) :
              undefined
          });
        } else {
          setPlan({ planId: 'trial', isTrialActive: false });
        }
      }
    }
    if (user) {
      fetchPlanStatus();
    }
  }, [user]);

  const isTrialing = () => !!plan?.isTrialActive;

  const hasFeature = (feature: string) => {
    if (!plan) return false;
    
    // If user is on trial, check trial plan features
    if (plan.isTrialActive && plan.trialPlanId) {
      const trialPlanFeatures = {
        'professional': ['advanced_monitoring', 'priority_support', 'custom_notifications'],
        'enterprise': ['unlimited_workflows', 'advanced_monitoring', '24_7_support', 'api_access', 'user_permissions', 'audit_logs']
      };
      return trialPlanFeatures[plan.trialPlanId as keyof typeof trialPlanFeatures]?.includes(feature) || false;
    }
    
    // Check current plan features
    const planFeatures = {
      'trial': ['advanced_monitoring', 'priority_support', 'custom_notifications'],
      'professional': ['advanced_monitoring', 'priority_support', 'custom_notifications'],
      'enterprise': ['unlimited_workflows', 'advanced_monitoring', '24_7_support', 'api_access', 'user_permissions', 'audit_logs']
    };
    return planFeatures[plan.planId as keyof typeof planFeatures]?.includes(feature) || false;
  };

  return (
    <PlanContext.Provider value={{ plan, setPlan, isTrialing, hasFeature }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}; 