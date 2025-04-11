/**
 * Helper utilities for handling UI refresh cycles, particularly for operations like delete
 * that may require multiple refresh events to ensure UI state is correctly updated
 */

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
 * Forces a refresh cycle with an optional second refresh after a delay
 * to ensure changes are reflected in the UI
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
  
  // Second delayed refresh to ensure changes are reflected
  setTimeout(() => {
    dispatchActivityChangedEvent(`${operation}-confirmation`, activityId, {
      isSecondaryRefresh: true,
      delayMs: delay
    });
  }, delay);
  
  // Third refresh as a final safeguard
  setTimeout(() => {
    dispatchActivityChangedEvent(`${operation}-final`, activityId, {
      isSecondaryRefresh: true,
      delayMs: delay * 2
    });
  }, delay * 2);
}