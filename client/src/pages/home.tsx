import { useState, useEffect } from "react";
import { ViewMode, Activity, InsertActivity } from "@shared/schema";
import { useMobile } from "@/hooks/use-mobile";
import { useActivities } from "@/hooks/use-activities";
import { useHolidays } from "@/hooks/use-holidays";
import { YEARS } from "@/lib/constants";
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

export default function Home() {
  const isMobile = useMobile();
  
  // State for calendar controls
  const [currentYear, setCurrentYear] = useState(2025);
  const [currentMonth, setCurrentMonth] = useState(0); // 0-indexed (January is 0)
  const [currentWeek, setCurrentWeek] = useState(1); // 1-indexed (Week 1-5 of the month)
  const [currentDay, setCurrentDay] = useState(1); // 1-indexed (Day of month)
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isEditActivityOpen, setIsEditActivityOpen] = useState(false);
  
  // Get activities and holidays data
  const { activities, isLoading: activitiesLoading } = useActivities();
  const { holidays, isLoading: holidaysLoading } = useHolidays(["italy", "europe", "usa", "asia"], currentYear);
  
  // Functions for timeline zooming
  const handleZoomIn = () => {
    if (zoomLevel < 2) setZoomLevel(zoomLevel + 0.25);
  };
  
  const handleZoomOut = () => {
    if (zoomLevel > 0.5) setZoomLevel(zoomLevel - 0.25);
  };
  
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
    // Weeks are 1-indexed
    setCurrentWeek(week);
  };
  
  const changeDay = (day: number) => {
    // Days are 1-indexed
    setCurrentDay(day);
  };
  
  const openImportExportDialog = () => {
    setIsImportExportOpen(true);
  };
  
  const handleActivityClick = (activity: Activity) => {
    // Skip handling for holiday activities which are not editable
    if (activity.type === "holiday") return;
    
    setSelectedActivity(activity);
    setIsEditActivityOpen(true);
  };

  return (
    <main className="flex-grow container mx-auto px-4 py-6 mb-16 md:mb-6">
      <CalendarControls
        currentYear={currentYear}
        currentMonth={currentMonth}
        currentWeek={currentWeek}
        currentDay={currentDay}
        currentViewMode={viewMode}
        onYearChange={changeYear}
        onMonthChange={changeMonth}
        onWeekChange={changeWeek}
        onDayChange={changeDay}
        onViewModeChange={setViewMode}
        onOpenAddActivity={() => setIsAddActivityOpen(true)}
        onOpenImportExport={openImportExportDialog}
      />
      
      <ActivityLegend />
      
      {viewMode === "timeline" && (
        <TimelineView
          activities={activitiesLoading ? [] : currentYearActivities}
          holidays={holidaysLoading ? [] : holidays}
          year={currentYear}
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onActivityClick={handleActivityClick}
        />
      )}
      
      {viewMode === "month" && (
        <MonthView
          activities={activitiesLoading ? [] : currentYearActivities}
          holidays={holidaysLoading ? [] : holidays}
          year={currentYear}
          month={currentMonth}
          onActivityClick={handleActivityClick}
        />
      )}
      
      {viewMode === "week" && (
        <WeekView
          activities={activitiesLoading ? [] : currentYearActivities}
          holidays={holidaysLoading ? [] : holidays}
          year={currentYear}
          month={currentMonth}
          weekNumber={currentWeek}
          onActivityClick={handleActivityClick}
        />
      )}
      
      {viewMode === "day" && (
        <DayView
          activities={activitiesLoading ? [] : currentYearActivities}
          holidays={holidaysLoading ? [] : holidays}
          year={currentYear}
          month={currentMonth}
          day={currentDay}
          onActivityClick={handleActivityClick}
        />
      )}
      
      <NotificationsPanel />
      
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
        <ActivityForm
          open={isEditActivityOpen}
          onOpenChange={(open) => {
            setIsEditActivityOpen(open);
            if (!open) setSelectedActivity(null);
          }}
          initialData={selectedActivity}
          actionType="edit"
        />
      )}
    </main>
  );
}
