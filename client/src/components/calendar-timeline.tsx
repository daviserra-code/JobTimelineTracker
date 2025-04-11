import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Activity, Holiday } from "@shared/schema";
import { ACTIVITY_TYPES, SHORT_MONTHS } from "@/lib/constants";
import { getWidthPercentage, getLeftPositionPercentage, getContrastTextColor } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, staggerContainer, slideInLeft, fadeInUp } from "@/lib/animations";

interface TimelineMonthHeaderProps {
  year: number;
}

export function TimelineMonthHeader({ year }: TimelineMonthHeaderProps) {
  return (
    <motion.div 
      className="flex border-b"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {SHORT_MONTHS.map((month, index) => (
        <motion.div 
          key={`${month}-${year}`} 
          className="timeline-month text-center py-2 font-medium text-sm border-r last:border-r-0"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          {`${month} ${year}`}
        </motion.div>
      ))}
    </motion.div>
  );
}

interface TimelineActivityRowProps {
  title: string;
  activities: Activity[];
  year: number;
  onActivityClick?: (activity: Activity) => void;
  onActivityContextMenu?: (event: React.MouseEvent, activity: Activity) => void;
}

export function TimelineActivityRow({ 
  title, 
  activities, 
  year,
  onActivityClick,
  onActivityContextMenu
}: TimelineActivityRowProps) {
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
  
  if (visibleActivities.length === 0) {
    return null;
  }
  
  return (
    <motion.div 
      className="border-b py-3 px-2 hover:bg-gray-50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div 
        className="font-medium mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {title}
      </motion.div>
      
      <div className="relative h-6">
        {visibleActivities.map((activity, index) => {
          const activityStart = new Date(activity.startDate);
          const activityEnd = new Date(activity.endDate);
          
          // Calculate position and width based on the year's timeline
          const width = getWidthPercentage(activityStart, activityEnd, periodStart, periodEnd);
          const left = getLeftPositionPercentage(activityStart, periodStart, periodEnd);
          
          const type = activity.type as keyof typeof ACTIVITY_TYPES;
          const { color } = ACTIVITY_TYPES[type];
          const textColor = getContrastTextColor(color);
          
          return (
            <motion.div
              key={activity.id}
              className={`activity absolute top-0 h-full ${color} rounded-full px-3 py-1 ${textColor} text-xs flex items-center cursor-pointer`}
              style={{ left: `${left}%`, width: `${width}%` }}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: `${width}%` }}
              transition={{ 
                duration: 0.6, 
                delay: 0.2 + (index * 0.08),
                ease: "easeOut"
              }}
              whileHover={{ 
                y: -2,
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)"
              }}
              onMouseEnter={(e) => handleActivityMouseEnter(e, activity)}
              onMouseLeave={handleActivityMouseLeave}
              onClick={() => onActivityClick && onActivityClick(activity)}
              onContextMenu={(e) => onActivityContextMenu && onActivityContextMenu(e, activity)}
            >
              <motion.span 
                className="truncate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + (index * 0.08) }}
              >
                {activity.title} <span className="opacity-80 text-[10px] ml-1">({ACTIVITY_TYPES[type].label})</span>
              </motion.span>
            </motion.div>
          );
        })}
      </div>
      
      <AnimatePresence>
        {isTooltipVisible && (
          <motion.div
            className="fixed bg-gray-800 text-white px-3 py-1.5 rounded text-xs z-50 shadow-lg max-w-[300px] whitespace-pre-wrap"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translate(-50%, -100%)'
            }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {tooltipContent}
            <motion.div 
              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface TimelineViewProps {
  activities: Activity[];
  holidays: Holiday[];
  year: number;
  zoomLevel?: number;
  highlightToday?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onActivityClick?: (activity: Activity) => void;
  onActivityContextMenu?: (event: React.MouseEvent, activity: Activity) => void;
}

export default function TimelineView({ 
  activities, 
  holidays, 
  year,
  zoomLevel = 1,
  highlightToday = false,
  onZoomIn,
  onZoomOut,
  onActivityClick,
  onActivityContextMenu
}: TimelineViewProps) {
  // Force render whenever activities change
  const [forceRefresh, setForceRefresh] = useState<number>(Date.now());
  const activitiesRef = useRef<Activity[]>([]);
  
  // When activities change, update our reference and force a refresh
  useEffect(() => {
    const currentIds = new Set(activities.map(a => a.id));
    const prevIds = new Set(activitiesRef.current.map(a => a.id));
    
    // Check if the activities have been added or removed
    const hasChanges = activities.length !== activitiesRef.current.length || 
      activities.some(a => !prevIds.has(a.id)) ||
      activitiesRef.current.some(a => !currentIds.has(a.id));
    
    if (hasChanges) {
      console.log('🔄 Timeline view detected activity changes, refreshing view');
      activitiesRef.current = [...activities];
      setForceRefresh(Date.now());
    }
  }, [activities]);
  
  // Listen for manual refresh requests
  useEffect(() => {
    const handleActivityChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      const details = customEvent.detail || {};
      const operation = details.operation || 'unknown';
      console.log(`⚡ Timeline directly received ${operation} event, forcing refresh`);
      
      // Force a refresh of the component
      setForceRefresh(Date.now());
    };
    
    window.addEventListener('activity-changed', handleActivityChanged);
    
    return () => {
      window.removeEventListener('activity-changed', handleActivityChanged);
    };
  }, []);
  
  // Group activities by type for better organization
  const types = ['project', 'meeting', 'training', 'holiday'] as const;
  
  // Create groupings for each activity type
  const groupedActivities = types.reduce((acc, type) => {
    acc[type] = activities.filter(a => a.type === type);
    return acc;
  }, {} as Record<string, Activity[]>);
  
  // Add a category for any activities that don't match the predefined types
  const otherActivities = activities.filter(a => 
    !types.includes(a.type as any)
  );
  
  // Get group labels from the ACTIVITY_TYPES constants
  const typeLabels = {
    project: 'Projects',
    meeting: 'Meetings',
    training: 'Training & Development',
    holiday: 'Holidays',
    other: 'Other Activities'
  };
  
  return (
    <motion.div 
      className="bg-white rounded-lg shadow-sm overflow-hidden mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="border-b px-4 py-3 flex justify-between items-center"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <motion.h2 
          className="text-lg font-medium"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          Timeline View ({year})
        </motion.h2>
        <motion.div 
          className="flex space-x-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <motion.button 
            className="p-1 rounded hover:bg-gray-100" 
            title="Zoom out"
            onClick={onZoomOut}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="material-icons">zoom_out</span>
          </motion.button>
          <motion.button 
            className="p-1 rounded hover:bg-gray-100" 
            title="Zoom in"
            onClick={onZoomIn}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="material-icons">zoom_in</span>
          </motion.button>
        </motion.div>
      </motion.div>
      
      <div className="timeline-container">
        <div className="min-w-max">
          <TimelineMonthHeader year={year} />
          
          <motion.div 
            className="relative min-h-[400px]"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Map through each activity type and render a row if there are activities */}
            {types.map(type => 
              groupedActivities[type]?.length > 0 && (
                <TimelineActivityRow 
                  key={type}
                  title={typeLabels[type]} 
                  activities={groupedActivities[type]} 
                  year={year} 
                />
              )
            )}
            
            {/* Render other activities that don't match predefined types */}
            {otherActivities.length > 0 && (
              <TimelineActivityRow title={typeLabels.other} activities={otherActivities} year={year} />
            )}
            
            {/* If there are no activities, show empty state */}
            {activities.length === 0 && (
              <motion.div 
                className="flex flex-col items-center justify-center h-[300px] text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <motion.span 
                  className="material-icons text-4xl mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0.5
                  }}
                >
                  event_busy
                </motion.span>
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  No activities for {year}
                </motion.p>
                <motion.p 
                  className="text-sm mt-1"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  Add activities to see them on the timeline
                </motion.p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
