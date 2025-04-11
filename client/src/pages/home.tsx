import { useState, useEffect, useCallback } from "react";
import { ViewMode, Activity, InsertActivity } from "@shared/schema";
import { useMobile } from "@/hooks/use-mobile";
import { useActivities } from "@/hooks/use-activities";
import { useHolidays } from "@/hooks/use-holidays";
import { YEARS } from "@/lib/constants";
import { getISOWeekNumber } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import TimelineView from "@/components/timeline-view";
import MonthView from "@/components/month-view";
import WeekView from "@/components/week-view";
import DayView from "@/components/day-view";
import ActivityLegend from "@/components/activity-legend";
import CalendarControls from "@/components/calendar-controls";
import NotificationsPanel from "@/components/notifications-panel";
import ImportExportDialog from "@/components/import-export-dialog";
import ActivityForm from "@/components/activity-form";
import DeleteActivityDialog from "@/components/delete-activity-dialog";
import { ActivityFilters } from "@/components/activity-filters";
import type { ActivityFilters as ActivityFiltersType } from "@/components/activity-filters";
import MobileNav from "@/components/mobile-nav";
import { useLocation } from "wouter";

export default function Home() {
  const isMobile = useMobile();
  const [location, setLocation] = useLocation();
  
  // Get today's date information for initial state
  const today = new Date();
  
  // State for calendar controls
  // Note: We default to 2025 even though we get current date info
  // This is per requirements to have the timeline start at 2025
  const [currentYear, setCurrentYear] = useState(2025);
  
  // Current month (0-indexed, January is 0)
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  
  // Get today's ISO week number for the initial state
  const currentISOWeek = getISOWeekNumber(today);
  const [currentWeek, setCurrentWeek] = useState(currentISOWeek); // ISO week number (1-53 for the year)
  
  // Current day (1-indexed)
  const [currentDay, setCurrentDay] = useState(today.getDate()); // 1-indexed (Day of month)
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isEditActivityOpen, setIsEditActivityOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActivityFiltersType | null>(null);
  const [highlightToday, setHighlightToday] = useState(false);
  
  // Get activities and holidays data with optional filtering
  // Include a timestamp to force refresh on mutations
  const [refreshToken, setRefreshToken] = useState(Date.now());
  
  // Forced reload function that can be called from anywhere
  const forceRefresh = useCallback(() => {
    const timestamp = Date.now();
    console.log(`🔄 Forcing data refresh at ${new Date(timestamp).toISOString()}`);
    setRefreshToken(timestamp);
    
    // Add a small delay and refresh again to ensure changes are reflected
    setTimeout(() => {
      const secondTimestamp = Date.now();
      console.log(`🔁 Secondary refresh at ${new Date(secondTimestamp).toISOString()}`);
      setRefreshToken(secondTimestamp);
    }, 500);
  }, []);
  
  // Listen for activity changes and force a refresh
  useEffect(() => {
    // This will listen for our custom event that signals activity changes
    const handleActivityChanged = (event: Event) => {
      const timestamp = Date.now();
      
      // Get details from the custom event if available
      const customEvent = event as CustomEvent;
      const details = customEvent.detail || {};
      const operation = details.operation || 'unknown';
      const eventTimestamp = details.timestamp || timestamp;
      const isoTimestamp = details.isoTimestamp || new Date(timestamp).toISOString();
      
      console.log(`📊 Activity ${operation} detected at ${isoTimestamp}, refreshing data with token: ${timestamp}`);
      
      // Update the refresh token to force data reload
      setRefreshToken(timestamp);
      
      // For delete operations, do a double refresh with a delay
      if (operation === 'delete') {
        setTimeout(() => forceRefresh(), 300);
      }
    };
    
    console.log('🔄 Setting up activity-changed event listener');
    window.addEventListener('activity-changed', handleActivityChanged);
    
    return () => {
      console.log('🧹 Cleaning up activity-changed event listener');
      window.removeEventListener('activity-changed', handleActivityChanged);
    };
  }, [viewMode, forceRefresh]);
  
  const { activities, isLoading: activitiesLoading, isAdmin } = useActivities(
    activeFilters ? { filters: activeFilters, refreshToken } : { refreshToken }
  );
  const { holidays, isLoading: holidaysLoading } = useHolidays(["italy", "europe", "usa", "asia"], currentYear);
  
  // Functions for timeline zooming
  const handleZoomIn = () => {
    if (zoomLevel < 2) setZoomLevel(zoomLevel + 0.25);
  };
  
  const handleZoomOut = () => {
    if (zoomLevel > 0.5) setZoomLevel(zoomLevel - 0.25);
  };
  
  // Listen for custom 'goToToday' event from header component
  useEffect(() => {
    const handleGoToToday = (e: CustomEvent) => {
      const { viewMode: todayViewMode, year, month, week, day, highlight } = e.detail;
      
      // Directly update our state variables
      setViewMode(todayViewMode as ViewMode);
      setCurrentYear(year);
      setCurrentMonth(month);
      setCurrentWeek(week);
      setCurrentDay(day);
      setHighlightToday(highlight);
    };
    
    // Add event listener as a custom event
    window.addEventListener('goToToday', handleGoToToday as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('goToToday', handleGoToToday as EventListener);
    };
  }, []);
  
  // Listen for custom 'openImportExport' event from header component
  useEffect(() => {
    const handleOpenImportExport = () => {
      setIsImportExportOpen(true);
    };
    
    // Add event listener as a custom event
    window.addEventListener('openImportExport', handleOpenImportExport);
    
    // Cleanup
    return () => {
      window.removeEventListener('openImportExport', handleOpenImportExport);
    };
  }, []);
  
  // Effect to parse URL parameters 
  useEffect(() => {
    // Check if we have URL parameters that indicate we should navigate to today's date
    const params = new URLSearchParams(window.location.search);
    
    // Parse the view parameter
    const viewParam = params.get('view');
    if (viewParam && ['timeline', 'month', 'week', 'day'].includes(viewParam)) {
      setViewMode(viewParam as ViewMode);
    }
    
    // Parse year, month, week, and day parameters
    const yearParam = params.get('year');
    if (yearParam && !isNaN(Number(yearParam))) {
      setCurrentYear(Number(yearParam));
    }
    
    const monthParam = params.get('month');
    if (monthParam && !isNaN(Number(monthParam))) {
      setCurrentMonth(Number(monthParam));
    }
    
    const weekParam = params.get('week');
    if (weekParam && !isNaN(Number(weekParam))) {
      setCurrentWeek(Number(weekParam));
    }
    
    const dayParam = params.get('day');
    if (dayParam && !isNaN(Number(dayParam))) {
      setCurrentDay(Number(dayParam));
    }
    
    // Check if we should highlight today
    const todayParam = params.get('today');
    if (todayParam === 'true') {
      setHighlightToday(true);
    }
    
    // Clear URL parameters after processing to avoid reprocessing on subsequent renders
    if (location.includes('?')) {
      // Use window.history to update the URL without causing a reload
      window.history.replaceState({}, '', location.split('?')[0]);
    }
  }, [location]);

  // Effect to update CSS variables based on zoom level
  useEffect(() => {
    const timelineMonths = document.querySelectorAll(".timeline-month");
    
    timelineMonths.forEach((month) => {
      if (month instanceof HTMLElement) {
        // Base width is different depending on screen size
        let baseWidth = '80px'; // Default for desktop
        
        if (window.innerWidth <= 640) {
          baseWidth = '240px'; // Mobile
        } else if (window.innerWidth <= 1024) {
          baseWidth = '120px'; // Tablet
        }
        
        // Apply the zoom level
        month.style.minWidth = `calc(${baseWidth} * ${zoomLevel})`;
      }
    });
  }, [zoomLevel]);
  
  // Get all activities for the current year
  const currentYearActivities = activities.filter(activity => {
    const startYear = new Date(activity.startDate).getFullYear();
    const endYear = new Date(activity.endDate).getFullYear();
    return startYear === currentYear || endYear === currentYear || 
           (startYear < currentYear && endYear > currentYear);
  });
  
  // Apply active filters to activities
  const filteredActivities = currentYearActivities;
  
  const changeYear = (year: number) => {
    if (year >= YEARS[0] && year <= YEARS[YEARS.length - 1]) {
      setCurrentYear(year);
    }
  };
  
  const changeMonth = (month: number) => {
    if (month >= 0 && month <= 11) {
      setCurrentMonth(month);
    }
  };
  
  const changeWeek = (week: number) => {
    // ISO week numbers range from 1-53
    if (week >= 1 && week <= 53) {
      setCurrentWeek(week);
    }
  };
  
  const changeDay = (day: number) => {
    // Days are 1-indexed
    setCurrentDay(day);
  };
  
  const openImportExportDialog = () => {
    setIsImportExportOpen(true);
  };
  
  const handleActivityClick = (activity: Activity) => {
    // For holiday activities, only admins can edit
    const isAdmin = user?.role === 'admin' || user?.username === 'Administrator' || hasAdminToken();
    if (activity.type === "holiday" && !isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can edit holiday activities.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedActivity(activity);
    setIsEditActivityOpen(true);
  };

  const handleActivityContextMenu = (event: React.MouseEvent, activity: Activity) => {
    // For holiday activities, only admins can delete
    const isAdmin = user?.role === 'admin' || user?.username === 'Administrator' || hasAdminToken();
    if (activity.type === "holiday" && !isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can delete holiday activities.",
        variant: "destructive"
      });
      return;
    }
    
    // Prevent the default context menu
    event.preventDefault();
    
    // Set the selected activity for deletion
    setSelectedActivity(activity);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <main className="flex-grow container mx-auto px-4 py-6 mb-16 md:mb-6 tour-home">
        <div className="tour-calendar-controls">
          <CalendarControls
            currentYear={currentYear}
            currentMonth={currentMonth}
            currentWeek={currentWeek}
            currentDay={currentDay}
            currentViewMode={viewMode}
            activities={filteredActivities}
            onYearChange={changeYear}
            onMonthChange={changeMonth}
            onWeekChange={changeWeek}
            onDayChange={changeDay}
            onViewModeChange={setViewMode}
            onOpenAddActivity={() => setIsAddActivityOpen(true)}
            onOpenImportExport={openImportExportDialog}
          />
        </div>
        
        <div className="mt-4 mb-6 tour-filters">
          <ActivityFilters
            onFilterChange={(filters) => {
              console.log("Filters applied:", filters);
              setActiveFilters(filters);
            }}
          />
        </div>
        
        <div className="tour-legend">
          <ActivityLegend />
        </div>
        
        {viewMode === "timeline" && (
          <div className="tour-timeline">
            <TimelineView
              activities={activitiesLoading ? [] : currentYearActivities}
              holidays={holidaysLoading ? [] : holidays}
              year={currentYear}
              zoomLevel={zoomLevel}
              highlightToday={highlightToday}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onActivityClick={handleActivityClick}
              onActivityContextMenu={handleActivityContextMenu}
            />
          </div>
        )}
        
        {viewMode === "month" && (
          <MonthView
            activities={activitiesLoading ? [] : currentYearActivities}
            holidays={holidaysLoading ? [] : holidays}
            year={currentYear}
            month={currentMonth}
            highlightToday={highlightToday}
            onActivityClick={handleActivityClick}
            onActivityContextMenu={handleActivityContextMenu}
          />
        )}
        
        {viewMode === "week" && (
          <WeekView
            activities={activitiesLoading ? [] : currentYearActivities}
            holidays={holidaysLoading ? [] : holidays}
            year={currentYear}
            month={currentMonth}
            weekNumber={currentWeek}
            highlightToday={highlightToday}
            onActivityClick={handleActivityClick}
            onActivityContextMenu={handleActivityContextMenu}
          />
        )}
        
        {viewMode === "day" && (
          <DayView
            activities={activitiesLoading ? [] : currentYearActivities}
            holidays={holidaysLoading ? [] : holidays}
            year={currentYear}
            month={currentMonth}
            day={currentDay}
            highlightToday={highlightToday}
            onActivityClick={handleActivityClick}
            onActivityContextMenu={handleActivityContextMenu}
          />
        )}
        
        <div className="tour-notifications">
          <NotificationsPanel />
        </div>
        
        <ImportExportDialog
          open={isImportExportOpen}
          onOpenChange={setIsImportExportOpen}
          activities={activities}
        />
        
        <ActivityForm
          open={isAddActivityOpen}
          onOpenChange={setIsAddActivityOpen}
          actionType="create"
        />
        
        {selectedActivity && (
          <>
            <ActivityForm
              open={isEditActivityOpen}
              onOpenChange={(open) => {
                setIsEditActivityOpen(open);
                if (!open && !isDeleteDialogOpen) {
                  setSelectedActivity(null);
                }
              }}
              initialData={selectedActivity}
              actionType="edit"
            />
            
            <DeleteActivityDialog 
              activity={selectedActivity}
              open={isDeleteDialogOpen}
              onOpenChange={(open) => {
                setIsDeleteDialogOpen(open);
                if (!open && !isEditActivityOpen) {
                  setSelectedActivity(null);
                }
              }}
            />
          </>
        )}
      </main>
      
      {/* Mobile Navigation */}
      <MobileNav 
        currentViewMode={viewMode} 
        onViewModeChange={setViewMode} 
      />
    </>
  );
}
