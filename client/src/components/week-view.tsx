import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from "date-fns";
import { Activity, Holiday } from "@shared/schema";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { getContrastTextColor } from "@/lib/utils";

interface WeekViewProps {
  activities: Activity[];
  holidays: Holiday[];
  year: number;
  month: number;
  weekNumber: number; // 1-5 representing the week of the month
  onActivityClick?: (activity: Activity) => void;
  onActivityContextMenu?: (event: React.MouseEvent, activity: Activity) => void;
}

export default function WeekView({ 
  activities, 
  holidays, 
  year,
  month,
  weekNumber,
  onActivityClick,
  onActivityContextMenu
}: WeekViewProps) {
  // Calculate the week's start and end date
  const monthStart = new Date(year, month, 1);
  const firstDayOfMonth = startOfWeek(monthStart);
  // Adjust to get the correct week within the month
  const weekStart = addDays(firstDayOfMonth, (weekNumber - 1) * 7);
  const weekEnd = endOfWeek(weekStart);
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Filter activities that overlap with the week
  const [visibleActivities, setVisibleActivities] = useState<Activity[]>([]);
  
  useEffect(() => {
    const filtered = activities.filter(activity => {
      const activityStart = new Date(activity.startDate);
      const activityEnd = new Date(activity.endDate);
      
      return (
        (activityStart <= weekEnd && activityEnd >= weekStart)
      );
    });
    
    setVisibleActivities(filtered);
  }, [activities, weekStart, weekEnd]);
  
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  
  const handleActivityMouseEnter = (event: React.MouseEvent, activity: Activity) => {
    const activityStart = new Date(activity.startDate);
    const activityEnd = new Date(activity.endDate);
    
    // Include description in the tooltip if available
    let content = `${activity.title} (${ACTIVITY_TYPES[activity.type as keyof typeof ACTIVITY_TYPES].label}) - ${format(activityStart, "MMM d, yyyy")} to ${format(activityEnd, "MMM d, yyyy")}`;
    
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
  
  // Group activities by activity type
  const projectActivities = visibleActivities.filter(a => a.type === 'project');
  const courseDevActivities = visibleActivities.filter(a => a.type === 'meeting');
  const confirmedActivities = visibleActivities.filter(a => a.status === 'confirmed');
  const tentativeActivities = visibleActivities.filter(a => a.status === 'tentative');
  const hypotheticalActivities = visibleActivities.filter(a => a.status === 'hypothetical');
  const holidayActivities = visibleActivities.filter(a => a.type === 'holiday');
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-medium">Week View ({format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")})</h2>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-max p-4">
          {/* Days of week header */}
          <div className="flex border-b">
            {daysInWeek.map((day) => (
              <div 
                key={format(day, "yyyy-MM-dd")} 
                className="day-column text-center py-2 font-medium text-sm border-r last:border-r-0"
                style={{ width: "100px", minWidth: "100px" }}
              >
                <div>{format(day, "d")}</div>
                <div className="text-xs text-gray-500">{format(day, "EEE")}</div>
              </div>
            ))}
          </div>
          
          {/* Activity rows by type */}
          <div className="activity-rows">
            {projectActivities.length > 0 && (
              <div className="activity-row border-b py-3">
                <div className="font-medium mb-2">Projects</div>
                <div className="relative h-6 flex">
                  {daysInWeek.map((day) => (
                    <div 
                      key={format(day, "yyyy-MM-dd")} 
                      className="day-cell border-r last:border-r-0"
                      style={{ width: "100px", minWidth: "100px" }}
                    ></div>
                  ))}
                  
                  {projectActivities.map((activity) => {
                    const activityStart = new Date(activity.startDate);
                    const activityEnd = new Date(activity.endDate);
                    
                    const startDay = Math.max(
                      0,
                      Math.floor((activityStart.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const endDay = Math.min(
                      6,
                      Math.floor((activityEnd.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const width = (endDay - startDay + 1) * 100;
                    const left = startDay * 100;
                    
                    const type = activity.type as keyof typeof ACTIVITY_TYPES;
                    const { color } = ACTIVITY_TYPES[type];
                    const textColor = getContrastTextColor(color);
                    
                    return (
                      <div
                        key={activity.id}
                        className={`activity absolute top-0 h-full ${color} rounded-full px-3 py-1 ${textColor} text-xs flex items-center cursor-pointer`}
                        style={{ 
                          left: `${left}px`, 
                          width: `${width}px`, 
                          zIndex: 10 
                        }}
                        onMouseEnter={(e) => handleActivityMouseEnter(e, activity)}
                        onMouseLeave={handleActivityMouseLeave}
                        onClick={() => onActivityClick && onActivityClick(activity)}
                        onContextMenu={(e) => onActivityContextMenu && onActivityContextMenu(e, activity)}
                        title={`${activity.title} (Right-click to delete)`}
                      >
                        <span className="truncate">{activity.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {courseDevActivities.length > 0 && (
              <div className="activity-row border-b py-3">
                <div className="font-medium mb-2">Course Development</div>
                <div className="relative h-6 flex">
                  {daysInWeek.map((day) => (
                    <div 
                      key={format(day, "yyyy-MM-dd")} 
                      className="day-cell border-r last:border-r-0"
                      style={{ width: "100px", minWidth: "100px" }}
                    ></div>
                  ))}
                  
                  {courseDevActivities.map((activity) => {
                    const activityStart = new Date(activity.startDate);
                    const activityEnd = new Date(activity.endDate);
                    
                    const startDay = Math.max(
                      0,
                      Math.floor((activityStart.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const endDay = Math.min(
                      6,
                      Math.floor((activityEnd.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const width = (endDay - startDay + 1) * 100;
                    const left = startDay * 100;
                    
                    const type = activity.type as keyof typeof ACTIVITY_TYPES;
                    const { color } = ACTIVITY_TYPES[type];
                    const textColor = getContrastTextColor(color);
                    
                    return (
                      <div
                        key={activity.id}
                        className={`activity absolute top-0 h-full ${color} rounded-full px-3 py-1 ${textColor} text-xs flex items-center cursor-pointer`}
                        style={{ 
                          left: `${left}px`, 
                          width: `${width}px`, 
                          zIndex: 10 
                        }}
                        onMouseEnter={(e) => handleActivityMouseEnter(e, activity)}
                        onMouseLeave={handleActivityMouseLeave}
                        onClick={() => onActivityClick && onActivityClick(activity)}
                        onContextMenu={(e) => onActivityContextMenu && onActivityContextMenu(e, activity)}
                        title={`${activity.title} (Right-click to delete)`}
                      >
                        <span className="truncate">{activity.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {confirmedActivities.length > 0 && (
              <div className="activity-row border-b py-3">
                <div className="font-medium mb-2">Confirmed Activities</div>
                <div className="relative h-6 flex">
                  {daysInWeek.map((day) => (
                    <div 
                      key={format(day, "yyyy-MM-dd")} 
                      className="day-cell border-r last:border-r-0"
                      style={{ width: "100px", minWidth: "100px" }}
                    ></div>
                  ))}
                  
                  {confirmedActivities.map((activity) => {
                    const activityStart = new Date(activity.startDate);
                    const activityEnd = new Date(activity.endDate);
                    
                    const startDay = Math.max(
                      0,
                      Math.floor((activityStart.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const endDay = Math.min(
                      6,
                      Math.floor((activityEnd.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const width = (endDay - startDay + 1) * 100;
                    const left = startDay * 100;
                    
                    const type = activity.type as keyof typeof ACTIVITY_TYPES;
                    const { color } = ACTIVITY_TYPES[type];
                    const textColor = getContrastTextColor(color);
                    
                    return (
                      <div
                        key={activity.id}
                        className={`activity absolute top-0 h-full ${color} rounded-full px-3 py-1 ${textColor} text-xs flex items-center cursor-pointer`}
                        style={{ 
                          left: `${left}px`, 
                          width: `${width}px`, 
                          zIndex: 10 
                        }}
                        onMouseEnter={(e) => handleActivityMouseEnter(e, activity)}
                        onMouseLeave={handleActivityMouseLeave}
                        onClick={() => onActivityClick && onActivityClick(activity)}
                        onContextMenu={(e) => onActivityContextMenu && onActivityContextMenu(e, activity)}
                        title={`${activity.title} (Right-click to delete)`}
                      >
                        <span className="truncate">{activity.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {tentativeActivities.length > 0 && (
              <div className="activity-row border-b py-3">
                <div className="font-medium mb-2">Tentative Activities</div>
                <div className="relative h-6 flex">
                  {daysInWeek.map((day) => (
                    <div 
                      key={format(day, "yyyy-MM-dd")} 
                      className="day-cell border-r last:border-r-0"
                      style={{ width: "100px", minWidth: "100px" }}
                    ></div>
                  ))}
                  
                  {tentativeActivities.map((activity) => {
                    const activityStart = new Date(activity.startDate);
                    const activityEnd = new Date(activity.endDate);
                    
                    const startDay = Math.max(
                      0,
                      Math.floor((activityStart.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const endDay = Math.min(
                      6,
                      Math.floor((activityEnd.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const width = (endDay - startDay + 1) * 100;
                    const left = startDay * 100;
                    
                    const type = activity.type as keyof typeof ACTIVITY_TYPES;
                    const { color } = ACTIVITY_TYPES[type];
                    const textColor = getContrastTextColor(color);
                    
                    return (
                      <div
                        key={activity.id}
                        className={`activity absolute top-0 h-full ${color} rounded-full px-3 py-1 ${textColor} text-xs flex items-center cursor-pointer`}
                        style={{ 
                          left: `${left}px`, 
                          width: `${width}px`, 
                          zIndex: 10 
                        }}
                        onMouseEnter={(e) => handleActivityMouseEnter(e, activity)}
                        onMouseLeave={handleActivityMouseLeave}
                        onClick={() => onActivityClick && onActivityClick(activity)}
                        onContextMenu={(e) => onActivityContextMenu && onActivityContextMenu(e, activity)}
                        title={`${activity.title} (Right-click to delete)`}
                      >
                        <span className="truncate">{activity.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {hypotheticalActivities.length > 0 && (
              <div className="activity-row border-b py-3">
                <div className="font-medium mb-2">Hypothetical Activities</div>
                <div className="relative h-6 flex">
                  {daysInWeek.map((day) => (
                    <div 
                      key={format(day, "yyyy-MM-dd")} 
                      className="day-cell border-r last:border-r-0"
                      style={{ width: "100px", minWidth: "100px" }}
                    ></div>
                  ))}
                  
                  {hypotheticalActivities.map((activity) => {
                    const activityStart = new Date(activity.startDate);
                    const activityEnd = new Date(activity.endDate);
                    
                    const startDay = Math.max(
                      0,
                      Math.floor((activityStart.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const endDay = Math.min(
                      6,
                      Math.floor((activityEnd.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const width = (endDay - startDay + 1) * 100;
                    const left = startDay * 100;
                    
                    const type = activity.type as keyof typeof ACTIVITY_TYPES;
                    const { color } = ACTIVITY_TYPES[type];
                    const textColor = getContrastTextColor(color);
                    
                    return (
                      <div
                        key={activity.id}
                        className={`activity absolute top-0 h-full ${color} rounded-full px-3 py-1 ${textColor} text-xs flex items-center cursor-pointer`}
                        style={{ 
                          left: `${left}px`, 
                          width: `${width}px`, 
                          zIndex: 10 
                        }}
                        onMouseEnter={(e) => handleActivityMouseEnter(e, activity)}
                        onMouseLeave={handleActivityMouseLeave}
                        onClick={() => onActivityClick && onActivityClick(activity)}
                        onContextMenu={(e) => onActivityContextMenu && onActivityContextMenu(e, activity)}
                        title={`${activity.title} (Right-click to delete)`}
                      >
                        <span className="truncate">{activity.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {holidayActivities.length > 0 && (
              <div className="activity-row border-b py-3">
                <div className="font-medium mb-2">Holidays</div>
                <div className="relative h-6 flex">
                  {daysInWeek.map((day) => (
                    <div 
                      key={format(day, "yyyy-MM-dd")} 
                      className="day-cell border-r last:border-r-0"
                      style={{ width: "100px", minWidth: "100px" }}
                    ></div>
                  ))}
                  
                  {holidayActivities.map((activity) => {
                    const activityStart = new Date(activity.startDate);
                    const activityEnd = new Date(activity.endDate);
                    
                    const startDay = Math.max(
                      0,
                      Math.floor((activityStart.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const endDay = Math.min(
                      6,
                      Math.floor((activityEnd.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const width = (endDay - startDay + 1) * 100;
                    const left = startDay * 100;
                    
                    const type = activity.type as keyof typeof ACTIVITY_TYPES;
                    const { color } = ACTIVITY_TYPES[type];
                    const textColor = getContrastTextColor(color);
                    
                    return (
                      <div
                        key={activity.id}
                        className={`activity absolute top-0 h-full ${color} rounded-full px-3 py-1 ${textColor} text-xs flex items-center cursor-pointer`}
                        style={{ 
                          left: `${left}px`, 
                          width: `${width}px`, 
                          zIndex: 10 
                        }}
                        onMouseEnter={(e) => handleActivityMouseEnter(e, activity)}
                        onMouseLeave={handleActivityMouseLeave}
                        onClick={() => onActivityClick && onActivityClick(activity)}
                        onContextMenu={(e) => onActivityContextMenu && onActivityContextMenu(e, activity)}
                        title={`${activity.title} (Right-click to delete)`}
                      >
                        <span className="truncate">{activity.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* If there are no activities, show empty state */}
            {visibleActivities.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
                <span className="material-icons text-4xl mb-2">event_busy</span>
                <p>No activities for this week</p>
              </div>
            )}
          </div>
          
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