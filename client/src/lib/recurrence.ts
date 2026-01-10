import { RRule } from "rrule";
import { Activity } from "@shared/schema";
import { addMinutes, differenceInMinutes } from "date-fns";

/**
 * Expands recurring activities into individual instances for the given time range.
 * 
 * @param activities List of all activities (both single and recurring)
 * @param start Start of the range to view
 * @param end End of the range to view
 * @returns Expanded list including original single activities and generated recurrence instances
 */
export function expandRecurringActivities(
    activities: Activity[],
    start: Date,
    end: Date
): Activity[] {
    const result: Activity[] = [];

    activities.forEach((activity) => {
        // If it's a single event, just add it (check date range if strictly needed, 
        // but usually calling code filters by range. Here we assume we want to process all)
        if (!activity.recurrenceRule) {
            result.push(activity);
            return;
        }

        try {
            const ruleOptions = RRule.parseString(activity.recurrenceRule);

            // Enforce the activity start date as dtstart
            ruleOptions.dtstart = new Date(activity.startDate);

            const rule = new RRule(ruleOptions);

            // Get occurrences within the requested range
            // We add some buffer to start/end to ensure we catch boundary events
            const occurrences = rule.between(start, end, true);

            // Calculate duration to preserve it
            const durationMinutes = differenceInMinutes(activity.endDate, activity.startDate);

            occurrences.forEach((date, i) => {
                // Create a virtual activity instance
                // We use a synthetic ID strategy: negative number combining original ID and index
                // This is a bit hacky but keeps types consistent. 
                // Real IDs are positive integers.
                const virtualId = -1 * (activity.id * 10000 + i);

                const instanceEndDate = addMinutes(date, durationMinutes);

                const instance: Activity = {
                    ...activity,
                    id: virtualId,
                    startDate: date,
                    endDate: instanceEndDate,
                    parentActivityId: activity.id,
                    // Clear recurrence rule for instances so they don't get re-expanded if passed recursively
                    recurrenceRule: null,
                };

                result.push(instance);
            });
        } catch (error) {
            console.error(`Error expanding recurrence for activity ${activity.id}:`, error);
            // Fallback: just show the original activity
            result.push(activity);
        }
    });

    return result;
}
