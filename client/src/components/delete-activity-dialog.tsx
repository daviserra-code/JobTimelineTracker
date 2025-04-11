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
  const { hasAdminToken, setAdminToken } = useAdminToken();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  const handleDelete = async () => {
    if (!activity) return;
    
    // Use multiple checks to determine if user is admin
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
    
    // If user appears to be admin but doesn't have the token, ensure the token is set
    if (isAdmin && !hasLocalAdminToken && user?.username === 'Administrator') {
      console.log('Setting admin token for Administrator user');
      setAdminToken();
    }
    
    try {
      // Proceed with deletion if admin
      await deleteActivity(activity.id);
      
      toast({
        title: "Activity Deleted",
        description: `"${activity.title}" has been successfully deleted.`,
      });
      
      // Manually dispatch our custom event with detailed information to ensure the UI refreshes
      const timestamp = Date.now();
      const isoTimestamp = new Date(timestamp).toISOString();
      
      window.dispatchEvent(new CustomEvent('activity-changed', {
        detail: {
          operation: 'delete',
          activityId: activity.id,
          timestamp: timestamp,
          isoTimestamp: isoTimestamp
        }
      }));
      
      // Dispatch a second event after a short delay to ensure components pick up the change
      setTimeout(() => {
        const secondTimestamp = Date.now();
        console.log(`🔄 Sending second refresh event at ${new Date(secondTimestamp).toISOString()}`);
        
        window.dispatchEvent(new CustomEvent('activity-changed', {
          detail: {
            operation: 'delete-confirmation',
            activityId: activity.id,
            timestamp: secondTimestamp,
            isoTimestamp: new Date(secondTimestamp).toISOString()
          }
        }));
      }, 300);
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting activity:", error);
      
      // If error occurs but user is Administrator, try refreshing the admin token and continue
      if (user?.username === 'Administrator') {
        console.log('Setting admin token after delete error');
        setAdminToken();
        
        // Try deletion again but with a basic success message to avoid showing another error
        try {
          await deleteActivity(activity.id);
          
          // Manually dispatch our custom event with detailed information to ensure the UI refreshes (for retry case)
          const retryTimestamp = Date.now();
          const retryIsoTimestamp = new Date(retryTimestamp).toISOString();
          console.log(`🔄 Sending delete retry event at ${retryIsoTimestamp}`);
          
          window.dispatchEvent(new CustomEvent('activity-changed', {
            detail: {
              operation: 'delete-retry',
              activityId: activity.id,
              timestamp: retryTimestamp,
              isoTimestamp: retryIsoTimestamp
            }
          }));
          
          // Dispatch a second event after a short delay for retry case
          setTimeout(() => {
            const secondRetryTimestamp = Date.now();
            console.log(`🔄 Sending second retry refresh event at ${new Date(secondRetryTimestamp).toISOString()}`);
            
            window.dispatchEvent(new CustomEvent('activity-changed', {
              detail: {
                operation: 'delete-retry-confirmation',
                activityId: activity.id,
                timestamp: secondRetryTimestamp,
                isoTimestamp: new Date(secondRetryTimestamp).toISOString()
              }
            }));
          }, 300);
          
          onOpenChange(false);
          return;
        } catch (retryError) {
          console.error("Second delete attempt failed:", retryError);
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