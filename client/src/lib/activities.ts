import { Activity, ActivityType } from './types';
import { apiRequest } from './queryClient';

// Get activity type color based on the activity type
export const getActivityTypeColor = (type: ActivityType): string => {
  switch (type) {
    case 'confirmed':
      return 'bg-[#e91e63]'; // Pink
    case 'tentative':
      return 'bg-[#03a9f4]'; // Light Blue
    case 'holiday':
      return 'bg-[#f44336]'; // Red
    case 'hypothetical':
      return 'bg-[#ffeb3b]'; // Yellow
    default:
      return 'bg-gray-400';
  }
};

// Get text color based on the activity type
export const getActivityTextColor = (type: ActivityType): string => {
  switch (type) {
    case 'hypothetical':
      return 'text-black'; // Black text for yellow background
    default:
      return 'text-white'; // White text for other colors
  }
};

// Get activity type label
export const getActivityTypeLabel = (type: ActivityType): string => {
  switch (type) {
    case 'confirmed':
      return 'Confirmed';
    case 'tentative':
      return 'Tentative';
    case 'holiday':
      return 'Holiday';
    case 'hypothetical':
      return 'Hypothetical';
    default:
      return 'Unknown';
  }
};

// Generate a tooltip text for an activity
export const generateTooltipText = (activity: Activity): string => {
  const type = getActivityTypeLabel(activity.type);
  const dates = new Date(activity.startDate).toLocaleDateString() + 
    (activity.endDate !== activity.startDate ? 
      ` - ${new Date(activity.endDate).toLocaleDateString()}` : '');
  
  let tooltipText = `${activity.title} (${type}) - ${dates}`;
  
  if (activity.description) {
    tooltipText += `\n${activity.description}`;
  }
  
  if (activity.location) {
    tooltipText += `\nLocation: ${activity.location}`;
  }
  
  return tooltipText;
};

// Group activities by category
export const groupActivitiesByCategory = (activities: Activity[]): Record<string, Activity[]> => {
  const grouped: Record<string, Activity[]> = {};
  
  activities.forEach(activity => {
    const category = activity.category || 'Uncategorized';
    
    if (!grouped[category]) {
      grouped[category] = [];
    }
    
    grouped[category].push(activity);
  });
  
  return grouped;
};

// Sort activities by date
export const sortActivitiesByDate = (activities: Activity[], ascending = true): Activity[] => {
  return [...activities].sort((a, b) => {
    const dateA = new Date(a.startDate).getTime();
    const dateB = new Date(b.startDate).getTime();
    
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

// Create a new activity
export const createActivity = async (activity: Omit<Activity, 'id'>): Promise<Activity> => {
  const response = await apiRequest('POST', '/api/activities', activity);
  return response.json();
};

// Update an existing activity
export const updateActivity = async (id: number, activity: Partial<Activity>): Promise<Activity> => {
  const response = await apiRequest('PUT', `/api/activities/${id}`, activity);
  return response.json();
};

// Delete an activity
export const deleteActivity = async (id: number): Promise<void> => {
  await apiRequest('DELETE', `/api/activities/${id}`);
};
