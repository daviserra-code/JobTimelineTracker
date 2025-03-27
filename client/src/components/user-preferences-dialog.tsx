import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ViewMode, Region } from "@shared/schema";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { Separator } from "@/components/ui/separator";

interface UserPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserPreferencesDialog({ open, onOpenChange }: UserPreferencesDialogProps) {
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
  } = useUserPreferences();
  
  const [selectedRegions, setSelectedRegions] = useState<Region[]>(
    preferences.defaultRegions || ["italy"]
  );
  
  const handleRegionToggle = (region: Region) => {
    const newRegions = selectedRegions.includes(region)
      ? selectedRegions.filter(r => r !== region)
      : [...selectedRegions, region];
    
    setSelectedRegions(newRegions);
    setRegions(newRegions);
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