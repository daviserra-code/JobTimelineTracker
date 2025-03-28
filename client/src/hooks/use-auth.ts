import { useQuery } from "@tanstack/react-query";
import { UserRole } from "@shared/schema";

interface User {
  id: number;
  username: string;
  role: UserRole;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  const isAdmin = user?.role === "admin";
  const isReadOnly = user?.role === "user";

  return {
    user,
    isLoading,
    error,
    isAdmin,
    isReadOnly,
    isAuthenticated: !!user,
  };
}