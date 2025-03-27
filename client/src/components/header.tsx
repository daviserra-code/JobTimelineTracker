import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };
  
  return (
    <>
      <header className="bg-primary text-white shadow-md z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={toggleDrawer} className="mr-2 md:hidden">
                <span className="material-icons">menu</span>
              </button>
              <h1 className="text-xl font-medium">JobTrack</h1>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" className="text-white hover:bg-[rgba(255,255,255,0.1)]">
                <span className="material-icons mr-1">today</span>
                <span>Today</span>
              </Button>
              <Button variant="ghost" className="text-white hover:bg-[rgba(255,255,255,0.1)]">
                <span className="material-icons mr-1">notifications</span>
                <span>Notifications</span>
              </Button>
              <Button variant="ghost" className="text-white hover:bg-[rgba(255,255,255,0.1)]">
                <span className="material-icons mr-1">download</span>
                <span>Import/Export</span>
              </Button>
              <Button variant="ghost" className="text-white hover:bg-[rgba(255,255,255,0.1)]">
                <span className="material-icons mr-1">account_circle</span>
                <span>Account</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Drawer */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div 
            className="bg-white h-full w-64 shadow-lg transform transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium text-primary">JobTrack</h2>
            </div>
            <nav className="p-4">
              <ul className="space-y-2">
                <li>
                  <Link href="/">
                    <a className="flex items-center p-2 rounded hover:bg-gray-100">
                      <span className="material-icons mr-3 text-gray-600">today</span>
                      <span>Today</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/">
                    <a className="flex items-center p-2 rounded hover:bg-gray-100">
                      <span className="material-icons mr-3 text-gray-600">notifications</span>
                      <span>Notifications</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/">
                    <a className="flex items-center p-2 rounded hover:bg-gray-100">
                      <span className="material-icons mr-3 text-gray-600">download</span>
                      <span>Import/Export</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/">
                    <a className="flex items-center p-2 rounded hover:bg-gray-100">
                      <span className="material-icons mr-3 text-gray-600">account_circle</span>
                      <span>Account</span>
                    </a>
                  </Link>
                </li>
                <li className="pt-4 border-t mt-4">
                  <Link href="/">
                    <a className="flex items-center p-2 rounded hover:bg-gray-100">
                      <span className="material-icons mr-3 text-gray-600">settings</span>
                      <span>Settings</span>
                    </a>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
