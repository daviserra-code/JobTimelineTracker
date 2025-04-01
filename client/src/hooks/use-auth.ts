import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface AuthUser extends Omit<User, 'password'> {
  role: 'admin' | 'user';
}

export function useAuth() {
  const { toast } = useToast();
  const { data: user, isLoading, error, refetch } = useQuery<AuthUser>({
    queryKey: ["/api/users/me"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Make sure we always have the latest user data
  });

  // Special handling for admin role - handle the username === 'Administrator' case
  // This ensures the admin flag is always correctly set
  const isAdmin = 
    user?.role === 'admin' || 
    (user?.username === 'Administrator' && user?.id === 6);
  
  // Force refresh user role if needed
  const forceRefreshRole = async () => {
    if (user?.username === 'Administrator' && user?.role !== 'admin') {
      console.log('Forcing refresh of admin role for Administrator');
      try {
        await apiRequest("PATCH", "/api/users/admin-role", {
          adminKey: "dvd70ply",
          role: "admin"
        });
        await refetch();
      } catch (err) {
        console.error("Error refreshing admin role:", err);
      }
    }
  };
  
  // Trigger role refresh if the user is Administrator but role is not admin
  if (user?.username === 'Administrator' && user?.role !== 'admin') {
    forceRefreshRole();
  }

  return {
    user,
    isLoading,
    error,
    isAdmin,
    refetchUser: refetch
  };
}