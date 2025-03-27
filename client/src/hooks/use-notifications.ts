import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Notification } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useNotifications() {
  const { toast } = useToast();
  
  // Get all notifications
  const { data: notifications, isLoading, error } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });
  
  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/notifications/${id}`, { read: true });
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update notification: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Get upcoming notifications (not read and in the future)
  const getUpcomingNotifications = () => {
    if (!notifications) return [];
    
    return notifications
      .filter(notification => !notification.read)
      .sort((a, b) => new Date(a.notifyDate).getTime() - new Date(b.notifyDate).getTime());
  };
  
  return {
    notifications: notifications || [],
    upcomingNotifications: getUpcomingNotifications(),
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
  };
}
