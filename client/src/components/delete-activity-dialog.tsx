import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Activity } from "@shared/schema";
import { useActivities } from "@/hooks/use-activities";
import { useAuth } from "@/hooks/use-auth";
import { useAdminToken } from "@/hooks/use-admin-token";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { forceRefreshCycle, removeDeletedActivityFromCache } from "@/lib/refresh-utils";
import { queryClient } from "@/lib/queryClient";

interface DeleteActivityDialogProps {
  activity: Activity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteActivityDialog({
  activity,
  open,
  onOpenChange,
}: DeleteActivityDialogProps) {
  const { deleteActivity } = useActivities();
  const { isAdmin, user } = useAuth();
  const { hasAdminToken, setAdminToken, getAdminHeaders } = useAdminToken();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  const handleDelete = async () => {
    if (!activity) return;
    
    // First check if user has admin privileges
    const hasLocalAdminToken = hasAdminToken();
    
    if (!isAdmin && !hasLocalAdminToken) {
      toast({
        title: "Permission Denied",
        description: "You need administrator privileges to delete activities.",
        variant: "destructive"
      });
      
      // Offer the option to login as admin
      navigate("/login");
      onOpenChange(false);
      return;
    }
    
    // If user is Administrator but token not set, set it now
    if (user?.username === 'Administrator' && !hasLocalAdminToken) {
      console.log('Setting admin token for Administrator user');
      setAdminToken();
    }
    
    try {
      // IMPORTANT: Pre-emptively remove from cache before the API call
      // This ensures the UI updates immediately even if there are network delays
      removeDeletedActivityFromCache(activity.id);
      
      // Directly delete the activity using fetch instead of depending on the hook
      // This gives us more control over headers and error handling
      const timestamp = Date.now();
      const adminHeaders = getAdminHeaders();
      
      console.log('Attempting direct deletion with admin headers');
      const response = await fetch(`/api/admin-delete-activity-dvd70ply/${activity.id}?t=${timestamp}`, {
        credentials: "include",
        headers: adminHeaders
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete activity. Status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Delete activity successful:', result);
      
      toast({
        title: "Activity Deleted",
        description: `"${activity.title}" has been successfully deleted.`,
      });
      
      // Multi-stage refresh process with aggressive caching strategy:
      // 1. Remove from cache
      removeDeletedActivityFromCache(activity.id);
      
      // 2. Force invalidation of all activities queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
          return typeof queryKey === 'string' && queryKey.includes('/api/activities');
        },
      });
      
      // 3. Force multiple refetches of all activities queries
      queryClient.refetchQueries({ queryKey: ['/api/activities'] });
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/activities'] });
      }, 200);
      
      // 4. Use the refresh utility to trigger event-based refreshes
      forceRefreshCycle('delete', activity.id, 300);
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting activity:", error);
      
      // Special retry for Administrator users
      if (user?.username === 'Administrator') {
        try {
          console.log('Making second delete attempt with different method');
          setAdminToken(); // Refresh admin token
          
          // Pre-emptively remove from cache
          removeDeletedActivityFromCache(activity.id);
          
          // Attempt deletion with direct DELETE method
          const timestamp = Date.now();
          const adminHeaders = getAdminHeaders();
          
          const deleteResponse = await fetch(`/api/admin-secret-dvd70ply/activities/${activity.id}?t=${timestamp}`, {
            method: "DELETE",
            headers: adminHeaders,
            credentials: "include"
          });
          
          if (deleteResponse.ok) {
            console.log('Second delete attempt succeeded');
            
            // Extra aggressive refresh cycle with multiple strategies
            removeDeletedActivityFromCache(activity.id);
            queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
            queryClient.refetchQueries({ queryKey: ['/api/activities'] });
            
            // Close dialog
            onOpenChange(false);
            
            toast({
              title: "Activity Deleted",
              description: `"${activity.title}" has been successfully deleted.`,
            });
            
            return;
          } else {
            console.error("Second delete attempt failed with status:", deleteResponse.status);
          }
        } catch (retryError) {
          console.error("Second delete attempt failed:", retryError);
        }
        
        // Final fallback for Administrator
        try {
          console.log('Making final delete attempt with standard API');
          // Regular deletion attempt as a last resort
          await deleteActivity(activity.id);
          
          // Close dialog on success
          onOpenChange(false);
          
          toast({
            title: "Activity Deleted",
            description: `"${activity.title}" has been successfully deleted.`,
          });
          
          return;
        } catch (finalError) {
          console.error("Final delete attempt failed:", finalError);
        }
      }
      
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the activity. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Activity</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{activity?.title}"?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}