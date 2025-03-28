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
}

export function TimelineActivityRow({ title, activities, year }: TimelineActivityRowProps) {
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
            >
              <motion.span 
                className="truncate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + (index * 0.08) }}
              >
                {activity.title}
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
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function TimelineView({ 
  activities, 
  holidays, 
  year,
  onZoomIn,
  onZoomOut
}: TimelineViewProps) {
  // Group activities by category for display
  const projectActivities = activities.filter(a => a.type === 'project' || a.title.toLowerCase().includes('project'));
  const courseDevActivities = activities.filter(a => a.type === 'meeting' || a.title.toLowerCase().includes('course') || a.title.toLowerCase().includes('development'));
  const holidayActivities = activities.filter(a => a.type === 'holiday');
  const trainingActivities = activities.filter(a => 
    a.type === 'training' ||
    a.title.toLowerCase().includes('training') || 
    a.title.toLowerCase().includes('conference')
  );
  const otherActivities = activities.filter(a => 
    a.type !== 'project' &&
    a.type !== 'meeting' &&
    a.type !== 'holiday' &&
    a.type !== 'training' &&
    !a.title.toLowerCase().includes('project') && 
    !a.title.toLowerCase().includes('course') && 
    !a.title.toLowerCase().includes('development') && 
    !a.title.toLowerCase().includes('training') &&
    !a.title.toLowerCase().includes('conference')
  );
  
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
            {projectActivities.length > 0 && (
              <TimelineActivityRow title="Projects" activities={projectActivities} year={year} />
            )}
            
            {courseDevActivities.length > 0 && (
              <TimelineActivityRow title="Course Development" activities={courseDevActivities} year={year} />
            )}
            
            {holidayActivities.length > 0 && (
              <TimelineActivityRow title="Holidays" activities={holidayActivities} year={year} />
            )}
            
            {trainingActivities.length > 0 && (
              <TimelineActivityRow title="Training & Conferences" activities={trainingActivities} year={year} />
            )}
            
            {otherActivities.length > 0 && (
              <TimelineActivityRow title="Other Activities" activities={otherActivities} year={year} />
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
