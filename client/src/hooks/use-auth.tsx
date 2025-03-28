import { useQuery } from "@tanstack/react-query";
import { UserRole } from "../../shared/schema";
import React, { createContext, useContext, ReactNode } from "react";

interface User {
  id: number;
  username: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | undefined;
  isLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isReadOnly: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthValues();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function useAuthValues(): AuthContextType {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  const isAdmin = user?.role === "admin";
  const isReadOnly = user?.role === "user";

  return {
    user,
    isLoading,
    error: error as Error | null,
    isAdmin,
    isReadOnly,
    isAuthenticated: !!user,
  };
}