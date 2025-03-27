import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CalendarDays, Bell, Download, User, Menu, HelpCircle } from "lucide-react";
import HelpMenu from "@/components/help-menu";

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
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-medium">Activity Calendar</h1>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" className="text-white hover:bg-[rgba(255,255,255,0.1)]">
                <CalendarDays className="mr-2 h-4 w-4" />
                <span>Today</span>
              </Button>
              <Button variant="ghost" className="text-white hover:bg-[rgba(255,255,255,0.1)] tour-notifications">
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </Button>
              <Button variant="ghost" className="text-white hover:bg-[rgba(255,255,255,0.1)]">
                <Download className="mr-2 h-4 w-4" />
                <span>Import/Export</span>
              </Button>
              <Button variant="ghost" className="text-white hover:bg-[rgba(255,255,255,0.1)]">
                <User className="mr-2 h-4 w-4" />
                <span>Account</span>
              </Button>
              
              <div className="ml-2 text-white">
                <HelpMenu />
              </div>
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
              <h2 className="text-lg font-medium text-primary">Activity Calendar</h2>
            </div>
            <nav className="p-4">
              <ul className="space-y-2">
                <li>
                  <Link href="/">
                    <a className="flex items-center p-2 rounded hover:bg-gray-100">
                      <CalendarDays className="mr-3 h-5 w-5 text-gray-600" />
                      <span>Today</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/">
                    <a className="flex items-center p-2 rounded hover:bg-gray-100">
                      <Bell className="mr-3 h-5 w-5 text-gray-600" />
                      <span>Notifications</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/">
                    <a className="flex items-center p-2 rounded hover:bg-gray-100">
                      <Download className="mr-3 h-5 w-5 text-gray-600" />
                      <span>Import/Export</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/">
                    <a className="flex items-center p-2 rounded hover:bg-gray-100">
                      <User className="mr-3 h-5 w-5 text-gray-600" />
                      <span>Account</span>
                    </a>
                  </Link>
                </li>
                <li className="pt-4 border-t mt-4">
                  <Link href="/">
                    <a className="flex items-center p-2 rounded hover:bg-gray-100">
                      <HelpCircle className="mr-3 h-5 w-5 text-gray-600" />
                      <span>Help & Support</span>
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
