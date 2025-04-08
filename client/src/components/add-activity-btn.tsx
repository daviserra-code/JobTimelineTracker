import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

// Constants for admin check - hardcoded for reliability
const ADMIN_TOKEN_KEY = 'admin_token_dvd70ply';
const ADMIN_TOKEN_VALUE = 'Administrator-dvd70ply';
const ADMIN_KEY = 'dvd70ply'; // Secret key used for direct verification

interface AddActivityButtonProps {
  onClick: () => void;
}

export default function AddActivityBtn({ onClick }: AddActivityButtonProps) {
  // Directly check localStorage on each render - no state or hooks for simplicity
  // This makes the component more resilient to state updates and async issues
  let isAdmin = false;
  
  try {
    // Method 1: Check localStorage token
    if (localStorage.getItem(ADMIN_TOKEN_KEY) === ADMIN_TOKEN_VALUE) {
      isAdmin = true;
    }
    
    // Method 2: Check URL for admin key (for deployed environments)
    if (window.location.href.includes(ADMIN_KEY)) {
      isAdmin = true;
      // Also set localStorage for future use
      localStorage.setItem(ADMIN_TOKEN_KEY, ADMIN_TOKEN_VALUE);
      localStorage.setItem('admin_username', 'Administrator');
    }
    
    // Method 3: Look for a specially named cookie (fallback)
    if (document.cookie.includes('admin_auth_dvd70ply=true')) {
      isAdmin = true;
    }
  } catch (err) {
    console.error('Error checking admin status:', err);
  }
  
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