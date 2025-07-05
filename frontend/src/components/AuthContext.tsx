import React, { createContext, useContext, useState, useEffect } from 'react';

// --- Auth Context ---
export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
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
    // Restore from localStorage
    const storedUser = localStorage.getItem('authUser');
    const storedToken = localStorage.getItem('authToken');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem('authUser', JSON.stringify(user));
    localStorage.setItem('authToken', token);
  };

  const logout = () => {
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