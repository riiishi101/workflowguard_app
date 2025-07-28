import React from 'react';
import TopNavigation from '../TopNavigation';
import Footer from '../Footer';
import { cn } from '../../lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  fullWidth?: boolean;
  sidebar?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  className,
  showHeader = true,
  showFooter = true,
  fullWidth = false,
  sidebar,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      {showHeader && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <TopNavigation />
        </header>
      )}
      
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        {sidebar && (
          <aside className="w-64 bg-white border-r border-gray-200 hidden lg:block">
            <div className="p-6">
              {sidebar}
            </div>
          </aside>
        )}
        
        {/* Content Area */}
        <main className={cn(
          "flex-1",
          fullWidth ? "w-full" : "max-w-7xl mx-auto",
          className
        )}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Footer */}
      {showFooter && (
        <footer className="bg-white border-t border-gray-200">
          <Footer />
        </footer>
      )}
    </div>
  );
};

// Page Header Component
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}) => {
  return (
    <div className={cn("mb-8", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <svg className="w-4 h-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-sm text-gray-900 font-medium">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      
      {/* Title and Actions */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="ml-6 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

// Content Section Component
interface ContentSectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  children,
  title,
  subtitle,
  className,
  padding = 'lg',
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <section className={cn(
      "bg-white rounded-lg border border-gray-200",
      paddingStyles[padding],
      className
    )}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
};

// Grid Layout Component
interface GridLayoutProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const GridLayout: React.FC<GridLayoutProps> = ({
  children,
  cols = 1,
  gap = 'lg',
  className,
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-6 md:grid-cols-12',
  };

  const gapStyles = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12',
  };

  return (
    <div className={cn(
      "grid",
      gridCols[cols],
      gapStyles[gap],
      className
    )}>
      {children}
    </div>
  );
}; 