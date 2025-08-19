/**
 * Environment configuration
 * Centralizes all environment-specific configuration
 */

// API configuration
export const API_CONFIG = {
  // Base URL for API requests - use environment variable or fallback to development URL
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
};

// HubSpot configuration
export const HUBSPOT_CONFIG = {
  // HubSpot client ID
  CLIENT_ID: import.meta.env.VITE_HUBSPOT_CLIENT_ID,
  
  // HubSpot redirect URI
  REDIRECT_URI: import.meta.env.VITE_HUBSPOT_REDIRECT_URI || 'http://localhost:5173/auth/hubspot/callback',
};

// Application configuration
export const APP_CONFIG = {
  // Application name
  APP_NAME: 'WorkflowGuard',
  
  // Application version
  VERSION: '1.0.0',
};