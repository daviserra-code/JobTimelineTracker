import React from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

type AppBarProps = {
  onMenuToggle: () => void;
};

const AppBar = ({ onMenuToggle }: AppBarProps) => {
  const [location] = useLocation();
  
  // Query for unread notifications count
  const { data: unreadNotifications } = useQuery({
    queryKey: ['/api/notifications/unread?userId=1'],
    refetchInterval: 60000 // Refetch every minute
  });
  
  const hasNotifications = unreadNotifications && unreadNotifications.length > 0;

  return (
    <header className="bg-primary text-white shadow-md z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button 
              onClick={onMenuToggle}
              className="mr-2 md:hidden"
              aria-label="Toggle menu"
            >
              <span className="material-icons">menu</span>
            </button>
            <Link href="/">
              <a className="text-xl font-medium">JobTrack</a>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/">
              <a className={`flex items-center px-3 py-2 rounded hover:bg-[rgba(255,255,255,0.1)] transition-colors ${location === '/' ? 'bg-[rgba(255,255,255,0.1)]' : ''}`}>
                <span className="material-icons mr-1">today</span>
                <span>Today</span>
              </a>
            </Link>
            <Link href="/notifications">
              <a className={`flex items-center px-3 py-2 rounded hover:bg-[rgba(255,255,255,0.1)] transition-colors ${location === '/notifications' ? 'bg-[rgba(255,255,255,0.1)]' : ''}`}>
                <span className="material-icons mr-1">notifications</span>
                <span>Notifications</span>
                {hasNotifications && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </a>
            </Link>
            <Link href="/import-export">
              <a className={`flex items-center px-3 py-2 rounded hover:bg-[rgba(255,255,255,0.1)] transition-colors ${location === '/import-export' ? 'bg-[rgba(255,255,255,0.1)]' : ''}`}>
                <span className="material-icons mr-1">download</span>
                <span>Import/Export</span>
              </a>
            </Link>
            <Link href="/settings">
              <a className={`flex items-center px-3 py-2 rounded hover:bg-[rgba(255,255,255,0.1)] transition-colors ${location === '/settings' ? 'bg-[rgba(255,255,255,0.1)]' : ''}`}>
                <span className="material-icons mr-1">settings</span>
                <span>Settings</span>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppBar;
