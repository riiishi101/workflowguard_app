import React from 'react';
import { useAuth } from './AuthContext';

interface RoleGuardProps {
  roles: string[];
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ roles, children }) => {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl font-semibold mb-4 text-red-600">Access Denied</h2>
          <p className="mb-6 text-gray-600">You do not have permission to view this page. Please contact your administrator if you believe this is an error.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export default RoleGuard; 