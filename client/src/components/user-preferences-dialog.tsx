import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ViewMode, Region, UserRole } from "@shared/schema";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface UserPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserPreferencesDialog({ open, onOpenChange }: UserPreferencesDialogProps) {
  const { user, isAdmin } = useAuth();
  
  const {
    preferences,
    isLoading,
    isUpdating,
    setViewMode,
    setRegions,
    setTheme,
    setNotificationsEnabled,
    setNotificationLeadTime,
    setCustomSettings,
    setRole,
  } = useUserPreferences();
  
  const [selectedRegions, setSelectedRegions] = useState<Region[]>(
    preferences.defaultRegions || ["italy"]
  );
  
  // Set the appropriate role - if admin logged in, default to "administrator", otherwise "user"
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    isAdmin ? "admin" : "user"
  );
  
  const handleRegionToggle = (region: Region) => {
    const newRegions = selectedRegions.includes(region)
      ? selectedRegions.filter(r => r !== region)
      : [...selectedRegions, region];
    
    setSelectedRegions(newRegions);
    setRegions(newRegions);
  };
  
  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    if (setRole) {
      setRole(role);
    }
  };
  
  const handleSaveAndClose = () => {
    onOpenChange(false);
  };
  
  if (isLoading) {
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>User Preferences</DialogTitle>
          <DialogDescription>
            Customize your activity timeline settings and preferences.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="default-view">Default View</Label>
                <Select 
                  defaultValue={preferences.defaultViewMode || "month"}
                  onValueChange={(value) => setViewMode(value as ViewMode)}
                >
                  <SelectTrigger id="default-view">
                    <SelectValue placeholder="Select default view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timeline">Timeline</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Role selection - only visible for admin users */}
              {isAdmin && (
                <div className="space-y-2 p-3 bg-muted/30 rounded-md border mb-4">
                  <Label className="text-md font-semibold">User Role</Label>
                  <RadioGroup defaultValue={selectedRole} onValueChange={(value) => handleRoleChange(value as UserRole)}>
                    <div className="flex items-center space-x-2 py-2">
                      <RadioGroupItem value="admin" id="role-admin" />
                      <Label htmlFor="role-admin" className="font-medium">Administrator</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="user" id="role-user" />
                      <Label htmlFor="role-user">User (Read-only)</Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground mt-2">
                    Administrator role allows creating, editing, and deleting activities. 
                    User role provides read-only access.
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Active Regions</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="region-italy" 
                      checked={selectedRegions.includes("italy")}
                      onCheckedChange={() => handleRegionToggle("italy")}
                    />
                    <Label htmlFor="region-italy">Italy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="region-europe" 
                      checked={selectedRegions.includes("europe")}
                      onCheckedChange={() => handleRegionToggle("europe")}
                    />
                    <Label htmlFor="region-europe">Europe</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="region-usa" 
                      checked={selectedRegions.includes("usa")}
                      onCheckedChange={() => handleRegionToggle("usa")}
                    />
                    <Label htmlFor="region-usa">USA</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="region-asia" 
                      checked={selectedRegions.includes("asia")}
                      onCheckedChange={() => handleRegionToggle("asia")}
                    />
                    <Label htmlFor="region-asia">Asia</Label>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="display">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select 
                  defaultValue={preferences.theme || "light"}
                  onValueChange={(value) => setTheme(value)}
                >
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-weekends">Show Weekends</Label>
                <Switch 
                  id="show-weekends" 
                  checked={preferences.customSettings?.showWeekends !== false}
                  onCheckedChange={(checked) => 
                    setCustomSettings({ showWeekends: checked })
                  }
                />
              </div>
              
              <div className="flex flex-col space-y-2 pt-2">
                <div className="flex justify-between">
                  <Label>Working Hours</Label>
                  <span className="text-sm text-muted-foreground">
                    {preferences.customSettings?.defaultWorkingHours?.start || "09:00"} - {preferences.customSettings?.defaultWorkingHours?.end || "17:00"}
                  </span>
                </div>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Select 
                      defaultValue={preferences.customSettings?.defaultWorkingHours?.start || "09:00"}
                      onValueChange={(value) => 
                        setCustomSettings({ 
                          defaultWorkingHours: { 
                            ...preferences.customSettings?.defaultWorkingHours,
                            start: value 
                          } 
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, i) => (
                          <SelectItem key={`start-${i}`} value={`${i.toString().padStart(2, '0')}:00`}>
                            {`${i.toString().padStart(2, '0')}:00`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Select 
                      defaultValue={preferences.customSettings?.defaultWorkingHours?.end || "17:00"}
                      onValueChange={(value) => 
                        setCustomSettings({ 
                          defaultWorkingHours: { 
                            ...preferences.customSettings?.defaultWorkingHours,
                            end: value 
                          } 
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="End time" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, i) => (
                          <SelectItem key={`end-${i}`} value={`${i.toString().padStart(2, '0')}:00`}>
                            {`${i.toString().padStart(2, '0')}:00`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="notifications">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                <Switch 
                  id="notifications-enabled" 
                  checked={preferences.notificationsEnabled}
                  onCheckedChange={(checked) => setNotificationsEnabled(checked)}
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="notification-lead-time">Notification Lead Time (days)</Label>
                  <span className="text-sm text-muted-foreground">
                    {preferences.notificationLeadTime || 3} days before
                  </span>
                </div>
                <Slider
                  id="notification-lead-time"
                  disabled={!preferences.notificationsEnabled}
                  min={1}
                  max={14}
                  step={1}
                  defaultValue={[preferences.notificationLeadTime || 3]}
                  onValueChange={(value) => setNotificationLeadTime(value[0])}
                />
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-3">
                <Label>Notification Methods</Label>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="method-app" 
                      checked={preferences.notificationMethods?.includes('app')}
                      onCheckedChange={(checked) => {
                        const methods = [...(preferences.notificationMethods || [])];
                        if (checked && !methods.includes('app')) {
                          methods.push('app');
                        } else if (!checked) {
                          const index = methods.indexOf('app');
                          if (index > -1) methods.splice(index, 1);
                        }
                        if (methods.length === 0) {
                          methods.push('app'); // Always keep at least one method
                        }
                        setCustomSettings({ notificationMethods: methods });
                      }}
                      disabled={!preferences.notificationsEnabled}
                    />
                    <Label htmlFor="method-app" className={!preferences.notificationsEnabled ? "text-muted-foreground" : ""}>
                      App Notifications
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="method-email" 
                      checked={preferences.notificationMethods?.includes('email')}
                      onCheckedChange={(checked) => {
                        const methods = [...(preferences.notificationMethods || [])];
                        if (checked && !methods.includes('email')) {
                          methods.push('email');
                        } else if (!checked) {
                          const index = methods.indexOf('email');
                          if (index > -1) methods.splice(index, 1);
                        }
                        if (methods.length === 0) {
                          methods.push('app'); // Always keep at least one method
                        }
                        setCustomSettings({ notificationMethods: methods });
                      }}
                      disabled={!preferences.notificationsEnabled}
                    />
                    <Label htmlFor="method-email" className={!preferences.notificationsEnabled ? "text-muted-foreground" : ""}>
                      Email Notifications
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="method-sms" 
                      checked={preferences.notificationMethods?.includes('sms')}
                      onCheckedChange={(checked) => {
                        const methods = [...(preferences.notificationMethods || [])];
                        if (checked && !methods.includes('sms')) {
                          methods.push('sms');
                        } else if (!checked) {
                          const index = methods.indexOf('sms');
                          if (index > -1) methods.splice(index, 1);
                        }
                        if (methods.length === 0) {
                          methods.push('app'); // Always keep at least one method
                        }
                        setCustomSettings({ notificationMethods: methods });
                      }}
                      disabled={!preferences.notificationsEnabled}
                    />
                    <Label htmlFor="method-sms" className={!preferences.notificationsEnabled ? "text-muted-foreground" : ""}>
                      SMS Notifications
                    </Label>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />
              
              <div className="space-y-3">
                <Label>Contact Information</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="contact-email" className="text-sm">Email Address</Label>
                  <input
                    id="contact-email"
                    type="email"
                    className="w-full p-2 border rounded-md"
                    placeholder="your.email@example.com"
                    value={preferences.email || ''}
                    onChange={(e) => setCustomSettings({ email: e.target.value })}
                    disabled={!preferences.notificationsEnabled || !preferences.notificationMethods?.includes('email')}
                  />
                  {preferences.notificationMethods?.includes('email') && !preferences.email && (
                    <p className="text-xs text-orange-500">
                      Please add your email address to receive email notifications
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact-phone" className="text-sm">Phone Number</Label>
                  <input
                    id="contact-phone"
                    type="tel"
                    className="w-full p-2 border rounded-md"
                    placeholder="+1234567890"
                    value={preferences.phone || ''}
                    onChange={(e) => setCustomSettings({ phone: e.target.value })}
                    disabled={!preferences.notificationsEnabled || !preferences.notificationMethods?.includes('sms')}
                  />
                  {preferences.notificationMethods?.includes('sms') && !preferences.phone && (
                    <p className="text-xs text-orange-500">
                      Please add your phone number to receive SMS notifications
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enter with country code (e.g., +1 for US, +39 for Italy)
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button 
            onClick={handleSaveAndClose} 
            disabled={isUpdating}
          >
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}