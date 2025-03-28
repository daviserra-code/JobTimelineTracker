import { useState, useEffect, useMemo } from "react";
import { format, eachHourOfInterval, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { Activity, Holiday } from "@shared/schema";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { getContrastTextColor } from "@/lib/utils";

interface DayViewProps {
  activities: Activity[];
  holidays: Holiday[];
  year: number;
  month: number;
  day: number;
  onActivityClick?: (activity: Activity) => void;
  onActivityContextMenu?: (event: React.MouseEvent, activity: Activity) => void;
}

export default function DayView({ 
  activities, 
  holidays, 
  year,
  month,
  day,
  onActivityClick,
  onActivityContextMenu
}: DayViewProps) {
  // Day date
  const dayDate = new Date(year, month, day);
  const dayStart = startOfDay(dayDate);
  const dayEnd = endOfDay(dayDate);
  
  // Generate hours for the day
  const hours = eachHourOfInterval({ start: dayStart, end: dayEnd });
  
  // Filter activities that overlap with the day
  const [visibleActivities, setVisibleActivities] = useState<Activity[]>([]);
  
  useEffect(() => {
    const filtered = activities.filter(activity => {
      const activityStart = new Date(activity.startDate);
      const activityEnd = new Date(activity.endDate);
      
      return (
        (activityStart <= dayEnd && activityEnd >= dayStart)
      );
    });
    
    setVisibleActivities(filtered);
  }, [activities, dayStart, dayEnd]);
  
  // Check if this day is a holiday
  const holiday = useMemo(() => 
    holidays.find(h => 
      format(new Date(h.date), 'yyyy-MM-dd') === format(dayDate, 'yyyy-MM-dd')
    ),
    [holidays, dayDate]
  );
  
  const isHoliday = !!holiday;
  const holidayInfo = holiday;
  
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  
  const handleActivityMouseEnter = (event: React.MouseEvent, activity: Activity) => {
    const activityStart = new Date(activity.startDate);
    const activityEnd = new Date(activity.endDate);
    
    const type = activity.type as keyof typeof ACTIVITY_TYPES;
    const { label } = ACTIVITY_TYPES[type];
    
    // Include description in the tooltip if available
    let content = `${activity.title} (${label}) - ${format(activityStart, "h:mm a")} to ${format(activityEnd, "h:mm a")}`;
    
    if (activity.description) {
      content += `\nDescription: ${activity.description}`;
    }
    
    if (activity.location) {
      content += `\nLocation: ${activity.location}`;
    }
    
    if (activity.category) {
      content += `\nCategory: ${activity.category}`;
    }
    
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
  
  // Group activities by type (for legends and filtering)
  const projectActivities = useMemo(() => 
    visibleActivities.filter((a: Activity) => a.type === 'project'),
    [visibleActivities]
  );
  
  const meetingActivities = useMemo(() => 
    visibleActivities.filter((a: Activity) => a.type === 'meeting'),
    [visibleActivities]
  );
  
  const confirmedActivities = useMemo(() => 
    visibleActivities.filter((a: Activity) => a.status === 'confirmed'),
    [visibleActivities]
  );
  
  const tentativeActivities = useMemo(() => 
    visibleActivities.filter((a: Activity) => a.status === 'tentative'),
    [visibleActivities]
  );
  
  const hypotheticalActivities = useMemo(() => 
    visibleActivities.filter((a: Activity) => a.status === 'hypothetical'),
    [visibleActivities]
  );
  
  const holidayActivities = useMemo(() => 
    visibleActivities.filter((a: Activity) => a.type === 'holiday'),
    [visibleActivities]
  );
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
      <div className={`border-b px-4 py-3 ${isHoliday ? 'bg-red-50' : ''}`}>
        <h2 className="text-lg font-medium">
          Day View ({format(dayDate, "EEEE, MMMM d, yyyy")})
          {isHoliday && holidayInfo && (
            <span className="ml-2 text-red-600 text-sm font-normal">
              Holiday: {holidayInfo.name}
            </span>
          )}
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-max p-4">
          {/* Hour headers */}
          <div className="flex border-b">
            <div className="w-24 py-2 font-medium text-sm border-r">Time</div>
            <div className="flex-1 py-2 font-medium text-sm">Activities</div>
          </div>
          
          {/* Hour rows */}
          <div className="hours-container">
            {hours.map((hour: Date, index: number) => {
              // Find activities that overlap with this hour
              const hourActivities = visibleActivities.filter((activity: Activity) => {
                const activityStart = new Date(activity.startDate);
                const activityEnd = new Date(activity.endDate);
                
                return isWithinInterval(hour, { start: activityStart, end: activityEnd }) ||
                       (format(activityStart, 'HH') === format(hour, 'HH') && format(activityStart, 'yyyy-MM-dd') === format(hour, 'yyyy-MM-dd'));
              });
              
              return (
                <div key={index} className="flex border-b last:border-b-0 hover:bg-gray-50">
                  <div className="w-24 py-2 text-sm border-r text-gray-500">
                    {format(hour, "h:mm a")}
                  </div>
                  <div className="flex-1 py-2 relative min-h-[3rem]">
                    {hourActivities.length === 0 && (
                      <div className="text-gray-300 text-sm italic">No activities</div>
                    )}
                    
                    {hourActivities.map((activity: Activity, activityIndex: number) => {
                      const type = activity.type as keyof typeof ACTIVITY_TYPES;
                      const { color } = ACTIVITY_TYPES[type];
                      const textColor = getContrastTextColor(color);
                      
                      return (
                        <div 
                          key={`${activity.id}-${activityIndex}`}
                          className={`${color} rounded px-3 py-1 mb-1 last:mb-0 ${textColor} text-sm truncate cursor-pointer`}
                          onClick={() => onActivityClick && onActivityClick(activity)}
                          onContextMenu={(e) => onActivityContextMenu && onActivityContextMenu(e, activity)}
                          onMouseEnter={(e) => handleActivityMouseEnter(e, activity)}
                          onMouseLeave={handleActivityMouseLeave}
                          title={`${activity.title} (Right-click to delete)`}
                        >
                          {activity.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* No activities state */}
          {visibleActivities.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[200px] text-gray-500 mt-4">
              <span className="material-icons text-4xl mb-2">event_busy</span>
              <p>No activities for {format(dayDate, "MMMM d, yyyy")}</p>
            </div>
          )}
          
          {/* Tooltip */}
          {isTooltipVisible && (
            <div
              className="fixed bg-gray-800 text-white px-3 py-1.5 rounded text-xs z-50 shadow-lg max-w-[300px] whitespace-pre-wrap"
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
      </div>
    </div>
  );
}