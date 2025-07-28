import React from 'react';
import { cn } from '@/lib/utils';
import { components } from '@/lib/design-system';

interface EnhancedCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'lg',
  hover = false,
  onClick,
  disabled = false,
}) => {
  const baseStyles = 'rounded-lg border transition-all duration-250 ease-in-out';
  
  const variants = {
    default: 'bg-white border-gray-200 shadow-sm',
    elevated: 'bg-white border-gray-200 shadow-md hover:shadow-lg',
    outlined: 'bg-transparent border-gray-300',
    ghost: 'bg-transparent border-transparent',
  };
  
  const paddingStyles = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };
  
  const hoverStyles = hover && !disabled ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : '';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const clickableStyles = onClick && !disabled ? 'cursor-pointer' : '';

  return (
    <div
      className={cn(
        baseStyles,
        variants[variant],
        paddingStyles[padding],
        hoverStyles,
        disabledStyles,
        clickableStyles,
        className
      )}
      onClick={disabled ? undefined : onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
    >
      {children}
    </div>
  );
};

interface EnhancedCardHeaderProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const EnhancedCardHeader: React.FC<EnhancedCardHeaderProps> = ({
  children,
  className,
  title,
  subtitle,
  action,
}) => {
  return (
    <div className={cn('flex items-start justify-between pb-4', className)}>
      <div className="flex-1">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        )}
        {subtitle && (
          <p className="text-sm text-gray-600">{subtitle}</p>
        )}
        {children}
      </div>
      {action && (
        <div className="ml-4 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};

interface EnhancedCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const EnhancedCardContent: React.FC<EnhancedCardContentProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  );
};

interface EnhancedCardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const EnhancedCardFooter: React.FC<EnhancedCardFooterProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-between pt-4 border-t border-gray-200', className)}>
      {children}
    </div>
  );
}; 