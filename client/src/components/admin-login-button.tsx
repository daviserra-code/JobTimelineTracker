import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Constants for admin auth - hardcoded for reliability
const ADMIN_TOKEN_KEY = 'admin_token_dvd70ply';
const ADMIN_TOKEN_VALUE = 'Administrator-dvd70ply';
const ADMIN_USERNAME_KEY = 'admin_username';
const ADMIN_KEY = 'dvd70ply'; // Secret key used for direct verification

export default function AdminLoginButton() {
  const { toast } = useToast();
  
  // Direct method to enable admin mode with all possible approaches
  const handleDirectAdminLogin = () => {
    try {
      // Method 1: Set localStorage values (most reliable across sessions)
      localStorage.setItem(ADMIN_TOKEN_KEY, ADMIN_TOKEN_VALUE);
      localStorage.setItem(ADMIN_USERNAME_KEY, 'Administrator');
      
      // Method 2: Set a cookie (backup method)
      document.cookie = `admin_auth_dvd70ply=true; path=/; max-age=86400`;
      
      // Method 3: Add admin key to URL (for deployed environments)
      if (!window.location.href.includes(ADMIN_KEY)) {
        const separator = window.location.href.includes('?') ? '&' : '?';
        const newUrl = `${window.location.href}${separator}key=${ADMIN_KEY}`;
        window.history.pushState({}, '', newUrl);
      }
      
      // Show a toast message
      toast({
        title: "Admin mode enabled",
        description: "Administrator access granted",
      });
      
      // Also try standard login API for session-based auth
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Administrator',
          password: 'dvd70ply'
        }),
        credentials: 'include'
      }).catch(err => console.error('Login API error (non-critical):', err));
      
      // Force reload to ensure changes take effect
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Error setting admin token:', err);
      toast({
        title: "Login failed",
        description: "Could not enable admin mode",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      variant="outline" 
      className="fixed bottom-4 right-4 z-50 bg-white shadow-lg opacity-70 hover:opacity-100"
      onClick={handleDirectAdminLogin}
    >
      Enable Admin Mode
    </Button>
  );
}