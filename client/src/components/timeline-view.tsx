import { useState, useRef, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import { Activity, Holiday } from "@shared/schema";
import { ACTIVITY_TYPES, SHORT_MONTHS } from "@/lib/constants";
import { getWidthPercentage, getLeftPositionPercentage, getContrastTextColor } from "@/lib/utils";

interface TimelineMonthHeaderProps {
  year: number;
}

function TimelineMonthHeader({ year }: TimelineMonthHeaderProps) {
  return (
    <div className="flex border-b">
      {SHORT_MONTHS.map((month, index) => (
        <div key={`${month}-${year}`} className="timeline-month text-center py-2 font-medium text-sm border-r last:border-r-0">
          {`${month} ${year}`}
        </div>
      ))}
    </div>
  );
}

interface TimelineActivityRowProps {
  title: string;
  activities: Activity[];
  year: number;
  onActivityClick?: (activity: Activity) => void;
}

function TimelineActivityRow({ title, activities, year, onActivityClick }: TimelineActivityRowProps) {
  const periodStart = new Date(year, 0, 1);
  const periodEnd = new Date(year, 11, 31);
  
  // Filter activities that overlap with the current year
  const visibleActivities = activities.filter(activity => {
    const activityStart = new Date(activity.startDate);
    const activityEnd = new Date(activity.endDate);
    
    return (
      (activityStart.getFullYear() <= year && activityEnd.getFullYear() >= year) ||
      (activityStart.getFullYear() === year) ||
      (activityEnd.getFullYear() === year)
    );
  });
  
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  
  const handleActivityMouseEnter = (event: React.MouseEvent, activity: Activity) => {
    const activityStart = new Date(activity.startDate);
    const activityEnd = new Date(activity.endDate);
    
    const content = `${activity.title} (${ACTIVITY_TYPES[activity.type as keyof typeof ACTIVITY_TYPES].label}) - ${format(activityStart, "MMM d, yyyy")} to ${format(activityEnd, "MMM d, yyyy")}`;
    
    setTooltipContent(content);
    
    // Position the tooltip above the activity
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    
    setIsTooltipVisible(true);
  };
  
  const handleActivityMouseLeave = () => {
    setIsTooltipVisible(false);
  };
  
  if (visibleActivities.length === 0) {
    return null;
  }
  
  return (
    <div className="border-b py-3 px-2 hover:bg-gray-50">
      <div className="font-medium mb-2">{title}</div>
      
      <div className="relative h-6">
        {visibleActivities.map((activity) => {
          const activityStart = new Date(activity.startDate);
          const activityEnd = new Date(activity.endDate);
          
          // Calculate position and width based on the year's timeline
          const width = getWidthPercentage(activityStart, activityEnd, periodStart, periodEnd);
          const left = getLeftPositionPercentage(activityStart, periodStart, periodEnd);
          
          const type = activity.type as keyof typeof ACTIVITY_TYPES;
          const { color } = ACTIVITY_TYPES[type];
          const textColor = getContrastTextColor(color);
          
          return (
            <div
              key={activity.id}
              className={`activity absolute top-0 h-full ${color} rounded-full px-3 py-1 ${textColor} text-xs flex items-center cursor-pointer`}
              style={{ left: `${left}%`, width: `${width}%` }}
              onMouseEnter={(e) => handleActivityMouseEnter(e, activity)}
              onMouseLeave={handleActivityMouseLeave}
              onClick={() => onActivityClick && onActivityClick(activity)}
            >
              <span className="truncate">{activity.title}</span>
            </div>
          );
        })}
      </div>
      
      {isTooltipVisible && (
        <div
          className="fixed bg-gray-800 text-white px-3 py-1.5 rounded text-xs z-50 shadow-lg"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {tooltipContent}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
}

interface TimelineViewProps {
  activities: Activity[];
  holidays: Holiday[];
  year: number;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onActivityClick?: (activity: Activity) => void;
}

export default function TimelineView({ 
  activities, 
  holidays, 
  year,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onActivityClick
}: TimelineViewProps) {
  // Group activities by type for display
  const projectActivities = activities.filter(a => a.type === 'project');
  const meetingActivities = activities.filter(a => a.type === 'meeting');
  const holidayActivities = activities.filter(a => a.type === 'holiday');
  const confirmedActivities = activities.filter(a => a.type === 'confirmed');
  const tentativeActivities = activities.filter(a => a.type === 'tentative');
  const hypotheticalActivities = activities.filter(a => a.type === 'hypothetical');
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6 tour-timeline">
      <div className="border-b px-4 py-3 flex justify-between items-center">
        <h2 className="text-lg font-medium">Timeline View ({year})</h2>
        <div className="flex space-x-2">
          <button 
            className="p-1 rounded hover:bg-gray-100" 
            title="Zoom out (- key)"
            onClick={onZoomOut}
            data-zoom-out="true"
          >
            <span className="material-icons">zoom_out</span>
          </button>
          <button 
            className="p-1 rounded hover:bg-gray-100" 
            title="Zoom in (+ key)"
            onClick={onZoomIn}
            data-zoom-in="true"
          >
            <span className="material-icons">zoom_in</span>
          </button>
        </div>
      </div>
      
      <div className="timeline-container" style={{ overflowX: 'auto' }}>
        <div className="min-w-max">
          <TimelineMonthHeader year={year} />
          
          <div className="relative min-h-[400px]">
            {projectActivities.length > 0 && (
              <TimelineActivityRow 
                title="Projects" 
                activities={projectActivities} 
                year={year}
                onActivityClick={onActivityClick} 
              />
            )}
            
            {meetingActivities.length > 0 && (
              <TimelineActivityRow 
                title="Meetings" 
                activities={meetingActivities} 
                year={year}
                onActivityClick={onActivityClick} 
              />
            )}
            
            {confirmedActivities.length > 0 && (
              <TimelineActivityRow 
                title="Confirmed Activities" 
                activities={confirmedActivities} 
                year={year}
                onActivityClick={onActivityClick} 
              />
            )}
            
            {tentativeActivities.length > 0 && (
              <TimelineActivityRow 
                title="Tentative Activities" 
                activities={tentativeActivities} 
                year={year}
                onActivityClick={onActivityClick} 
              />
            )}
            
            {hypotheticalActivities.length > 0 && (
              <TimelineActivityRow 
                title="Hypothetical Activities" 
                activities={hypotheticalActivities} 
                year={year}
                onActivityClick={onActivityClick} 
              />
            )}
            
            {holidayActivities.length > 0 && (
              <TimelineActivityRow 
                title="Holidays" 
                activities={holidayActivities} 
                year={year}
                onActivityClick={onActivityClick} 
              />
            )}
            
            {/* If there are no activities, show empty state */}
            {activities.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                <span className="material-icons text-4xl mb-2">event_busy</span>
                <p>No activities for {year}</p>
                <p className="text-sm mt-1">Add activities to see them on the timeline</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
