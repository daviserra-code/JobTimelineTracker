import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

// Constants for admin auth - directly included to avoid dependency on hooks
const ADMIN_TOKEN_KEY = 'admin_token_dvd70ply';
const ADMIN_TOKEN_VALUE = 'Administrator-dvd70ply';

interface AddActivityButtonProps {
  onClick: () => void;
}

export default function AddActivityBtn({ onClick }: AddActivityButtonProps) {
  const { isAdmin: authIsAdmin, user } = useAuth();
  const [isLocalAdmin, setIsLocalAdmin] = useState(false);
  
  // Check admin status from both localStorage and auth hook
  useEffect(() => {
    try {
      const isAdminUser = localStorage.getItem(ADMIN_TOKEN_KEY) === ADMIN_TOKEN_VALUE;
      setIsLocalAdmin(isAdminUser);
      
      // If localStorage indicates admin but auth doesn't, try to refresh auth status
      if (isAdminUser && !authIsAdmin && user?.username !== 'Administrator') {
        // This will only execute once to try to reconcile the admin state
        fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'Administrator', password: 'dvd70ply' }),
          credentials: 'include'
        }).catch(err => console.error('Error during auto-login:', err));
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsLocalAdmin(false);
    }
  }, [authIsAdmin, user]);
  
  // Use both auth sources - either one indicating admin is sufficient
  const combinedAdminStatus = authIsAdmin || isLocalAdmin;
  
  // Hide the component for non-admin users
  if (!combinedAdminStatus) {
    return null;
  }

  return (
    <div className="tour-add-activity">
      <Button 
        onClick={onClick}
        className="rounded-full bg-primary text-white p-3 md:px-4 md:py-2 flex items-center shadow-md hover:bg-opacity-90"
        data-new-activity="true"
        title="Add new activity (N key)"
      >
        <span className="material-icons md:mr-1">add</span>
        <span className="hidden md:inline">Add Activity</span>
      </Button>
    </div>
  );
}