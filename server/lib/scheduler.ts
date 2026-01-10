import { Activity } from "@shared/schema";
import { addMinutes, startOfHour, setHours, setMinutes, isBefore, isAfter, addDays, isWeekend } from "date-fns";

interface TimeSlot {
    start: Date;
    end: Date;
}

export function findNextAvailableSlot(
    activities: Activity[],
    durationMinutes: number,
    searchStartDate: Date = new Date(),
    workingHoursStart: number = 9,
    workingHoursEnd: number = 17
): Date | null {
    // normalize search start to at least the next hour if it's in the past
    let currentSearch = startOfHour(addMinutes(searchStartDate, 60));
    if (isBefore(currentSearch, searchStartDate)) {
        currentSearch = addMinutes(searchStartDate, 30); // simplistic next slot
    }

    // Limit search to 14 days to avoid infinite loops
    const maxSearchDate = addDays(searchStartDate, 14);

    while (isBefore(currentSearch, maxSearchDate)) {
        // skip weekends
        if (isWeekend(currentSearch)) {
            currentSearch = setHours(addDays(currentSearch, 1), workingHoursStart);
            continue;
        }

        // check if current time is within working hours
        const currentHour = currentSearch.getHours();
        if (currentHour < workingHoursStart) {
            currentSearch = setHours(currentSearch, workingHoursStart);
            continue;
        }
        if (currentHour >= workingHoursEnd) {
            currentSearch = setHours(addDays(currentSearch, 1), workingHoursStart);
            continue;
        }

        const potentialEnd = addMinutes(currentSearch, durationMinutes);

        // Check for collisions
        const hasCollision = activities.some(act => {
            const actStart = new Date(act.startDate);
            const actEnd = new Date(act.endDate);

            // Check overlap: (StartA < EndB) and (EndA > StartB)
            return isBefore(currentSearch, actEnd) && isAfter(potentialEnd, actStart);
        });

        if (!hasCollision) {
            return currentSearch;
        }

        // If collision, move forward by 30 mins (or less/more depending on granularity)
        currentSearch = addMinutes(currentSearch, 30);
    }

    return null;
}
