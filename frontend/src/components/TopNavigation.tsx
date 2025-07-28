import { useLocation, Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import WorkflowGuardLogo from "./WorkflowGuardLogo";
import { cn } from "@/lib/utils";
import { HelpCircle, Settings, AlertTriangle } from "lucide-react";
import { useAuth } from './AuthContext';
import { useEffect, useState } from 'react';

interface TopNavigationProps {
  minimal?: boolean;
}

const TopNavigation = ({ minimal = false }: TopNavigationProps) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  if (minimal) {
    return (
      <header className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <div className="flex-shrink-0">
            <WorkflowGuardLogo />
          </div>
          {/* Help & Settings */}
          <div className="flex items-center gap-6">
            <Link to="/help" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm font-medium">
              <HelpCircle className="w-5 h-5" /> Help
            </Link>
            <Link to="/settings" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm font-medium">
              <Settings className="w-5 h-5" /> Settings
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Workflow History", path: "/workflow-history" },
    ...(user?.role === 'admin' ? [
      { label: "Overage Dashboard", path: "/overages" },
      { label: "Analytics", path: "/analytics" },
      { label: "Real-time Dashboard", path: "/realtime-dashboard" },
    ] : []),
    { label: "Settings", path: "/settings" },
    { label: "Help & Support", path: "/help" },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }
    return location.pathname === path;
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex-shrink-0">
          <WorkflowGuardLogo />
        </div>

        {/* Navigation Items */}
        <nav className="flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "text-sm font-medium transition-colors",
                isActive(item.path)
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{user.name || user.email} ({user.role})</span>
            <button onClick={logout} className="text-sm text-blue-600 hover:underline">Logout</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNavigation;
