import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
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
export interface Plan {
  name: string;
  features: string[];
  status: string;
}

interface PlanContextType {
  plan: Plan | null;
  setPlan: (plan: Plan) => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    // Optionally restore from localStorage or set a default plan
    const storedPlan = localStorage.getItem('userPlan');
    if (storedPlan) {
      setPlan(JSON.parse(storedPlan));
    } else {
      setPlan({
        name: 'Free',
        features: ['basic_usage'],
        status: 'active',
      });
    }
  }, []);

  const updatePlan = (plan: Plan) => {
    setPlan(plan);
    localStorage.setItem('userPlan', JSON.stringify(plan));
  };

  return (
    <PlanContext.Provider value={{ plan, setPlan: updatePlan }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}; 