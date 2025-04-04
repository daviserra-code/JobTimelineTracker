import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Constants for admin auth - directly included to avoid dependency on hooks
const ADMIN_TOKEN_KEY = 'admin_token_dvd70ply';
const ADMIN_TOKEN_VALUE = 'Administrator-dvd70ply';

interface AddActivityButtonProps {
  onClick: () => void;
}

export default function AddActivityButton({ onClick }: AddActivityButtonProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check admin status directly from localStorage on mount and periodically
  useEffect(() => {
    const checkAdminStatus = () => {
      try {
        const isAdminUser = localStorage.getItem(ADMIN_TOKEN_KEY) === ADMIN_TOKEN_VALUE;
        setIsAdmin(isAdminUser);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      }
    };
    
    // Check immediately
    checkAdminStatus();
    
    // Set up polling to check every 2 seconds
    const interval = setInterval(checkAdminStatus, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Hide the component for non-admin users
  if (!isAdmin) {
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