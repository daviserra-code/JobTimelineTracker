import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, TimelineActivity } from '@/lib/types';
import { generateYearRange, generateMonthsForYear, formatMonthYear, calculateTimelinePosition } from '@/lib/dates';
import { getActivityTypeColor, getActivityTextColor, generateTooltipText } from '@/lib/activities';
import { convertHolidaysToActivities, getHolidaysInRange } from '@/lib/holidays';

type TimelineViewProps = {
  selectedYear: number;
  onYearChange: (year: number) => void;
};

const TimelineView = ({ selectedYear, onYearChange }: TimelineViewProps) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [tooltipInfo, setTooltipInfo] = useState({ visible: false, text: '', x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  
  // Define years range for the timeline
  const years = generateYearRange(2025, 2030);
  const months = generateMonthsForYear(selectedYear);
  
  // Get start and end dates for the selected year
  const startDate = new Date(selectedYear, 0, 1);
  const endDate = new Date(selectedYear, 11, 31);
  
  // Fetch activities for the selected year
  const { data: activities = [] } = useQuery({
    queryKey: [`/api/activities/range/${startDate.toISOString()}/${endDate.toISOString()}`]
  });
  
  // Get holidays for the year and convert them to activities
  const holidays = getHolidaysInRange(startDate, endDate);
  const holidayActivities = convertHolidaysToActivities(holidays);
  
  // Combine fetched activities with holiday activities
  const allActivities = [...activities, ...holidayActivities];
  
  // Group activities by category
  const groupedActivities: Record<string, Activity[]> = {};
  
  allActivities.forEach(activity => {
    const category = activity.category || 'General';
    if (!groupedActivities[category]) {
      groupedActivities[category] = [];
    }
    groupedActivities[category].push(activity);
  });
  
  // Calculate timeline positions for activities
  const calculateActivityPositions = (
    activities: Activity[], 
    startDate: Date, 
    endDate: Date
  ): TimelineActivity[] => {
    return activities
      .map(activity => calculateTimelinePosition(activity, startDate, endDate))
      .filter((item): item is TimelineActivity => item !== null);
  };
  
  // Handle tooltip display
  const handleActivityMouseEnter = (e: React.MouseEvent, activity: Activity) => {
    const tooltipText = generateTooltipText(activity);
    const rect = e.currentTarget.getBoundingClientRect();
    
    setTooltipInfo({
      visible: true,
      text: tooltipText,
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 10
    });
  };
  
  const handleActivityMouseLeave = () => {
    setTooltipInfo(prev => ({ ...prev, visible: false }));
  };
  
  // Position tooltip when visible
  useEffect(() => {
    if (tooltipInfo.visible && tooltipRef.current) {
      const tooltipEl = tooltipRef.current;
      const tooltipWidth = tooltipEl.offsetWidth;
      const tooltipHeight = tooltipEl.offsetHeight;
      
      tooltipEl.style.left = `${tooltipInfo.x - tooltipWidth / 2}px`;
      tooltipEl.style.top = `${tooltipInfo.y - tooltipHeight}px`;
    }
  }, [tooltipInfo]);
  
  // Handle zoom in/out
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="border-b px-4 py-3 flex justify-between items-center">
        <h2 className="text-lg font-medium">Timeline View (2025-2030)</h2>
        <div className="flex space-x-2">
          <button 
            className="p-1 rounded hover:bg-gray-100" 
            title="Zoom out"
            onClick={handleZoomOut}
          >
            <span className="material-icons">zoom_out</span>
          </button>
          <button 
            className="p-1 rounded hover:bg-gray-100" 
            title="Zoom in"
            onClick={handleZoomIn}
          >
            <span className="material-icons">zoom_in</span>
          </button>
        </div>
      </div>
      
      {/* Timeline Years Navigation */}
      <div className="border-b bg-gray-50">
        <div className="flex overflow-x-auto">
          {years.map(year => (
            <button 
              key={year}
              className={`px-4 py-2 font-medium hover:bg-gray-100 focus:outline-none border-b-2 ${
                year === selectedYear ? 'border-primary' : 'border-transparent'
              }`}
              onClick={() => onYearChange(year)}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Calendar */}
      <div 
        className="timeline-container"
        ref={timelineContainerRef}
        style={{ overflowX: 'auto' }}
      >
        <div className="min-w-max" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
          {/* Timeline Header (Months) */}
          <div className="flex border-b">
            {months.map((month, index) => (
              <div 
                key={index} 
                className="timeline-month text-center py-2 font-medium text-sm border-r last:border-r-0"
              >
                {formatMonthYear(month)}
              </div>
            ))}
          </div>

          {/* Timeline Activities */}
          <div className="relative min-h-[400px]">
            {/* Activity Rows */}
            {Object.entries(groupedActivities).map(([category, activities], categoryIndex) => (
              <div key={category} className={`border-b py-3 px-2 hover:bg-gray-50 ${categoryIndex === Object.keys(groupedActivities).length - 1 ? '' : 'border-b'}`}>
                <div className="font-medium mb-2">{category}</div>
                
                {/* Activity Bars */}
                <div className="relative h-6">
                  {calculateActivityPositions(activities, startDate, endDate).map((timelineActivity, index) => (
                    <div 
                      key={`${timelineActivity.activity.id}-${index}`}
                      className={`activity absolute top-0 h-full ${getActivityTypeColor(timelineActivity.activity.type)} rounded-full px-3 py-1 ${getActivityTextColor(timelineActivity.activity.type)} text-xs flex items-center cursor-pointer`}
                      style={{ 
                        left: timelineActivity.positionLeft, 
                        width: timelineActivity.width,
                        minWidth: '30px' // Ensure minimum width for very short activities
                      }}
                      onMouseEnter={(e) => handleActivityMouseEnter(e, timelineActivity.activity)}
                      onMouseLeave={handleActivityMouseLeave}
                    >
                      <span className="truncate">{timelineActivity.activity.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Empty state if no activities */}
            {Object.keys(groupedActivities).length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <span className="material-icons text-4xl mb-2">event_busy</span>
                <p>No activities for this time period</p>
                <p className="text-sm mt-1">Add an activity to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tooltip */}
      <div 
        ref={tooltipRef}
        className={`fixed bg-gray-900 text-white px-3 py-2 rounded text-sm z-50 max-w-xs pointer-events-none transition-opacity duration-200 whitespace-pre-wrap ${
          tooltipInfo.visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {tooltipInfo.text}
        <div className="tooltip-arrow absolute w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-gray-900 -bottom-[5px] left-1/2 transform -translate-x-1/2"></div>
      </div>
    </div>
  );
};

export default TimelineView;
