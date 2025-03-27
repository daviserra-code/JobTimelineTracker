import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import { OnboardingTour } from "@/components/onboarding-tour";
import { useEffect, useCallback } from "react";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

function Router() {
  const [location] = useLocation();

  // Add keyboard event listener for global shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only trigger if not in an input field
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement
    ) {
      return;
    }

    // Show keyboard shortcuts dialog when ? is pressed
    if (e.key === "?" && !e.ctrlKey && !e.altKey && !e.metaKey) {
      // Find and click the keyboard shortcuts button
      const keyboardShortcutsBtn = document.querySelector(
        '[data-keyboard-shortcuts-trigger="true"]'
      ) as HTMLButtonElement;
      if (keyboardShortcutsBtn) {
        keyboardShortcutsBtn.click();
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col min-h-screen tour-home">
      <Header />
      <div className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <MobileNav />
      <div className="fixed bottom-4 left-4 z-50 hidden md:block">
        <KeyboardShortcuts />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OnboardingTour>
        <Router />
        <Toaster />
      </OnboardingTour>
    </QueryClientProvider>
  );
}

export default App;
