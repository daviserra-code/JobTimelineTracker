import { Activity } from "./types";
import { apiRequest } from "./queryClient";
import { getRelativeTime } from "./dates";

// Get upcoming activities for notifications
export const getUpcomingActivities = async (userId: number, daysAhead: number = 30): Promise<Activity[]> => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);
  
  const startParam = today.toISOString().split('T')[0];
  const endParam = futureDate.toISOString().split('T')[0];
  
  const response = await fetch(`/api/activities/range/${startParam}/${endParam}?userId=${userId}`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch upcoming activities');
  }
  
  const activities = await response.json();
  
  // Sort by date
  return activities.sort((a: Activity, b: Activity) => {
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);
    return dateA.getTime() - dateB.getTime();
  });
};

// Get notification time text
export const getNotificationTimeText = (activity: Activity): string => {
  const startDate = new Date(activity.startDate);
  return getRelativeTime(startDate);
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  await apiRequest('PUT', `/api/notifications/${notificationId}/read`, {});
};

// Create a notification for an activity
export const createNotification = async (activityId: number, notificationDate: Date): Promise<void> => {
  await apiRequest('POST', '/api/notifications', {
    activityId,
    notificationDate,
    isRead: false
  });
};

// Get unread notifications for a user
export const getUnreadNotifications = async (userId: number): Promise<any[]> => {
  const response = await fetch(`/api/notifications/unread?userId=${userId}`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch unread notifications');
  }
  
  return response.json();
};

// Check for notifications that should be shown
export const checkForNotifications = async (userId: number): Promise<Activity[]> => {
  try {
    // Get upcoming activities
    const upcomingActivities = await getUpcomingActivities(userId);
    
    // Get user settings to check notification lead time
    const settingsResponse = await fetch(`/api/settings/${userId}`, {
      credentials: 'include'
    });
    
    if (!settingsResponse.ok) {
      throw new Error('Failed to fetch user settings');
    }
    
    const settings = await settingsResponse.json();
    const notificationLeadTime = settings.notificationLeadTime || 7; // Default to 7 days
    
    // Filter activities that should trigger a notification
    const today = new Date();
    
    return upcomingActivities.filter(activity => {
      if (!activity.notificationEnabled) return false;
      
      const activityDate = new Date(activity.startDate);
      const daysDifference = Math.floor(
        (activityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return daysDifference <= notificationLeadTime && daysDifference >= 0;
    });
  } catch (error) {
    console.error('Error checking for notifications:', error);
    return [];
  }
};
