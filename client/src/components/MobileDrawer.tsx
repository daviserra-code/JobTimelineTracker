import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';

type MobileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

const MobileDrawer = ({ isOpen, onClose }: MobileDrawerProps) => {
  const [location] = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);
  
  // Handle clicks outside drawer to close it
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);
  
  // Handle route changes
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location, isOpen, onClose]);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-20">
      <div 
        ref={drawerRef}
        className={`bg-white h-full w-64 shadow-lg transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium text-primary">JobTrack</h2>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link href="/">
                <a className={`flex items-center p-2 rounded ${location === '/' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}>
                  <span className="material-icons mr-3 text-gray-600">today</span>
                  <span>Today</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/notifications">
                <a className={`flex items-center p-2 rounded ${location === '/notifications' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}>
                  <span className="material-icons mr-3 text-gray-600">notifications</span>
                  <span>Notifications</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/import-export">
                <a className={`flex items-center p-2 rounded ${location === '/import-export' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}>
                  <span className="material-icons mr-3 text-gray-600">download</span>
                  <span>Import/Export</span>
                </a>
              </Link>
            </li>
            <li className="pt-4 border-t mt-4">
              <Link href="/settings">
                <a className={`flex items-center p-2 rounded ${location === '/settings' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}>
                  <span className="material-icons mr-3 text-gray-600">settings</span>
                  <span>Settings</span>
                </a>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default MobileDrawer;
