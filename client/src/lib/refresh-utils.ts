/**
 * Helper utilities for handling UI refresh cycles, particularly for operations like delete
 * that may require multiple refresh events to ensure UI state is correctly updated
 */
import { queryClient } from "@/lib/queryClient";

/**
 * Dispatches an activity-changed event with detailed information about the operation
 * @param operation The operation type (create, update, delete, etc.)
 * @param activityId The ID of the affected activity
 * @param additionalData Any additional data to include in the event
 */
export function dispatchActivityChangedEvent(
  operation: string,
  activityId: number,
  additionalData: Record<string, any> = {}
): void {
  const timestamp = Date.now();
  const isoTimestamp = new Date(timestamp).toISOString();
  
  console.log(`🔄 Dispatching activity-changed event (${operation}) at ${isoTimestamp}`);
  
  window.dispatchEvent(new CustomEvent('activity-changed', {
    detail: {
      operation,
      activityId,
      timestamp,
      isoTimestamp,
      ...additionalData
    }
  }));
}

/**
 * Forces a direct cache update to remove a deleted activity
 * This is a last resort method to ensure deleted activities don't show in the UI
 * 
 * @param activityId The ID of the activity to remove from the cache
 */
export function removeDeletedActivityFromCache(activityId: number): void {
  // Get all activity query keys that might be caching data
  const queryKeys = queryClient.getQueryCache().getAll()
    .filter(query => {
      const key = query.queryKey;
      const firstSegment = Array.isArray(key) ? key[0] : key;
      return typeof firstSegment === 'string' && firstSegment.includes('/api/activities');
    })
    .map(query => query.queryKey);
  
  // For each key, update the cache data directly
  queryKeys.forEach(queryKey => {
    const currentData = queryClient.getQueryData<any[]>(queryKey);
    if (Array.isArray(currentData) && currentData.length > 0) {
      // Check if it's an array of activities with an id property
      if (currentData[0] && typeof currentData[0].id === 'number') {
        // Filter out the deleted activity
        const newData = currentData.filter(item => item.id !== activityId);
        if (newData.length !== currentData.length) {
          console.log(`🔥 Manually removing activity ID ${activityId} from cache (${queryKey})`);
          queryClient.setQueryData(queryKey, newData);
        }
      }
    }
  });
}

/**
 * Forces a refresh cycle with multiple refresh events to ensure UI state is correctly updated
 * 
 * @param operation The operation that triggered the refresh
 * @param activityId The ID of the affected activity
 * @param delay The delay in ms before sending the second refresh
 */
export function forceRefreshCycle(
  operation: string,
  activityId: number,
  delay: number = 300
): void {
  // First immediate refresh
  dispatchActivityChangedEvent(operation, activityId);
  
  // If this is a delete operation, force cache update
  if (operation.includes('delete')) {
    // Direct cache manipulation
    removeDeletedActivityFromCache(activityId);
    
    // Force activity-specific invalidation
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        const queryKey = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
        return typeof queryKey === 'string' && queryKey.includes('/api/activities');
      }
    });
    
    // Log notification for developer
    console.log(`🗑️ Deleted activity at ${new Date().toISOString()}, triggering UI refresh`);
  }
  
  // Secondary refresh after a short delay
  setTimeout(() => {
    dispatchActivityChangedEvent(`${operation}-confirmation`, activityId, {
      isSecondaryRefresh: true,
      delayMs: delay
    });
    
    // Force a more aggressive data refresh
    console.log(`🔄 Forcing data refresh at ${new Date().toISOString()}`);
    queryClient.refetchQueries({ queryKey: ['/api/activities'] });
    
    // For delete operations, do a second direct cache manipulation
    if (operation.includes('delete')) {
      removeDeletedActivityFromCache(activityId);
    }
  }, delay);
  
  // Third refresh as a final safeguard
  setTimeout(() => {
    dispatchActivityChangedEvent(`${operation}-final`, activityId, {
      isSecondaryRefresh: true,
      delayMs: delay * 2
    });
    
    // Force a secondary refresh cycle
    setTimeout(() => {
      console.log(`🔁 Secondary refresh at ${new Date().toISOString()}`);
      queryClient.refetchQueries({ queryKey: ['/api/activities'] });
    }, 50);
    
    // With an additional tertiary refresh for good measure
    setTimeout(() => {
      console.log(`🔁 Secondary refresh at ${new Date().toISOString()}`);
      queryClient.refetchQueries({ queryKey: ['/api/activities'] });
    }, 500);
  }, delay * 2);
}