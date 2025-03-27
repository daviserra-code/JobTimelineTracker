import { useState, useEffect } from "react";
import { format, startOfDay, endOfDay, eachHourOfInterval } from "date-fns";
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
}

export default function DayView({ 
  activities, 
  holidays, 
  year,
  month,
  day,
  onActivityClick 
}: DayViewProps) {
  // Set up day boundaries
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
  
  // Group activities by activity type
  const projectActivities = visibleActivities.filter(a => a.type === 'project');
  const meetingActivities = visibleActivities.filter(a => a.type === 'meeting');
  const confirmedActivities = visibleActivities.filter(a => a.type === 'confirmed');
  const tentativeActivities = visibleActivities.filter(a => a.type === 'tentative');
  const hypotheticalActivities = visibleActivities.filter(a => a.type === 'hypothetical');
  const holidayActivities = visibleActivities.filter(a => a.type === 'holiday');
  
  // Check if the current day is a holiday
  const isHoliday = holidays.some(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate.getFullYear() === year &&
           holidayDate.getMonth() === month &&
           holidayDate.getDate() === day;
  });
  
  const holidayInfo = holidays.find(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate.getFullYear() === year &&
           holidayDate.getMonth() === month &&
           holidayDate.getDate() === day;
  });
  
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
            {hours.map((hour, index) => {
              // Find activities that overlap with this hour
              const hourActivities = visibleActivities.filter(activity => {
                const activityStart = new Date(activity.startDate);
                const activityEnd = new Date(activity.endDate);
                
                const hourStart = hour;
                const hourEnd = new Date(hour);
                hourEnd.setHours(hourEnd.getHours() + 1);
                
                return (activityStart < hourEnd && activityEnd >= hourStart);
              });
              
              return (
                <div 
                  key={format(hour, "HH:mm")} 
                  className={`flex border-b py-2 ${index % 2 === 0 ? 'bg-gray-50' : ''}`}
                >
                  <div className="w-24 text-sm border-r pr-2 text-right">
                    {format(hour, "h:mm a")}
                  </div>
                  
                  <div className="flex-1 relative min-h-[30px] pl-2">
                    {hourActivities.map((activity, activityIndex) => {
                      const type = activity.type as keyof typeof ACTIVITY_TYPES;
                      const { color } = ACTIVITY_TYPES[type];
                      const textColor = getContrastTextColor(color);
                      
                      return (
                        <div
                          key={activity.id}
                          className={`m-1 ${color} rounded-md px-3 py-1 ${textColor} text-xs flex items-center cursor-pointer`}
                          style={{ 
                            marginTop: `${activityIndex * 26}px`,
                            zIndex: 10 
                          }}
                          onMouseEnter={(e) => handleActivityMouseEnter(e, activity)}
                          onMouseLeave={handleActivityMouseLeave}
                          onClick={() => onActivityClick && onActivityClick(activity)}
                        >
                          <span className="truncate">{activity.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {/* If there are no activities, show empty state */}
            {visibleActivities.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                <span className="material-icons text-4xl mb-2">event_busy</span>
                <p>No activities for {format(dayDate, "MMMM d, yyyy")}</p>
                <p className="text-sm mt-1">Add activities to see them on the timeline</p>
              </div>
            )}
          </div>
        </div>
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