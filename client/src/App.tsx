import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import AccountPage from "@/pages/account";
import LoginPage from "@/pages/login";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import { OnboardingTour } from "@/components/onboarding-tour";
import { useEffect, useCallback } from "react";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { useTheme } from "@/hooks/use-theme";


function Router() {
  const [location] = useLocation();
  // Initialize theme from user preferences
  useTheme();

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
    
    // Navigation shortcuts
    if (e.key === "t" || e.key === "T") {
      // Toggle between view modes
      const viewModeSelector = document.querySelector('[data-view-mode-toggle="true"]') as HTMLButtonElement;
      if (viewModeSelector) {
        viewModeSelector.click();
      }
    }
    
    if (e.key === "m" || e.key === "M") {
      // Go to month view
      const monthViewBtn = document.querySelector('[data-month-view="true"]') as HTMLButtonElement;
      if (monthViewBtn) {
        monthViewBtn.click();
      }
    }
    
    if (e.key === "y" || e.key === "Y") {
      // Go to timeline/year view
      const timelineViewBtn = document.querySelector('[data-timeline-view="true"]') as HTMLButtonElement;
      if (timelineViewBtn) {
        timelineViewBtn.click();
      }
    }
    
    // Actions shortcuts
    if (e.key === "n" || e.key === "N") {
      // Create new activity
      const newActivityBtn = document.querySelector('[data-new-activity="true"]') as HTMLButtonElement;
      if (newActivityBtn) {
        newActivityBtn.click();
      }
    }
    
    // Zoom controls
    if (e.key === "+" || e.key === "=") {
      // Zoom in timeline
      const zoomInBtn = document.querySelector('[data-zoom-in="true"]') as HTMLButtonElement;
      if (zoomInBtn) {
        zoomInBtn.click();
      }
    }
    
    if (e.key === "-" || e.key === "_") {
      // Zoom out timeline
      const zoomOutBtn = document.querySelector('[data-zoom-out="true"]') as HTMLButtonElement;
      if (zoomOutBtn) {
        zoomOutBtn.click();
      }
    }
    
    // Filters
    if (e.key === "f" || e.key === "F") {
      // Toggle filters panel
      const filtersBtn = document.querySelector('[data-filters-toggle="true"]') as HTMLButtonElement;
      if (filtersBtn) {
        filtersBtn.click();
      }
    }
    
    // Search
    if (e.key === "s" || e.key === "S") {
      // Focus search bar
      const searchInput = document.querySelector('[data-search-input="true"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        e.preventDefault(); // Prevent 's' from being entered
      }
    }
    
    // Navigation between periods
    if (e.key === "ArrowLeft") {
      // Previous period
      const prevBtn = document.querySelector('[data-prev-period="true"]') as HTMLButtonElement;
      if (prevBtn) {
        prevBtn.click();
      }
    }
    
    if (e.key === "ArrowRight") {
      // Next period
      const nextBtn = document.querySelector('[data-next-period="true"]') as HTMLButtonElement;
      if (nextBtn) {
        nextBtn.click();
      }
    }
    
    if (e.key === "Home") {
      // Go to current period (today)
      const todayBtn = document.querySelector('[data-today="true"]') as HTMLButtonElement;
      if (todayBtn) {
        todayBtn.click();
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
          <Route path="/account" component={AccountPage} />
          <Route path="/login" component={LoginPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
      {/* MobileNav is rendered within the Home component with proper props */}
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
