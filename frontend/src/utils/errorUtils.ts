/**
 * Error handling utilities for consistent error management across the application
 */
import { toast } from "@/components/ui/use-toast";

// Error types
export enum ErrorType {
  AUTHENTICATION = 'authentication',
  NETWORK = 'network',
  HUBSPOT = 'hubspot',
  VALIDATION = 'validation',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

// Error response interface
export interface ErrorResponse {
  status?: number;
  message?: string;
  type?: ErrorType;
  details?: any;
}

/**
 * Parse API error response into standardized format
 */
export const parseApiError = (error: any): ErrorResponse => {
  // Network error
  if (error.message?.includes('Network Error')) {
    return {
      status: 0,
      message: 'Network connection error. Please check your internet connection.',
      type: ErrorType.NETWORK
    };
  }

  // Axios error with response
  if (error.response) {
    const { status, data } = error.response;
    
    // Authentication errors
    if (status === 401) {
      return {
        status,
        message: 'Authentication failed. Please log in again.',
        type: ErrorType.AUTHENTICATION,
        details: data
      };
    }
    
    // HubSpot specific errors
    if (status === 403 && data?.message?.includes('HubSpot')) {
      return {
        status,
        message: data.message || 'HubSpot connection issue. Please reconnect your account.',
        type: ErrorType.HUBSPOT,
        details: data
      };
    }
    
    // Server errors
    if (status >= 500) {
      return {
        status,
        message: data?.message || 'Server error. Please try again later.',
        type: ErrorType.SERVER,
        details: data
      };
    }
    
    // Other client errors
    return {
      status,
      message: data?.message || `Error: ${status}`,
      type: status === 400 ? ErrorType.VALIDATION : ErrorType.UNKNOWN,
      details: data
    };
  }
  
  // Default unknown error
  return {
    status: 500,
    message: error.message || 'An unexpected error occurred',
    type: ErrorType.UNKNOWN,
    details: error
  };
};

/**
 * Display error toast with consistent formatting
 */
export const showErrorToast = (error: any, title = 'Error') => {
  const parsedError = parseApiError(error);
  
  toast({
    title,
    description: parsedError.message,
    variant: "destructive",
  });
  
  return parsedError;
};

/**
 * Handle API errors with consistent logging and display
 */
export const handleApiError = (error: any, title = 'Error') => {
  const parsedError = parseApiError(error);
  
  // Log error to console with details
  console.error(`API Error (${parsedError.type}):`, {
    message: parsedError.message,
    status: parsedError.status,
    details: parsedError.details
  });
  
  // Show toast notification
  showErrorToast(parsedError, title);
  
  return parsedError;
};