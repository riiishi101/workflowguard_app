/**
 * HubSpot integration utilities
 */
import { HUBSPOT_CONFIG } from '../config/environment';
import { getToken, setToken } from './tokenUtils';
import { handleApiError } from './errorUtils';
import { apiClient } from '../lib/api';

/**
 * Initiate HubSpot OAuth flow
 */
export const initiateHubSpotOAuth = () => {
  const clientId = HUBSPOT_CONFIG.CLIENT_ID;
  const redirectUri = HUBSPOT_CONFIG.REDIRECT_URI;
  
  if (!clientId) {
    console.error('HubSpot client ID not configured');
    throw new Error('HubSpot integration is not properly configured');
  }
  
  const scopes = 'crm.objects.contacts.read crm.objects.contacts.write workflows.read workflows.write';
  const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
  
  // Store the current URL to redirect back after authentication
  sessionStorage.setItem('hubspot_auth_redirect', window.location.pathname);
  
  // Redirect to HubSpot OAuth page
  window.location.href = authUrl;
};

/**
 * Check if HubSpot is connected
 */
export const isHubSpotConnected = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/hubspot/status');
    return response.data?.connected === true;
  } catch (error) {
    console.error('Error checking HubSpot connection status:', error);
    return false;
  }
};

/**
 * Handle HubSpot OAuth callback
 */
export const handleHubSpotCallback = async (code: string): Promise<boolean> => {
  try {
    const response = await apiClient.post('/hubspot/auth/callback', { code });
    
    if (response.data?.token) {
      // Store the token
      setToken(response.data.token);
      
      // Get redirect URL from session storage or default to dashboard
      const redirectUrl = sessionStorage.getItem('hubspot_auth_redirect') || '/dashboard';
      sessionStorage.removeItem('hubspot_auth_redirect');
      
      // Redirect to the stored URL
      window.location.href = redirectUrl;
      return true;
    }
    
    return false;
  } catch (error) {
    handleApiError(error, 'HubSpot Connection Failed');
    return false;
  }
};

/**
 * Disconnect HubSpot integration
 */
export const disconnectHubSpot = async (): Promise<boolean> => {
  try {
    await apiClient.post('/hubspot/disconnect');
    return true;
  } catch (error) {
    handleApiError(error, 'Failed to disconnect HubSpot');
    return false;
  }
};