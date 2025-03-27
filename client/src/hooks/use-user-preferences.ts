import { useState, useEffect } from 'react';
import { UserPreference, ViewMode, Region } from '@shared/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Default user ID for demo purposes
const DEFAULT_USER_ID = 1;

interface UseUserPreferencesOptions {
  userId?: number;
}

/**
 * Custom hook to fetch and manage user preferences
 */
export function useUserPreferences(options?: UseUserPreferencesOptions) {
  const userId = options?.userId || DEFAULT_USER_ID;
  const queryClient = useQueryClient();
  
  // Fetch user preferences
  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/user-preferences', userId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/user-preferences/${userId}`);
        if (!response.ok) {
          if (response.status === 404) {
            // If preferences don't exist yet, return default values
            return createDefaultPreferences();
          }
          throw new Error('Failed to fetch user preferences');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        // If there's an error, return default preferences
        return createDefaultPreferences();
      }
    },
  });
  
  // Create a mutation for updating preferences
  const { mutate: updatePreferences, isPending: isUpdating } = useMutation({
    mutationFn: async (updatedPreferences: Partial<UserPreference>) => {
      return apiRequest('PATCH', `/api/user-preferences/${userId}`, updatedPreferences);
    },
    onSuccess: () => {
      // Invalidate the query to refetch preferences after update
      queryClient.invalidateQueries({ queryKey: ['/api/user-preferences', userId] });
    },
  });
  
  // Helper function to create default preferences
  function createDefaultPreferences(): UserPreference {
    return {
      id: 0,
      userId,
      defaultViewMode: 'month',
      defaultRegions: ['italy', 'europe'],
      theme: 'light',
      notificationsEnabled: true,
      notificationLeadTime: 3,
      customSettings: {
        showWeekends: true,
        defaultWorkingHours: {
          start: '09:00',
          end: '17:00',
        },
      },
      updatedAt: new Date(),
    };
  }
  
  // Convenience functions for common preference updates
  const setViewMode = (mode: ViewMode) => {
    updatePreferences({ defaultViewMode: mode });
  };
  
  const setRegions = (regions: Region[]) => {
    updatePreferences({ defaultRegions: regions });
  };
  
  const setTheme = (theme: string) => {
    updatePreferences({ theme });
  };
  
  const setNotificationsEnabled = (enabled: boolean) => {
    updatePreferences({ notificationsEnabled: enabled });
  };
  
  const setNotificationLeadTime = (days: number) => {
    updatePreferences({ notificationLeadTime: days });
  };
  
  const setCustomSettings = (settings: Record<string, any>) => {
    updatePreferences({
      customSettings: { ...(preferences?.customSettings || {}), ...settings },
    });
  };
  
  return {
    preferences: preferences || createDefaultPreferences(),
    isLoading,
    isUpdating,
    error,
    updatePreferences,
    setViewMode,
    setRegions,
    setTheme,
    setNotificationsEnabled,
    setNotificationLeadTime,
    setCustomSettings,
  };
}