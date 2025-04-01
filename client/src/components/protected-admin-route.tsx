import { Route, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface ProtectedAdminRouteProps {
  path: string;
  component: React.ComponentType;
}

export default function ProtectedAdminRoute({ path, component: Component }: ProtectedAdminRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      // Only redirect if we're sure the user is not an admin
      console.log("Access denied: Admin role required", { user });
      setLocation("/login");
    }
  }, [isLoading, isAdmin, user, setLocation]);

  return (
    <Route
      path={path}
      component={() => {
        if (isLoading) {
          return (
            <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // Only render the component if the user is an admin
        // The useEffect above will handle the redirect if they're not
        return isAdmin ? <Component /> : null;
      }}
    />
  );
}