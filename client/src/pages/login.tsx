import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Login mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      
      if (!response.ok) {
        // Try to extract error message from response
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || "Authentication failed");
        } catch (e) {
          // If we can't parse the JSON, use status text
          throw new Error(response.statusText || "Authentication failed");
        }
      }
      
      return await response.json();
    },
    onSuccess: (userData) => {
      // On successful login, invalidate the current user data cache
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      
      // Show role-specific success message
      toast({
        title: "Login successful",
        description: `You are now logged in as: ${userData.username} (${userData.role})`,
      });
      
      // Redirect to the homepage
      setLocation("/");
    },
    onError: (error) => {
      console.error("Login error:", error);
      
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please check your username and password.",
        variant: "destructive",
      });
      
      // Clear password field on error
      setPassword("");
    },
  });

  // Get the direct admin login method from our hook
  const { loginAsAdmin } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }
    
    // If username is Administrator, use our special direct login method
    // This will work in deployed environments where cookies might not persist
    if (username.toLowerCase() === 'administrator') {
      try {
        const success = await loginAsAdmin(password);
        if (success) {
          // On success, redirect to home
          setLocation('/');
        }
      } catch (err) {
        console.error('Error in direct admin login:', err);
        
        // Fallback to regular login
        mutate({ username, password });
      }
    } else {
      // For non-admin users, use regular login
      mutate({ username, password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-muted/50 to-muted">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center rounded-lg overflow-hidden shadow-xl"
      >
        {/* Left side - Form */}
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Administrator Login</CardTitle>
            <CardDescription>
              Please enter your credentials to access the administrator dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">User ID</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Administrator"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isPending}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <Spinner className="mr-2" size="sm" /> : null}
                Login
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <Button variant="outline" onClick={() => setLocation("/")} disabled={isPending}>
              Continue as User (Read-only)
            </Button>
          </CardFooter>
        </Card>
        
        {/* Right side - App description */}
        <div className="hidden md:block bg-primary p-8 text-white rounded-r-lg">
          <h2 className="text-3xl font-bold mb-6">Activity Calendar of Davide Serra</h2>
          <p className="text-lg mb-4">
            A comprehensive timeline-based calendar application for managing and visualizing professional activities.
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center">
              <span className="mr-2">✓</span> Multiple view modes (Month, Week, Day)
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span> Role-based access control
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span> Activity management and tracking
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span> Regional holiday support
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span> Timeline spanning from 2025 to 2030
            </li>
          </ul>
          <div className="bg-white/10 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Administrator Access</h3>
            <p className="text-sm opacity-90">
              Administrators have full privileges to create, edit, and delete activities. 
              User mode provides read-only access for viewing the calendar.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}