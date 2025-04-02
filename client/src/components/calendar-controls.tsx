import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ViewMode } from "@shared/schema";
import { VIEW_MODES, YEARS, MONTHS } from "@/lib/constants";
import { format, getDaysInMonth, startOfMonth, endOfMonth, eachWeekOfInterval, getISOWeek, setISOWeek, getISOWeeksInYear } from "date-fns";
import { getISOWeekNumber, getAllISOWeeksForYear } from "@/lib/dates";
import { useAuth } from "@/hooks/use-auth";

interface CalendarControlsProps {
  currentYear: number;
  currentMonth?: number;
  currentWeek?: number;
  currentDay?: number;
  currentViewMode: ViewMode;
  onYearChange: (year: number) => void;
  onMonthChange?: (month: number) => void;
  onWeekChange?: (week: number) => void;
  onDayChange?: (day: number) => void;
  onViewModeChange: (viewMode: ViewMode) => void;
  onOpenAddActivity: () => void;
  onOpenImportExport: () => void;
}

export default function CalendarControls({
  currentYear,
  currentMonth = 0,
  currentWeek = 1,
  currentDay = 1,
  currentViewMode,
  onYearChange,
  onMonthChange = () => {},
  onWeekChange = () => {},
  onDayChange = () => {},
  onViewModeChange,
  onOpenAddActivity,
  onOpenImportExport
}: CalendarControlsProps) {
  // Get authentication status to conditionally show admin features
  const { isAdmin } = useAuth();
  const goToPreviousPeriod = () => {
    if (currentViewMode === "timeline") {
      if (currentYear > YEARS[0]) {
        onYearChange(currentYear - 1);
      }
    } else if (currentViewMode === "month") {
      if (currentMonth > 0) {
        onMonthChange(currentMonth - 1);
      } else if (currentYear > YEARS[0]) {
        onYearChange(currentYear - 1);
        onMonthChange(11); // December of previous year
      }
    } else if (currentViewMode === "week") {
      if (currentWeek > 1) {
        // Just go to the previous ISO week
        onWeekChange(currentWeek - 1);
      } else {
        // We're at week 1, so we need to go to the last week of the previous year
        if (currentYear > YEARS[0]) {
          const prevYear = currentYear - 1;
          // Last ISO week of the previous year (can be 52 or 53)
          const lastWeekOfPrevYear = getISOWeeksInYear(new Date(prevYear, 0, 1));
          onYearChange(prevYear);
          onWeekChange(lastWeekOfPrevYear);
        }
      }
    } else if (currentViewMode === "day") {
      if (currentDay > 1) {
        onDayChange(currentDay - 1);
      } else if (currentMonth > 0) {
        onMonthChange(currentMonth - 1);
        // Set to last day of previous month
        const prevMonthDays = getDaysInMonth(new Date(currentYear, currentMonth - 1));
        onDayChange(prevMonthDays);
      } else if (currentYear > YEARS[0]) {
        onYearChange(currentYear - 1);
        onMonthChange(11);
        onDayChange(31); // December 31st
      }
    }
  };
  
  const goToNextPeriod = () => {
    if (currentViewMode === "timeline") {
      if (currentYear < YEARS[YEARS.length - 1]) {
        onYearChange(currentYear + 1);
      }
    } else if (currentViewMode === "month") {
      if (currentMonth < 11) {
        onMonthChange(currentMonth + 1);
      } else if (currentYear < YEARS[YEARS.length - 1]) {
        onYearChange(currentYear + 1);
        onMonthChange(0); // January of next year
      }
    } else if (currentViewMode === "week") {
      // Using ISO week numbers throughout the year
      const weeksInCurrentYear = getISOWeeksInYear(new Date(currentYear, 0, 1));
      
      if (currentWeek < weeksInCurrentYear) {
        // Simply go to the next ISO week in the same year
        onWeekChange(currentWeek + 1);
      } else {
        // We're at the last week of the year, so move to week 1 of next year
        if (currentYear < YEARS[YEARS.length - 1]) {
          onYearChange(currentYear + 1);
          onWeekChange(1); // First ISO week of the next year
        }
      }
    } else if (currentViewMode === "day") {
      const daysInMonth = getDaysInMonth(new Date(currentYear, currentMonth));
      if (currentDay < daysInMonth) {
        onDayChange(currentDay + 1);
      } else if (currentMonth < 11) {
        onMonthChange(currentMonth + 1);
        onDayChange(1); // First day of next month
      } else if (currentYear < YEARS[YEARS.length - 1]) {
        onYearChange(currentYear + 1);
        onMonthChange(0);
        onDayChange(1);
      }
    }
  };
  
  // Helper function to get the number of weeks in a month
  const getWeeksInMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachWeekOfInterval({ start, end }).length;
  };
  
  return (
    <div className="bg-white border-b tour-calendar-controls">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-4 mb-2 md:mb-0">
            <div className="tour-view-modes">
              <Select 
                value={currentViewMode} 
                onValueChange={(value) => onViewModeChange(value as ViewMode)}
                data-view-mode-toggle="true"
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VIEW_MODES).map(([value, label]) => (
                    <SelectItem 
                      key={value} 
                      value={value}
                      data-timeline-view={value === "timeline" ? "true" : undefined}
                      data-month-view={value === "month" ? "true" : undefined}
                      data-week-view={value === "week" ? "true" : undefined}
                      data-day-view={value === "day" ? "true" : undefined}
                    >
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={goToPreviousPeriod}
                disabled={currentViewMode === "timeline" && currentYear <= YEARS[0]}
                title="Previous period (← key)"
                data-prev-period="true"
              >
                <span className="material-icons">navigate_before</span>
              </Button>
              <span className="text-lg font-medium">
                {currentViewMode === "timeline" && currentYear}
                {currentViewMode === "month" && `${MONTHS[currentMonth]} ${currentYear}`}
                {currentViewMode === "week" && `ISO Week ${currentWeek}, ${currentYear}`}
                {currentViewMode === "day" && format(new Date(currentYear, currentMonth, currentDay), "MMMM d, yyyy")}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={goToNextPeriod}
                disabled={currentViewMode === "timeline" && currentYear >= YEARS[YEARS.length - 1]}
                title="Next period (→ key)"
                data-next-period="true"
              >
                <span className="material-icons">navigate_next</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="tour-filters">
              <Button 
                variant="outline" 
                className="hidden md:flex items-center"
                data-filters-toggle="true"
                title="Toggle filters (F key)"
              >
                <span className="material-icons text-sm mr-1">filter_list</span>
                Filter
              </Button>
            </div>
            
            <div className="relative">
              <Button 
                variant="outline" 
                className="flex items-center"
                onClick={onOpenImportExport}
                title="Import/Export activities"
              >
                <span className="material-icons text-sm mr-1">download</span>
                <span className="hidden sm:inline">Import/Export</span>
              </Button>
            </div>
            
            {/* Only show Add Activity button for admin users */}
            {isAdmin && (
              <div className="tour-add-activity">
                <Button 
                  onClick={onOpenAddActivity}
                  className="rounded-full bg-primary text-white p-3 md:px-4 md:py-2 flex items-center shadow-md hover:bg-opacity-90"
                  data-new-activity="true"
                  title="Add new activity (N key)"
                >
                  <span className="material-icons md:mr-1">add</span>
                  <span className="hidden md:inline">Add Activity</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Navigation tabs based on view mode */}
      <div className="border-b bg-gray-50">
        {/* Year tabs for timeline view */}
        {currentViewMode === "timeline" && (
          <div className="flex overflow-x-auto">
            {YEARS.map((year) => (
              <button
                key={year}
                onClick={() => onYearChange(year)}
                className={`px-4 py-2 font-medium hover:bg-gray-100 focus:outline-none border-b-2 ${
                  year === currentYear ? "border-primary" : "border-transparent"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}
        
        {/* Month tabs for month view */}
        {currentViewMode === "month" && (
          <div className="flex overflow-x-auto">
            {MONTHS.map((month, index) => (
              <button
                key={month}
                onClick={() => onMonthChange(index)}
                className={`px-4 py-2 font-medium hover:bg-gray-100 focus:outline-none border-b-2 ${
                  index === currentMonth ? "border-primary" : "border-transparent"
                }`}
              >
                {month}
              </button>
            ))}
          </div>
        )}
        
        {/* Week tabs for week view - using ISO week numbers for the whole year */}
        {currentViewMode === "week" && (
          <div className="flex overflow-x-auto">
            {Array.from({ length: getISOWeeksInYear(new Date(currentYear, 0, 1)) }).map((_, index) => (
              <button
                key={`week-${index + 1}`}
                onClick={() => onWeekChange(index + 1)}
                className={`px-4 py-2 font-medium hover:bg-gray-100 focus:outline-none border-b-2 ${
                  index + 1 === currentWeek ? "border-primary" : "border-transparent"
                }`}
              >
                Week {index + 1}
              </button>
            ))}
          </div>
        )}
        
        {/* Day tabs for day view */}
        {currentViewMode === "day" && (
          <div className="flex overflow-x-auto">
            {Array.from({ length: getDaysInMonth(new Date(currentYear, currentMonth)) }).map((_, index) => (
              <button
                key={`day-${index + 1}`}
                onClick={() => onDayChange(index + 1)}
                className={`px-4 py-2 font-medium hover:bg-gray-100 focus:outline-none border-b-2 ${
                  index + 1 === currentDay ? "border-primary" : "border-transparent"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
