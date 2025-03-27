import React, { useState, useEffect } from 'react';
import { TourProvider, useTour, StepType } from '@reactour/tour';
import { Button } from '@/components/ui/button';
import { CalendarDays, GanttChart, Clock, Plus, Calendar, PanelLeft, Search, Filter, Bell } from 'lucide-react';

// Define the tour steps
const steps = [
  {
    selector: '.tour-home',
    content: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Welcome to Activity Calendar!</h3>
        <p>This tour will show you how to use the application and its features.</p>
        <p>Click "Next" to continue or "Skip" to exit the tour.</p>
      </div>
    ),
  },
  {
    selector: '.tour-calendar-controls',
    content: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Calendar Controls</h3>
        <p>Navigate between different years, months, and view modes using these controls.</p>
        <div className="flex items-center mt-2">
          <CalendarDays className="w-5 h-5 mr-2 text-primary" />
          <span>Change years and navigate through your calendar</span>
        </div>
      </div>
    ),
  },
  {
    selector: '.tour-view-modes',
    content: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">View Modes</h3>
        <p>Switch between different calendar views:</p>
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center">
            <GanttChart className="w-5 h-5 mr-2 text-primary" />
            <span>Timeline View - See all activities in a Gantt-chart style</span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            <span>Month View - Traditional calendar layout</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-primary" />
            <span>Week/Day View - Focused view of specific time periods</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    selector: '.tour-add-activity',
    content: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Add Activities</h3>
        <p>Click this button to add new activities to your calendar.</p>
        <div className="flex items-center mt-2">
          <Plus className="w-5 h-5 mr-2 text-primary" />
          <span>Create meetings, projects, training sessions, and more!</span>
        </div>
      </div>
    ),
  },
  {
    selector: '.tour-filters',
    content: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Advanced Filtering</h3>
        <p>Search and filter your activities:</p>
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center">
            <Search className="w-5 h-5 mr-2 text-primary" />
            <span>Search for specific activities by keyword</span>
          </div>
          <div className="flex items-center">
            <Filter className="w-5 h-5 mr-2 text-primary" />
            <span>Filter by type, status, date range and more</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    selector: '.tour-legend',
    content: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Activity Legend</h3>
        <p>Understand the color coding for different types of activities and their statuses.</p>
        <p>Activities are color-coded by both type (project, meeting, etc.) and status (confirmed, tentative, etc.)</p>
      </div>
    ),
  },
  {
    selector: '.tour-notifications',
    content: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <p>Stay updated with upcoming activities and important reminders.</p>
        <div className="flex items-center mt-2">
          <Bell className="w-5 h-5 mr-2 text-primary" />
          <span>View your notifications and never miss an important activity</span>
        </div>
      </div>
    ),
  },
  {
    selector: '.tour-timeline',
    content: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Timeline View</h3>
        <p>This Gantt-chart style view helps you visualize all your activities across the year.</p>
        <p>Hover over activities to see more details and click to edit them.</p>
      </div>
    ),
  },
  {
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">You're All Set!</h3>
        <p>You've completed the tour and are ready to use the Activity Calendar.</p>
        <p>You can restart this tour anytime from the help menu if you need a refresher.</p>
        <div className="flex justify-center mt-4">
          <span className="inline-block animate-bounce bg-primary text-primary-foreground rounded-full p-2">
            <CalendarDays className="w-5 h-5" />
          </span>
        </div>
      </div>
    ),
  },
];

// Main tour component
export function OnboardingTour({ children }: { children: React.ReactNode }) {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(false);

  useEffect(() => {
    // Check if the user has seen the tour before
    const tourSeen = localStorage.getItem('tourSeen');
    
    if (!tourSeen) {
      // Delay the tour start to ensure the UI is fully rendered
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setHasSeenTour(true);
    }
  }, []);

  const handleCloseTour = () => {
    setIsTourOpen(false);
    localStorage.setItem('tourSeen', 'true');
    setHasSeenTour(true);
  };

  // Use reactour v3 API
  return (
    <TourProvider
      steps={steps as any}
      currentStep={isTourOpen ? 0 : -1}
      setCurrentStep={step => {
        if (step === -1) handleCloseTour();
      }}
      styles={{
        popover: (base) => ({
          ...base,
          '--reactour-accent': 'var(--primary)',
          borderRadius: 'var(--radius)',
          padding: '1rem',
        }),
        badge: (base) => ({
          ...base,
          backgroundColor: 'var(--primary)',
        }),
        controls: (base) => ({
          ...base,
          marginTop: '1rem',
        }),
        close: (base) => ({
          ...base,
          right: '0.5rem',
          top: '0.5rem',
        }),
      }}
      padding={{ mask: 8 }}
      showNavigation={true}
      showCloseButton={true}
      showBadge={true}
    >
      {children}
      <TourButton hasSeenTour={hasSeenTour} setIsTourOpen={setIsTourOpen} />
    </TourProvider>
  );
}

// Tour control button component
function TourButton({ hasSeenTour, setIsTourOpen }: { hasSeenTour: boolean; setIsTourOpen: (isOpen: boolean) => void }) {
  const { setCurrentStep } = useTour();

  const handleStartTour = () => {
    setIsTourOpen(true);
    setCurrentStep(0); // Start at the first step
  };

  // Only show the restart tour button if user has seen the tour
  if (!hasSeenTour) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleStartTour}
        className="flex items-center gap-2 shadow-lg transition-all hover:scale-105"
      >
        <CalendarDays className="w-4 h-4" />
        <span>Restart Tour</span>
      </Button>
    </div>
  );
}