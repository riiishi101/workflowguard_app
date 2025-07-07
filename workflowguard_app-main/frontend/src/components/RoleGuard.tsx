import React from 'react';
import { useAuth } from './AuthContext';

interface RoleGuardProps {
  roles: string[];
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ roles, children }) => {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return null;
  return <>{children}</>;
};

export default RoleGuard; 