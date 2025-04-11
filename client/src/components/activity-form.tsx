import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format, parse } from "date-fns";
import { ACTIVITY_TYPES, ACTIVITY_STATUSES } from "@/lib/constants";
import { InsertActivity, ActivityType, ActivityStatus } from "@shared/schema";
import { useActivities } from "@/hooks/use-activities";
import { useAuth } from "@/hooks/use-auth";
import { useAdminToken } from "@/hooks/use-admin-token";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Extend the activity schema with form validation
const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  description: z.string().optional(),
  startDate: z.date({ required_error: "Start date is required" }),
  startTime: z.string().optional(),
  endDate: z.date({ required_error: "End date is required" }),
  endTime: z.string().optional(),
  type: z.enum(["project", "meeting", "training", "holiday"] as const),
  status: z.enum(["confirmed", "tentative", "hypothetical"] as const),
  category: z.string().optional(),
  location: z.string().optional(),
  userId: z.number().optional(),
}).refine(data => {
  const start = data.startTime 
    ? new Date(`${format(data.startDate, 'yyyy-MM-dd')}T${data.startTime}`)
    : data.startDate;
  
  const end = data.endTime
    ? new Date(`${format(data.endDate, 'yyyy-MM-dd')}T${data.endTime}`)
    : data.endDate;
    
  return end >= start;
}, {
  message: "End date/time must be after start date/time",
  path: ["endDate"]
});

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: InsertActivity;
  actionType: "create" | "edit";
}

export default function ActivityForm({ open, onOpenChange, initialData, actionType }: ActivityFormProps) {
  const { createActivity, updateActivity } = useActivities();
  const { user, isAdmin } = useAuth();
  const { setAdminToken, hasAdminToken, getAdminHeaders } = useAdminToken();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      startDate: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
      startTime: initialData?.startDate ? format(new Date(initialData.startDate), "HH:mm") : "",
      endDate: initialData?.endDate ? new Date(initialData.endDate) : new Date(),
      endTime: initialData?.endDate ? format(new Date(initialData.endDate), "HH:mm") : "",
      type: (initialData?.type as ActivityType) || "meeting",
      status: (initialData?.status as ActivityStatus) || "confirmed",
      category: initialData?.category || "",
      location: initialData?.location || "",
      userId: initialData?.userId || 1, // Default to user ID 1 if not provided
    },
  });
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // If user is Administrator but doesn't have the token set, ensure it's set
    if (user?.username === 'Administrator' && !hasAdminToken()) {
      console.log('Setting admin token for Administrator user in activity form');
      setAdminToken();
    }
    
    // Create full datetime objects by combining date and time
    const startDateTime = values.startTime 
      ? new Date(`${format(values.startDate, 'yyyy-MM-dd')}T${values.startTime}:00`) 
      : values.startDate;
    
    const endDateTime = values.endTime 
      ? new Date(`${format(values.endDate, 'yyyy-MM-dd')}T${values.endTime}:00`) 
      : values.endDate;

    // Prepare activity data with proper date objects
    const activityData = {
      ...values,
      startDate: startDateTime,
      endDate: endDateTime,
      // Exclude time fields as they are now combined into dates
      startTime: undefined,
      endTime: undefined
    };
    
    // Check if user has admin privileges
    const hasAdminPrivileges = isAdmin || hasAdminToken();
    
    try {
      // Get all admin headers for authenticated requests
      const adminHeaders = getAdminHeaders();
      const timestamp = Date.now();
      
      if (actionType === "create") {
        console.log('Creating new activity with admin privileges:', hasAdminPrivileges);
        
        if (hasAdminPrivileges) {
          // Try direct admin endpoint with auth headers first
          try {
            const response = await fetch(`/api/admin-secret-dvd70ply/activities?t=${timestamp}`, {
              method: "POST",
              headers: adminHeaders,
              credentials: "include",
              body: JSON.stringify(activityData)
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('✅ Created activity with admin endpoint:', result);
              toast({
                title: "Activity Created",
                description: "New activity has been successfully created.",
              });
              
              // Refresh the activities list
              queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
              queryClient.refetchQueries({ queryKey: ['/api/activities'] });
              
              // Dispatch custom event for UI refresh
              window.dispatchEvent(new CustomEvent('activity-changed', { 
                detail: { 
                  operation: 'create', 
                  timestamp: timestamp,
                  isoTimestamp: new Date(timestamp).toISOString()
                } 
              }));
              
              // Close dialog
              onOpenChange(false);
              return;
            }
          } catch (directError) {
            console.error('Direct admin create failed:', directError);
            // Continue to fallback method
          }
        }
        
        // Standard method as fallback
        await createActivity(activityData);
        
        // Dispatch our custom event to make sure UI refreshes
        window.dispatchEvent(new CustomEvent('activity-changed', { 
          detail: { 
            operation: 'create', 
            timestamp: timestamp,
            isoTimestamp: new Date(timestamp).toISOString()
          } 
        }));
        console.log('🆕 Created new activity and triggered refresh');
      } else if (actionType === "edit" && initialData) {
        // For editing, we need to get the ID from the initialData
        const activityId = (initialData as any).id;
        
        if (activityId) {
          console.log('Updating activity with ID:', activityId, 'Admin privileges:', hasAdminPrivileges);
          
          if (hasAdminPrivileges) {
            // Try direct admin endpoint with auth headers first
            try {
              const response = await fetch(`/api/admin-secret-dvd70ply/activities/${activityId}?t=${timestamp}`, {
                method: "PUT",
                headers: adminHeaders,
                credentials: "include",
                body: JSON.stringify(activityData)
              });
              
              if (response.ok) {
                const result = await response.json();
                console.log('✅ Updated activity with admin endpoint:', result);
                toast({
                  title: "Activity Updated",
                  description: "Activity has been successfully updated.",
                });
                
                // Refresh the activities list
                queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
                queryClient.refetchQueries({ queryKey: ['/api/activities'] });
                
                // Dispatch custom event for UI refresh
                window.dispatchEvent(new CustomEvent('activity-changed', { 
                  detail: { 
                    operation: 'update', 
                    timestamp: timestamp,
                    isoTimestamp: new Date(timestamp).toISOString()
                  } 
                }));
                
                // Close dialog
                onOpenChange(false);
                return;
              }
            } catch (directError) {
              console.error('Direct admin update failed:', directError);
              // Continue to fallback method
            }
          }
          
          // Standard method as fallback
          await updateActivity({ id: activityId, activity: activityData });
          
          // Dispatch our custom event to make sure UI refreshes
          window.dispatchEvent(new CustomEvent('activity-changed', { 
            detail: { 
              operation: 'update', 
              timestamp: timestamp,
              isoTimestamp: new Date(timestamp).toISOString()
            } 
          }));
          console.log('✏️ Updated activity and triggered refresh');
        }
      }
      
      // Close dialog on success
      onOpenChange(false);
    } catch (error) {
      console.error(`Error ${actionType === "create" ? "creating" : "updating"} activity:`, error);
      
      // Provide user feedback
      toast({
        title: `Failed to ${actionType === "create" ? "create" : "update"} activity`,
        description: `There was an error processing your request. Please try again.`,
        variant: "destructive"
      });
      
      // Special retry for Administrator users with refreshed token
      if (user?.username === 'Administrator') {
        console.log('Making another attempt with refreshed admin token');
        setAdminToken();
        
        // Try again with standard methods
        try {
          if (actionType === "create") {
            await createActivity(activityData);
          } else if (actionType === "edit" && initialData) {
            const activityId = (initialData as any).id;
            if (activityId) {
              await updateActivity({ id: activityId, activity: activityData });
            }
          }
          
          // Dispatch our custom event to make sure UI refreshes
          window.dispatchEvent(new CustomEvent('activity-changed', { 
            detail: { 
              operation: actionType === "create" ? 'create' : 'update', 
              timestamp: Date.now(),
              isoTimestamp: new Date().toISOString()
            } 
          }));
          console.log('🔄 Retry succeeded and triggered refresh');
          
          // Success message
          toast({
            title: `Activity ${actionType === "create" ? "Created" : "Updated"}`,
            description: `Your activity has been successfully ${actionType === "create" ? "created" : "updated"}.`,
          });
          
          // Close dialog on success
          onOpenChange(false);
          return; // Exit early if retry is successful
        } catch (retryError) {
          console.error(`Retry attempt failed:`, retryError);
          
          // Final error message
          toast({
            title: `Failed to ${actionType === "create" ? "create" : "update"} activity`,
            description: `Multiple attempts failed. Please try again later.`,
            variant: "destructive"
          });
        }
      }
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{actionType === "create" ? "Add New Activity" : "Edit Activity"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter activity title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter activity description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-1/2 pr-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="w-full"
                            value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : null;
                              if (date) {
                                field.onChange(date);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-1/2 pl-2">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            className="w-full"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-1/2 pr-2">
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="w-full"
                            value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : null;
                              if (date) {
                                field.onChange(date);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-1/2 pl-2">
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            className="w-full"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select activity type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ACTIVITY_TYPES).map(([type, { label, color }]) => (
                          <SelectItem key={type} value={type} className="flex items-center">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
                              <span>{label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select activity status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ACTIVITY_STATUSES).map(([status, { label, color }]) => (
                          <SelectItem key={status} value={status} className="flex items-center">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
                              <span>{label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter activity category" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter activity location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
