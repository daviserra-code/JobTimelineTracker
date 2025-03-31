import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CalendarDays, Bell, Download, User, Menu, HelpCircle, Settings, LogIn, LogOut } from "lucide-react";
import HelpMenu from "@/components/help-menu";
import UserPreferencesDialog from "@/components/user-preferences-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getTodayInfo } from "@/lib/dates";

export default function Header() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPreferencesDialogOpen, setIsPreferencesDialogOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  // Logout mutation
  const { mutate: logout, isPending: isLoggingOut } = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      // Invalidate user data cache
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      // Redirect to home
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
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
              <h1 className="text-xl font-medium">Activity Calendar of Davide Serra</h1>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-[rgba(255,255,255,0.1)]"
                onClick={() => {
                  // Get today's information
                  const today = getTodayInfo();
                  
                  // First, let's directly update the state in our component
                  // This is the key part - we need to set the view mode directly
                  // in addition to using URL parameters
                  window.dispatchEvent(new CustomEvent('goToToday', {
                    detail: {
                      viewMode: 'week',
                      year: today.year,
                      month: today.month,
                      week: today.week,
                      day: today.day,
                      highlight: true
                    }
                  }));
                  
                  // Use URLSearchParams to create the query string for navigation
                  const params = new URLSearchParams();
                  params.set('view', 'week');
                  params.set('year', today.year.toString());
                  params.set('month', today.month.toString());
                  params.set('week', today.week.toString());
                  params.set('day', today.day.toString());
                  params.set('today', 'true'); // Flag to indicate we want to highlight today
                  
                  // Navigate to home with query parameters
                  setLocation(`/?${params.toString()}`);
                }}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                <span>Today</span>
              </Button>
              <Button variant="ghost" className="text-white hover:bg-[rgba(255,255,255,0.1)] tour-notifications">
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </Button>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-[rgba(255,255,255,0.1)]"
                onClick={() => {
                  // Dispatch a custom event to trigger the import/export dialog
                  window.dispatchEvent(new CustomEvent('openImportExport'));
                }}
                disabled={!isAdmin} // Only enabled for admin users
              >
                <Download className="mr-2 h-4 w-4" />
                <span>Import/Export</span>
              </Button>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-[rgba(255,255,255,0.1)]"
                asChild
              >
                <Link href="/account">
                  <User className="mr-2 h-4 w-4" />
                  <span>Account</span>
                </Link>
              </Button>
              
              <Button 
                variant="ghost" 
                className="text-white hover:bg-[rgba(255,255,255,0.1)]"
                onClick={() => setIsPreferencesDialogOpen(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Preferences</span>
              </Button>
              
              <div className="ml-2 text-white">
                <HelpMenu />
              </div>
              
              {isAdmin ? (
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-[rgba(255,255,255,0.1)]"
                  onClick={() => logout()}
                  disabled={isLoggingOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-[rgba(255,255,255,0.1)]"
                  asChild
                >
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    <span>Admin Login</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* User Preferences Dialog */}
      <UserPreferencesDialog 
        open={isPreferencesDialogOpen} 
        onOpenChange={setIsPreferencesDialogOpen} 
      />
      
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
              <h2 className="text-lg font-medium text-primary">Activity Calendar of Davide Serra</h2>
            </div>
            <nav className="p-4">
              <ul className="space-y-2">
                <li>
                  <button 
                    className="flex items-center p-2 rounded hover:bg-gray-100 w-full text-left"
                    onClick={() => {
                      // Close the drawer
                      setIsDrawerOpen(false);
                      
                      // Get today's information
                      const today = getTodayInfo();
                      
                      // First, let's directly update the state in our component
                      window.dispatchEvent(new CustomEvent('goToToday', {
                        detail: {
                          viewMode: 'week',
                          year: today.year,
                          month: today.month,
                          week: today.week,
                          day: today.day,
                          highlight: true
                        }
                      }));
                      
                      // Use URLSearchParams to create the query string for navigation
                      const params = new URLSearchParams();
                      params.set('view', 'week');
                      params.set('year', today.year.toString());
                      params.set('month', today.month.toString());
                      params.set('week', today.week.toString());
                      params.set('day', today.day.toString());
                      params.set('today', 'true'); // Flag to indicate we want to highlight today
                      
                      // Navigate to home with query parameters
                      setLocation(`/?${params.toString()}`);
                    }}
                  >
                    <CalendarDays className="mr-3 h-5 w-5 text-gray-600" />
                    <span>Today</span>
                  </button>
                </li>
                <li>
                  <button className="flex items-center p-2 rounded hover:bg-gray-100 w-full text-left">
                    <Bell className="mr-3 h-5 w-5 text-gray-600" />
                    <span>Notifications</span>
                  </button>
                </li>
                <li>
                  <button 
                    className="flex items-center p-2 rounded hover:bg-gray-100 w-full text-left"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      window.dispatchEvent(new CustomEvent('openImportExport'));
                    }}
                    disabled={!isAdmin} // Only enabled for admin users
                  >
                    <Download className={`mr-3 h-5 w-5 ${isAdmin ? 'text-gray-600' : 'text-gray-300'}`} />
                    <span className={isAdmin ? '' : 'text-gray-300'}>Import/Export</span>
                  </button>
                </li>
                <li>
                  <Link href="/account">
                    <div className="flex items-center p-2 rounded hover:bg-gray-100">
                      <User className="mr-3 h-5 w-5 text-gray-600" />
                      <span>Account</span>
                    </div>
                  </Link>
                </li>
                <li>
                  <button 
                    className="flex items-center p-2 rounded hover:bg-gray-100 w-full text-left"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setIsPreferencesDialogOpen(true);
                    }}
                  >
                    <Settings className="mr-3 h-5 w-5 text-gray-600" />
                    <span>Preferences</span>
                  </button>
                </li>
                <li className="pt-4 border-t mt-4">
                  <button className="flex items-center p-2 rounded hover:bg-gray-100 w-full text-left">
                    <HelpCircle className="mr-3 h-5 w-5 text-gray-600" />
                    <span>Help & Support</span>
                  </button>
                </li>
                
                <li className="mt-4">
                  {isAdmin ? (
                    <button 
                      className="flex items-center p-2 rounded hover:bg-gray-100 w-full text-left"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        logout();
                      }}
                      disabled={isLoggingOut}
                    >
                      <LogOut className="mr-3 h-5 w-5 text-gray-600" />
                      <span>Logout</span>
                    </button>
                  ) : (
                    <Link href="/login">
                      <div className="flex items-center p-2 rounded hover:bg-gray-100">
                        <LogIn className="mr-3 h-5 w-5 text-gray-600" />
                        <span>Admin Login</span>
                      </div>
                    </Link>
                  )}
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
