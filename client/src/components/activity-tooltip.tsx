import { useRef, useState, useEffect } from "react";
import { Activity } from "@shared/schema";
import { format } from "date-fns";
import { ACTIVITY_TYPES } from "@/lib/constants";

interface ActivityTooltipProps {
  activity: Activity | null;
  position: { x: number; y: number } | null;
  visible: boolean;
}

export default function ActivityTooltip({ activity, position, visible }: ActivityTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ left: "0px", top: "0px" });

  useEffect(() => {
    if (tooltipRef.current && position && visible) {
      const tooltipWidth = tooltipRef.current.offsetWidth;
      const tooltipHeight = tooltipRef.current.offsetHeight;
      
      // Calculate position to make sure tooltip is visible
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let left = position.x - tooltipWidth / 2;
      let top = position.y - tooltipHeight - 10;
      
      // Adjust if the tooltip goes beyond the viewport
      if (left < 10) left = 10;
      if (left + tooltipWidth > viewportWidth - 10) left = viewportWidth - tooltipWidth - 10;
      if (top < 10) top = position.y + 10; // Show below if not enough space above
      
      setTooltipPosition({
        left: `${left}px`,
        top: `${top}px`,
      });
    }
  }, [position, visible]);

  if (!activity || !position || !visible) return null;

  const activityTypeInfo = ACTIVITY_TYPES[activity.type as keyof typeof ACTIVITY_TYPES];
  const activityStart = new Date(activity.startDate);
  const activityEnd = new Date(activity.endDate);

  return (
    <div
      ref={tooltipRef}
      className="fixed bg-gray-800 text-white px-3 py-2 rounded text-sm z-50 shadow-lg max-w-xs"
      style={{
        left: tooltipPosition.left,
        top: tooltipPosition.top,
        opacity: visible ? 1 : 0,
        pointerEvents: "none",
      }}
    >
      <div className="font-medium mb-1">{activity.title}</div>
      <div className="text-xs flex items-center mb-1">
        <div className={`w-2 h-2 rounded-full ${activityTypeInfo.color} mr-1.5`}></div>
        <span>{activityTypeInfo.label}</span>
      </div>
      {activity.description && (
        <div className="text-xs mb-1 text-gray-300">{activity.description}</div>
      )}
      <div className="text-xs mt-1">
        {format(activityStart, "MMM d, yyyy")} - {format(activityEnd, "MMM d, yyyy")}
      </div>
      <div className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" style={{ top: "100%" }}></div>
    </div>
  );
}
