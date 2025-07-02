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

  useEffect(() => {
    // MOCK AUTH FOR FRONTEND UI TESTING
    setUser({
      id: 'mock-user-id',
      email: 'mockuser@example.com',
      name: 'Mock User',
      role: 'admin',
    });
    setToken('mock-token');
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setUser({
      id: 'mock-user-id',
      email,
      name: 'Mock User',
      role: 'admin',
    });
    setToken('mock-token');
    localStorage.setItem('authToken', 'mock-token');
    localStorage.setItem('authUser', JSON.stringify({
      id: 'mock-user-id',
      email,
      name: 'Mock User',
      role: 'admin',
    }));
    setLoading(false);
  };

  const register = async (email: string, password: string, name?: string, role?: string) => {
    setLoading(true);
    setUser({
      id: 'mock-user-id',
      email,
      name: name || 'Mock User',
      role: role || 'admin',
    });
    setToken('mock-token');
    localStorage.setItem('authToken', 'mock-token');
    localStorage.setItem('authUser', JSON.stringify({
      id: 'mock-user-id',
      email,
      name: name || 'Mock User',
      role: role || 'admin',
    }));
    setLoading(false);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
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