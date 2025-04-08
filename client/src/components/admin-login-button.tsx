import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Constants for admin auth - directly included to avoid dependency on hooks
const ADMIN_TOKEN_KEY = 'admin_token_dvd70ply';
const ADMIN_TOKEN_VALUE = 'Administrator-dvd70ply';
const ADMIN_USERNAME_KEY = 'admin_username';

export default function AdminLoginButton() {
  const { toast } = useToast();
  
  // Direct method to set admin token in localStorage
  const handleDirectAdminLogin = () => {
    try {
      // Set the admin token in localStorage
      localStorage.setItem(ADMIN_TOKEN_KEY, ADMIN_TOKEN_VALUE);
      localStorage.setItem(ADMIN_USERNAME_KEY, 'Administrator');
      
      // Show a toast message
      toast({
        title: "Admin mode enabled",
        description: "Logging you in as Administrator...",
      });
      
      // Use the standard login API endpoint instead of just reloading
      fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'Administrator',
          password: 'dvd70ply'
        }),
        credentials: 'include'
      })
      .then(response => {
        if (response.ok) {
          // Reload the page after successful login
          toast({
            title: "Login successful",
            description: "You are now logged in as Administrator",
          });
          
          // Small delay before reloading
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          // If API login fails, still ensure local tokens are set and reload
          console.log("API login failed, but local tokens are set. Reloading...");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      })
      .catch(err => {
        console.error('Login API error:', err);
        // Even if API fails, reload to use localStorage tokens
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      });
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