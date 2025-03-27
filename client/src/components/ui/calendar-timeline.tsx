import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Activity } from "@shared/schema";
import { ACTIVITY_TYPES, SHORT_MONTHS } from "@/lib/constants";

interface TimelineProps {
  year: number;
  activities: Activity[];
  onActivityClick?: (activity: Activity) => void;
  className?: string;
  zoomLevel?: number;
}

export function CalendarTimeline({
  year,
  activities,
  onActivityClick,
  className,
  zoomLevel = 1,
}: TimelineProps) {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    content: string;
    x: number;
    y: number;
  }>({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      // Apply zoom level to months
      const months = container.querySelectorAll(".timeline-month");
      
      months.forEach((month) => {
        if (month instanceof HTMLElement) {
          let baseWidth = '80px'; // Default for desktop
          
          if (window.innerWidth <= 640) {
            baseWidth = '240px'; // Mobile
          } else if (window.innerWidth <= 1024) {
            baseWidth = '120px'; // Tablet
          }
          
          month.style.minWidth = `calc(${baseWidth} * ${zoomLevel})`;
        }
      });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [zoomLevel]);

  const periodStart = new Date(year, 0, 1);
  const periodEnd = new Date(year, 11, 31);

  const getPositionAndWidth = (activity: Activity) => {
    const activityStart = new Date(activity.startDate);
    const activityEnd = new Date(activity.endDate);
    
    // Ensure dates are within period
    const effectiveStart = activityStart < periodStart ? periodStart : activityStart;
    const effectiveEnd = activityEnd > periodEnd ? periodEnd : activityEnd;
    
    // Calculate total days in period and activity duration
    const totalDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24) + 1;
    const daysFromStart = (effectiveStart.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
    const activityDays = (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24) + 1;
    
    const left = (daysFromStart / totalDays) * 100;
    const width = (activityDays / totalDays) * 100;
    
    return { left, width };
  };

  const handleActivityMouseEnter = (e: React.MouseEvent, activity: Activity) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const activityStart = new Date(activity.startDate);
    const activityEnd = new Date(activity.endDate);
    
    const type = activity.type as keyof typeof ACTIVITY_TYPES;
    const typeLabel = ACTIVITY_TYPES[type].label;
    
    setTooltip({
      visible: true,
      content: `${activity.title} (${typeLabel}) - ${format(activityStart, "MMM d, yyyy")} to ${format(activityEnd, "MMM d, yyyy")}`,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleActivityMouseLeave = () => {
    setTooltip({ ...tooltip, visible: false });
  };

  // Group activities by category for display
  const groupedActivities = {
    projects: activities.filter(a => a.title.toLowerCase().includes('project')),
    meetings: activities.filter(a => a.title.toLowerCase().includes('meeting')),
    holidays: activities.filter(a => a.type === 'holiday'),
    trainings: activities.filter(a => 
      a.title.toLowerCase().includes('training') || 
      a.title.toLowerCase().includes('conference')
    ),
    others: activities.filter(a => 
      !a.title.toLowerCase().includes('project') && 
      !a.title.toLowerCase().includes('meeting') && 
      a.type !== 'holiday' &&
      !a.title.toLowerCase().includes('training') &&
      !a.title.toLowerCase().includes('conference')
    )
  };

  return (
    <div className={cn("overflow-hidden", className)} ref={containerRef}>
      <div className="min-w-max">
        {/* Month Headers */}
        <div className="flex border-b">
          {SHORT_MONTHS.map((month, i) => (
            <div 
              key={`${month}-${year}`} 
              className="timeline-month text-center py-2 font-medium text-sm border-r last:border-r-0"
            >
              {`${month} ${year}`}
            </div>
          ))}
        </div>

        {/* Activity Rows */}
        <div className="relative min-h-[400px]">
          {Object.entries(groupedActivities).map(([groupKey, groupActivities]) => {
            if (groupActivities.length === 0) return null;
            
            const groupName = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
            
            return (
              <div key={groupKey} className="border-b py-3 px-2 hover:bg-gray-50">
                <div className="font-medium mb-2">{groupName}</div>
                
                <div className="relative h-6">
                  {groupActivities.map((activity) => {
                    const { left, width } = getPositionAndWidth(activity);
                    const type = activity.type as keyof typeof ACTIVITY_TYPES;
                    const { color } = ACTIVITY_TYPES[type];
                    
                    // Determine text color based on background
                    let textColor = "text-white";
                    if (type === "hypothetical") textColor = "text-black";
                    
                    return (
                      <div
                        key={activity.id}
                        className={`activity absolute top-0 h-full ${color} rounded-full px-3 py-1 ${textColor} text-xs flex items-center cursor-pointer`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        onMouseEnter={(e) => handleActivityMouseEnter(e, activity)}
                        onMouseLeave={handleActivityMouseLeave}
                        onClick={() => onActivityClick?.(activity)}
                      >
                        <span className="truncate">{activity.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {/* Empty state */}
          {activities.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
              <span className="material-icons text-4xl mb-2">event_busy</span>
              <p>No activities for {year}</p>
              <p className="text-sm mt-1">Add activities to see them on the timeline</p>
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed bg-gray-800 text-white px-3 py-1.5 rounded text-xs z-50 shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y - 10,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {tooltip.content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
}
