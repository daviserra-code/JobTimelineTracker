import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { UserRole } from "@shared/schema";
import { Spinner } from "@/components/ui/spinner";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

// Simple animation for the cards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3
    }
  }
};

export default function AccountPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || "user");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  interface UserPreferences {
    id: number;
    userId: number;
    defaultViewMode: string;
    defaultRegions: string[];
    theme: string;
    notificationsEnabled: boolean;
    notificationLeadTime: number;
    customSettings?: Record<string, any>;
    updatedAt: string;
  }

  // Fetch user preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery<UserPreferences>({
    queryKey: ['/api/preferences'],
    enabled: !!user
  });
  
  // Update role mutation
  const { mutate: updateRole, isPending: updatingRole } = useMutation({
    mutationFn: async (role: UserRole) => {
      const response = await fetch('/api/users/role', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update role');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Role updated successfully",
        description: "Your access level has been changed",
      });
      // Invalidate user data
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: () => {
      toast({
        title: "Failed to update role",
        description: "There was an error changing your access level",
        variant: "destructive",
      });
    },
  });
  
  // Update notifications preferences
  const { mutate: updateNotifications, isPending: updatingNotifications } = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationsEnabled: enabled }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences updated",
        description: "Your notification settings have been updated",
      });
      // Invalidate preferences
      queryClient.invalidateQueries({ queryKey: ['/api/preferences'] });
    },
    onError: () => {
      toast({
        title: "Failed to update preferences",
        description: "There was an error updating your notification settings",
        variant: "destructive",
      });
    },
  });
  
  // Update state when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setNotificationsEnabled(preferences.notificationsEnabled);
    }
  }, [preferences]);
  
  // Update state when user data is loaded
  useEffect(() => {
    if (user?.role) {
      setSelectedRole(user.role);
    }
  }, [user]);
  
  const handleRoleChange = (value: string) => {
    setSelectedRole(value as UserRole);
  };
  
  const handleSaveRole = () => {
    updateRole(selectedRole);
  };
  
  const handleNotificationsChange = (checked: boolean) => {
    setNotificationsEnabled(checked);
    updateNotifications(checked);
  };
  
  if (authLoading || preferencesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Role Settings</CardTitle>
              <CardDescription>
                Control your access level and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedRole} onValueChange={handleRoleChange}>
                <div className="flex items-center space-x-2 mb-4">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin" className="font-medium">Administrator</Label>
                  <span className="ml-2 text-sm text-muted-foreground">
                    Full privileges to create, edit, and delete activities
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user" id="user" />
                  <Label htmlFor="user" className="font-medium">User</Label>
                  <span className="ml-2 text-sm text-muted-foreground">
                    Read-only access to view activities
                  </span>
                </div>
              </RadioGroup>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveRole} disabled={updatingRole}>
                {updatingRole ? <Spinner className="mr-2" size="sm" /> : null}
                Save Role
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage how you receive notifications about activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Activity Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for upcoming activities
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationsChange}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}