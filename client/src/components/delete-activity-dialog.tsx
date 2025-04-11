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
import { forceRefreshCycle } from "@/lib/refresh-utils";

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
      
      // Use the new refresh utility to ensure UI updates properly
      forceRefreshCycle('delete', activity.id, 300);
      
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
          
          // Use the new refresh utility for the retry case with a more aggressive refresh cycle
          forceRefreshCycle('delete-retry', activity.id, 250);
          
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