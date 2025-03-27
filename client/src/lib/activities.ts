import { Activity, ActivityType, ActivityStatus } from '@shared/schema';
import { apiRequest } from './queryClient';
import { ACTIVITY_TYPES, ACTIVITY_STATUSES } from './constants';

// Get activity type color
export const getActivityTypeColor = (type: ActivityType): string => {
  return ACTIVITY_TYPES[type]?.color || 'bg-gray-400';
};

// Get activity type label
export const getActivityTypeLabel = (type: ActivityType): string => {
  return ACTIVITY_TYPES[type]?.label || 'Unknown';
};

// Get activity status color
export const getActivityStatusColor = (status: ActivityStatus): string => {
  return ACTIVITY_STATUSES[status]?.color || 'bg-gray-400';
};

// Get activity status label
export const getActivityStatusLabel = (status: ActivityStatus): string => {
  return ACTIVITY_STATUSES[status]?.label || 'Unknown';
};

// Get text color based on the status
export const getActivityTextColor = (status: ActivityStatus): string => {
  switch (status) {
    case 'hypothetical':
      return 'text-black'; // Black text for yellow background
    default:
      return 'text-white'; // White text for other colors
  }
};

// Generate a tooltip text for an activity
export const generateTooltipText = (activity: Activity): string => {
  const type = getActivityTypeLabel(activity.type as ActivityType);
  const status = activity.status ? getActivityStatusLabel(activity.status as ActivityStatus) : '';
  const dates = new Date(activity.startDate).toLocaleDateString() + 
    (activity.endDate !== activity.startDate ? 
      ` - ${new Date(activity.endDate).toLocaleDateString()}` : '');
  
  let tooltipText = `${activity.title} (${type}${status ? ', ' + status : ''}) - ${dates}`;
  
  if (activity.description) {
    tooltipText += `\n${activity.description}`;
  }
  
  return tooltipText;
};

// Group activities by type
export const groupActivitiesByType = (activities: Activity[]): Record<string, Activity[]> => {
  const grouped: Record<string, Activity[]> = {};
  
  activities.forEach(activity => {
    const type = activity.type || 'Other';
    
    if (!grouped[type]) {
      grouped[type] = [];
    }
    
    grouped[type].push(activity);
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
