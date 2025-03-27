import { Holiday, Region } from "@shared/schema";

/**
 * Converts API holidays to activity format for display
 * @param holidays List of holidays from the API
 * @param userId User ID to associate with the activities
 * @returns Holiday activities formatted for display in the timeline
 */
export function convertHolidaysToActivities(holidays: Holiday[], userId?: number): any[] {
  return holidays.map(holiday => ({
    id: holiday.id,
    title: holiday.name,
    description: `${holiday.name} (${getRegionLabel(holiday.region)})`,
    startDate: holiday.date,
    endDate: holiday.date, // Holidays typically last a single day
    type: "holiday" as const,
    userId: userId || undefined
  }));
}

/**
 * Get user-friendly label for a region
 */
export function getRegionLabel(region: Region): string {
  const labels: Record<Region, string> = {
    italy: "Italy",
    europe: "Europe",
    usa: "USA",
    asia: "Asia"
  };
  
  return labels[region] || region;
}

/**
 * Group holidays by region for filtering
 */
export function groupHolidaysByRegion(holidays: Holiday[]): Record<Region, Holiday[]> {
  const result: Record<Region, Holiday[]> = {
    italy: [],
    europe: [],
    usa: [],
    asia: []
  };
  
  holidays.forEach(holiday => {
    if (holiday.region in result) {
      result[holiday.region as Region].push(holiday);
    }
  });
  
  return result;
}

/**
 * Filter holidays based on selected regions and date range
 */
export function filterHolidays(
  holidays: Holiday[], 
  selectedRegions: Region[], 
  startDate: Date, 
  endDate: Date
): Holiday[] {
  return holidays.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return (
      selectedRegions.includes(holiday.region as Region) &&
      holidayDate >= startDate &&
      holidayDate <= endDate
    );
  });
}

/**
 * Check if a specific date is a holiday
 */
export function isHoliday(date: Date, holidays: Holiday[]): Holiday | null {
  const formattedDate = date.toISOString().split('T')[0];
  
  for (const holiday of holidays) {
    const holidayDate = new Date(holiday.date).toISOString().split('T')[0];
    if (holidayDate === formattedDate) {
      return holiday;
    }
  }
  
  return null;
}
