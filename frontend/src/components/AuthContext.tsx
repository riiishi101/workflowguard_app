import React, { createContext, useContext } from 'react';

// --- Minimal Static Auth Context ---
export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthContextType {
  user: null;
  token: null;
  loading: false;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value: AuthContextType = {
    user: null,
    token: null,
    loading: false,
    login: () => {},
    logout: () => {},
  };
  return (
    <AuthContext.Provider value={value}>
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
  const [plan, setPlan] = React.useState<Plan | null>(null);

  React.useEffect(() => {
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