import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ViewMode, Activity } from "@shared/schema";
import { VIEW_MODES, YEARS } from "@/lib/constants";
import { CalendarTimeline } from "./calendar-timeline";

interface CalendarViewsProps {
  currentYear: number;
  currentViewMode: ViewMode;
  activities: Activity[];
  zoomLevel: number;
  onYearChange: (year: number) => void;
  onViewModeChange: (viewMode: ViewMode) => void;
  onActivityClick?: (activity: Activity) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  className?: string;
}

export function CalendarViews({
  currentYear,
  currentViewMode,
  activities,
  zoomLevel,
  onYearChange,
  onViewModeChange,
  onActivityClick,
  onZoomIn,
  onZoomOut,
  className,
}: CalendarViewsProps) {
  // Filter activities for current year
  const currentYearActivities = activities.filter(activity => {
    const startYear = new Date(activity.startDate).getFullYear();
    const endYear = new Date(activity.endDate).getFullYear();
    return startYear === currentYear || endYear === currentYear || 
           (startYear < currentYear && endYear > currentYear);
  });

  return (
    <div className={cn("bg-white rounded-lg shadow-sm overflow-hidden", className)}>
      <div className="border-b px-4 py-3 flex justify-between items-center">
        <h2 className="text-lg font-medium">{VIEW_MODES[currentViewMode]} View ({currentYear})</h2>
        <div className="flex space-x-2">
          <button 
            className="p-1 rounded hover:bg-gray-100" 
            title="Zoom out"
            onClick={onZoomOut}
          >
            <span className="material-icons">zoom_out</span>
          </button>
          <button 
            className="p-1 rounded hover:bg-gray-100" 
            title="Zoom in"
            onClick={onZoomIn}
          >
            <span className="material-icons">zoom_in</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-hidden">
        {currentViewMode === "timeline" && (
          <CalendarTimeline 
            year={currentYear} 
            activities={currentYearActivities}
            onActivityClick={onActivityClick}
            zoomLevel={zoomLevel}
          />
        )}
        
        {currentViewMode === "month" && (
          <div className="p-6 text-center text-gray-500">
            <span className="material-icons text-4xl mb-2">calendar_month</span>
            <p>Month view will be available soon</p>
            <p className="text-sm mt-1">Please use Timeline view for now</p>
          </div>
        )}
        
        {currentViewMode === "week" && (
          <div className="p-6 text-center text-gray-500">
            <span className="material-icons text-4xl mb-2">view_week</span>
            <p>Week view will be available soon</p>
            <p className="text-sm mt-1">Please use Timeline view for now</p>
          </div>
        )}
        
        {currentViewMode === "day" && (
          <div className="p-6 text-center text-gray-500">
            <span className="material-icons text-4xl mb-2">today</span>
            <p>Day view will be available soon</p>
            <p className="text-sm mt-1">Please use Timeline view for now</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function CalendarViewSelector({
  currentViewMode,
  onViewModeChange,
  className,
}: {
  currentViewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
  className?: string;
}) {
  return (
    <Select
      value={currentViewMode}
      onValueChange={(value) => onViewModeChange(value as ViewMode)}
      className={className}
    >
      <SelectTrigger className="w-[150px]">
        <SelectValue placeholder="Select view" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(VIEW_MODES).map(([value, label]) => (
          <SelectItem key={value} value={value}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function YearNavigator({
  currentYear,
  onYearChange,
  className,
}: {
  currentYear: number;
  onYearChange: (year: number) => void;
  className?: string;
}) {
  const goToPreviousPeriod = () => {
    if (currentYear > YEARS[0]) {
      onYearChange(currentYear - 1);
    }
  };
  
  const goToNextPeriod = () => {
    if (currentYear < YEARS[YEARS.length - 1]) {
      onYearChange(currentYear + 1);
    }
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={goToPreviousPeriod}
        disabled={currentYear <= YEARS[0]}
        title="Previous period"
      >
        <span className="material-icons">navigate_before</span>
      </Button>
      <span className="text-lg font-medium">{currentYear}</span>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={goToNextPeriod}
        disabled={currentYear >= YEARS[YEARS.length - 1]}
        title="Next period"
      >
        <span className="material-icons">navigate_next</span>
      </Button>
    </div>
  );
}

export function YearTabs({
  years,
  selectedYear,
  onSelectYear,
  className,
}: {
  years: number[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("border-b bg-gray-50", className)}>
      <div className="flex overflow-x-auto">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => onSelectYear(year)}
            className={`px-4 py-2 font-medium hover:bg-gray-100 focus:outline-none border-b-2 ${
              year === selectedYear ? "border-primary" : "border-transparent"
            }`}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  );
}
