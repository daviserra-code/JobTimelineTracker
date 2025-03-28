import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-muted p-4">
            <AlertCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Page not found</h1>
          <p className="text-muted-foreground text-lg">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        
        <div className="pt-4">
          <Button asChild className="gap-2">
            <Link to="/">
              <ChevronLeft className="h-4 w-4" />
              Return to home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}