import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { Activity, Holiday } from "@shared/schema";
import { ACTIVITY_TYPES, DAYS_OF_WEEK } from "@/lib/constants";
import { getContrastTextColor } from "@/lib/utils";

interface MonthViewProps {
  activities: Activity[];
  holidays: Holiday[];
  year: number;
  month: number;
  onActivityClick?: (activity: Activity) => void;
}

export default function MonthView({ 
  activities, 
  holidays, 
  year,
  month,
  onActivityClick 
}: MonthViewProps) {
  // Get all days in the month - now using useMemo to avoid recreation on every render
  const { monthStart, monthEnd, daysInMonth, visibleActivities } = useMemo(() => {
    const monthStart = startOfMonth(new Date(year, month, 1));
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Filter activities that overlap with the month
    const visibleActivities = activities.filter(activity => {
      const activityStart = new Date(activity.startDate);
      const activityEnd = new Date(activity.endDate);
      
      return (
        (activityStart <= monthEnd && activityEnd >= monthStart)
      );
    });
    
    return { monthStart, monthEnd, daysInMonth, visibleActivities };
  }, [year, month, activities]);
  
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
  const projectActivities = visibleActivities.filter((a: Activity) => a.type === 'project');
  const meetingActivities = visibleActivities.filter((a: Activity) => a.type === 'meeting');
  const confirmedActivities = visibleActivities.filter((a: Activity) => a.status === 'confirmed');
  const tentativeActivities = visibleActivities.filter((a: Activity) => a.status === 'tentative');
  const hypotheticalActivities = visibleActivities.filter((a: Activity) => a.status === 'hypothetical');
  const holidayActivities = visibleActivities.filter((a: Activity) => a.type === 'holiday');
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-medium">Month View ({format(monthStart, "MMMM yyyy")})</h2>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-max p-4">
          {/* Days of month header */}
          <div className="flex border-b">
            {daysInMonth.map((day: Date) => (
              <div 
                key={format(day, "yyyy-MM-dd")} 
                className="day-column text-center py-2 font-medium text-sm border-r last:border-r-0"
                style={{ width: "40px", minWidth: "40px" }}
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
                  {daysInMonth.map((day: Date) => (
                    <div 
                      key={format(day, "yyyy-MM-dd")} 
                      className="day-cell border-r last:border-r-0"
                      style={{ width: "40px", minWidth: "40px" }}
                    ></div>
                  ))}
                  
                  {projectActivities.map((activity: Activity) => {
                    const activityStart = new Date(activity.startDate);
                    const activityEnd = new Date(activity.endDate);
                    
                    // Calculate position and width based on days in view
                    const startDay = Math.max(
                      0,
                      Math.floor((activityStart.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const endDay = Math.min(
                      daysInMonth.length - 1,
                      Math.floor((activityEnd.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const width = (endDay - startDay + 1) * 40;
                    const left = startDay * 40;
                    
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
                      >
                        <span className="truncate">{activity.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {meetingActivities.length > 0 && (
              <div className="activity-row border-b py-3">
                <div className="font-medium mb-2">Meetings</div>
                <div className="relative h-6 flex">
                  {daysInMonth.map((day: Date) => (
                    <div 
                      key={format(day, "yyyy-MM-dd")} 
                      className="day-cell border-r last:border-r-0"
                      style={{ width: "40px", minWidth: "40px" }}
                    ></div>
                  ))}
                  
                  {meetingActivities.map((activity: Activity) => {
                    const activityStart = new Date(activity.startDate);
                    const activityEnd = new Date(activity.endDate);
                    
                    // Calculate position and width based on days in view
                    const startDay = Math.max(
                      0,
                      Math.floor((activityStart.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const endDay = Math.min(
                      daysInMonth.length - 1,
                      Math.floor((activityEnd.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const width = (endDay - startDay + 1) * 40;
                    const left = startDay * 40;
                    
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
                  {daysInMonth.map((day: Date) => (
                    <div 
                      key={format(day, "yyyy-MM-dd")} 
                      className="day-cell border-r last:border-r-0"
                      style={{ width: "40px", minWidth: "40px" }}
                    ></div>
                  ))}
                  
                  {confirmedActivities.map((activity: Activity) => {
                    const activityStart = new Date(activity.startDate);
                    const activityEnd = new Date(activity.endDate);
                    
                    // Calculate position and width based on days in view
                    const startDay = Math.max(
                      0,
                      Math.floor((activityStart.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const endDay = Math.min(
                      daysInMonth.length - 1,
                      Math.floor((activityEnd.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const width = (endDay - startDay + 1) * 40;
                    const left = startDay * 40;
                    
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
                  {daysInMonth.map((day: Date) => (
                    <div 
                      key={format(day, "yyyy-MM-dd")} 
                      className="day-cell border-r last:border-r-0"
                      style={{ width: "40px", minWidth: "40px" }}
                    ></div>
                  ))}
                  
                  {tentativeActivities.map((activity: Activity) => {
                    const activityStart = new Date(activity.startDate);
                    const activityEnd = new Date(activity.endDate);
                    
                    // Calculate position and width based on days in view
                    const startDay = Math.max(
                      0,
                      Math.floor((activityStart.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const endDay = Math.min(
                      daysInMonth.length - 1,
                      Math.floor((activityEnd.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const width = (endDay - startDay + 1) * 40;
                    const left = startDay * 40;
                    
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
                  {daysInMonth.map((day: Date) => (
                    <div 
                      key={format(day, "yyyy-MM-dd")} 
                      className="day-cell border-r last:border-r-0"
                      style={{ width: "40px", minWidth: "40px" }}
                    ></div>
                  ))}
                  
                  {hypotheticalActivities.map((activity: Activity) => {
                    const activityStart = new Date(activity.startDate);
                    const activityEnd = new Date(activity.endDate);
                    
                    // Calculate position and width based on days in view
                    const startDay = Math.max(
                      0,
                      Math.floor((activityStart.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const endDay = Math.min(
                      daysInMonth.length - 1,
                      Math.floor((activityEnd.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const width = (endDay - startDay + 1) * 40;
                    const left = startDay * 40;
                    
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
                  {daysInMonth.map((day: Date) => (
                    <div 
                      key={format(day, "yyyy-MM-dd")} 
                      className="day-cell border-r last:border-r-0"
                      style={{ width: "40px", minWidth: "40px" }}
                    ></div>
                  ))}
                  
                  {holidayActivities.map((activity: Activity) => {
                    const activityStart = new Date(activity.startDate);
                    const activityEnd = new Date(activity.endDate);
                    
                    // Calculate position and width based on days in view
                    const startDay = Math.max(
                      0,
                      Math.floor((activityStart.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const endDay = Math.min(
                      daysInMonth.length - 1,
                      Math.floor((activityEnd.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000))
                    );
                    
                    const width = (endDay - startDay + 1) * 40;
                    const left = startDay * 40;
                    
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
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                <span className="material-icons text-4xl mb-2">event_busy</span>
                <p>No activities for {format(monthStart, "MMMM yyyy")}</p>
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