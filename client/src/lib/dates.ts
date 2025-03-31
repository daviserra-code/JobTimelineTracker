import { 
  addDays, 
  addMonths, 
  format, 
  startOfDay, 
  endOfDay, 
  isWithinInterval, 
  isBefore, 
  isAfter, 
  differenceInDays, 
  eachDayOfInterval,
  startOfWeek,
  getWeek,
  getWeeksInMonth
} from 'date-fns';
import { Activity, TimelineActivity } from './types';

// Generate range of years
export const generateYearRange = (startYear: number, endYear: number) => {
  const years = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }
  return years;
};

// Generate months for a given year
export const generateMonthsForYear = (year: number) => {
  const months = [];
  for (let month = 0; month < 12; month++) {
    months.push(new Date(year, month, 1));
  }
  return months;
};

// Format date to display month and year
export const formatMonthYear = (date: Date) => {
  return format(date, 'MMM yyyy');
};

// Format date to display full date
export const formatFullDate = (date: Date) => {
  return format(date, 'MMMM d, yyyy');
};

// Format date range
export const formatDateRange = (startDate: Date, endDate: Date) => {
  if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
    return format(startDate, 'MMMM d, yyyy');
  }
  
  if (startDate.getFullYear() === endDate.getFullYear()) {
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${format(startDate, 'MMMM d')} - ${format(endDate, 'd, yyyy')}`;
    }
    return `${format(startDate, 'MMMM d')} - ${format(endDate, 'MMMM d, yyyy')}`;
  }
  
  return `${format(startDate, 'MMMM d, yyyy')} - ${format(endDate, 'MMMM d, yyyy')}`;
};

// Format time range
export const formatTimeRange = (startDate: Date, endDate: Date) => {
  return `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
};

// Calculate relative time for notifications
export const getRelativeTime = (date: Date) => {
  const today = new Date();
  const dayDiff = differenceInDays(date, today);
  
  if (dayDiff === 0) return 'Today';
  if (dayDiff === 1) return 'Tomorrow';
  if (dayDiff > 1 && dayDiff < 7) return `In ${dayDiff} days`;
  if (dayDiff === 7) return 'In 1 week';
  if (dayDiff > 7 && dayDiff < 30) return `In ${Math.floor(dayDiff / 7)} weeks`;
  if (dayDiff >= 30 && dayDiff < 60) return 'In 1 month';
  if (dayDiff >= 60) return `In ${Math.floor(dayDiff / 30)} months`;
  
  return 'Past due';
};

// Calculate position for timeline activities
export const calculateTimelinePosition = (
  activity: Activity,
  startDate: Date,
  endDate: Date
): TimelineActivity | null => {
  const activityStart = new Date(activity.startDate);
  const activityEnd = new Date(activity.endDate);
  
  // If activity is outside the visible range, don't show it
  if (isAfter(activityStart, endDate) || isBefore(activityEnd, startDate)) {
    return null;
  }
  
  // Calculate total days in the visible range
  const totalDays = differenceInDays(endDate, startDate);
  
  // Calculate the position and width based on days
  const startPos = Math.max(0, differenceInDays(activityStart, startDate));
  const activityDuration = Math.min(
    differenceInDays(activityEnd, startDate) - startPos,
    differenceInDays(endDate, startDate) - startPos
  );
  
  // Convert to percentages
  const positionLeft = `${(startPos / totalDays) * 100}%`;
  const width = `${(activityDuration / totalDays) * 100}%`;
  
  return {
    activity,
    positionLeft,
    width
  };
};

// Get upcoming activities for notifications
export const getUpcomingActivities = (
  activities: Activity[],
  daysAhead: number = 30
): Activity[] => {
  const today = startOfDay(new Date());
  const futureDate = endOfDay(addDays(today, daysAhead));
  
  return activities.filter(activity => {
    const startDate = new Date(activity.startDate);
    return isWithinInterval(startDate, { start: today, end: futureDate });
  }).sort((a, b) => {
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);
    return dateA.getTime() - dateB.getTime();
  });
};

// Calculate notification date based on lead time
export const calculateNotificationDate = (
  activityDate: Date,
  leadTime: number
): Date => {
  return addDays(activityDate, -leadTime);
};

/**
 * Get the current week number within the current month
 * This is a 1-based index (first week is 1, not 0)
 */
export const getCurrentWeekInMonth = (date: Date = new Date()): number => {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstWeekStart = startOfWeek(firstDayOfMonth);
  
  // Calculate days between the first day of first week and today
  const daysSinceFirstWeek = differenceInDays(date, firstWeekStart);
  
  // Calculate the week number (1-based)
  return Math.floor(daysSinceFirstWeek / 7) + 1;
};

/**
 * Get today's date information for navigation
 * Returns an object with today's year, month, week number, and day
 */
export const getTodayInfo = () => {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth(),
    week: getCurrentWeekInMonth(today),
    day: today.getDate()
  };
};
