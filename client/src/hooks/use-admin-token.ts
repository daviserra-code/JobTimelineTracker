/**
 * This hook manages a special admin token that's stored in localStorage
 * This is a simpler and more reliable approach for the deployed environment
 * where session cookies might not work properly
 * 
 * Default user must have 'user' role, not 'admin' - Admin authentication is only via explicit login
 */

const ADMIN_TOKEN_KEY = 'admin_token_dvd70ply';
const ADMIN_TOKEN_VALUE = 'Administrator-dvd70ply';
const ADMIN_USERNAME_KEY = 'admin_username';

export function useAdminToken() {
  // Set admin token
  const setAdminToken = () => {
    try {
      localStorage.setItem(ADMIN_TOKEN_KEY, ADMIN_TOKEN_VALUE);
      localStorage.setItem(ADMIN_USERNAME_KEY, 'Administrator');
      console.log('Admin token set successfully');
    } catch (err) {
      console.error('Error setting admin token:', err);
    }
  };

  // Clear admin token
  const clearAdminToken = () => {
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USERNAME_KEY);
      console.log('Admin token cleared');
    } catch (err) {
      console.error('Error clearing admin token:', err);
    }
  };

  // Check if admin token exists
  const hasAdminToken = () => {
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY) === ADMIN_TOKEN_VALUE;
    } catch (err) {
      console.error('Error checking admin token:', err);
      return false;
    }
  };

  // Get admin token
  const getAdminToken = () => {
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY);
    } catch (err) {
      console.error('Error getting admin token:', err);
      return null;
    }
  };

  // Get admin username
  const getAdminUsername = () => {
    try {
      return localStorage.getItem(ADMIN_USERNAME_KEY);
    } catch (err) {
      console.error('Error getting admin username:', err);
      return null;
    }
  };

  return {
    setAdminToken,
    clearAdminToken,
    hasAdminToken,
    getAdminToken,
    getAdminUsername,
  };
}