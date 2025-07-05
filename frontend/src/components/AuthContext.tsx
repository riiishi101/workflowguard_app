import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string, role?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user from /users/me if token exists
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      apiService.setToken(storedToken);
      apiService.getMe()
        .then((res) => {
          setUser(res as User);
        })
        .catch(() => {
          setUser(null);
          setToken(null);
          localStorage.removeItem('authToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiService.loginUser({ email, password });
      const { token: jwtToken } = res as any;
      setToken(jwtToken);
      localStorage.setItem('authToken', jwtToken);
      apiService.setToken(jwtToken);
      const userRes = await apiService.getMe();
      setUser(userRes as User);
      localStorage.setItem('authUser', JSON.stringify(userRes));
      setLoading(false);
    } catch (err) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      setLoading(false);
      throw err;
    }
  };

  const register = async (email: string, password: string, name?: string, role?: string) => {
    setLoading(true);
    try {
      await apiService.registerUser({ email, password, name, role });
      await login(email, password);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    apiService.setToken(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useRequireAuth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);
  return { user, loading };
};

// Plan Context
const PlanContext = createContext(null);

export function PlanProvider({ children }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // MOCK PLAN FOR FRONTEND UI TESTING
    setPlan({
      name: 'Professional',
      planId: 'professional',
      status: 'active',
      features: [
        'workflow_comparison',
        'rollback',
        'notifications',
        'custom_notifications',
        'user_permissions',
        'audit_logs',
        'api_access',
        'sso',
      ],
      workflowLimit: 500,
      historyRetention: 90,
      trialEndDate: '2099-12-31',
      nextBillingDate: '2099-12-31',
    });
    setLoading(false);
  }, []);

  return (
    <PlanContext.Provider value={{ plan, loading }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
} 