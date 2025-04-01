import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

export interface AuthUser extends Omit<User, 'password'> {
  role: 'admin' | 'user';
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthUser>({
    queryKey: ["/api/users/me"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isAdmin = user?.role === 'admin';

  return {
    user,
    isLoading,
    error,
    isAdmin,
  };
}