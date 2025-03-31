import { Holiday, Region } from "@shared/schema";

// Since we don't have an actual API key for a holiday API service,
// we'll use a static dataset with common holidays for demonstration purposes

const STATIC_HOLIDAYS: Record<Region, Record<number, Holiday[]>> = {
  all: {
    2025: [],
    2026: [],
  },
  italy: {
    2025: [
      { id: "it-1", name: "New Year's Day", date: new Date(2025, 0, 1), region: "italy" },
      { id: "it-2", name: "Epiphany", date: new Date(2025, 0, 6), region: "italy" },
      { id: "it-3", name: "Easter Sunday", date: new Date(2025, 3, 20), region: "italy" },
      { id: "it-4", name: "Easter Monday", date: new Date(2025, 3, 21), region: "italy" },
      { id: "it-5", name: "Liberation Day", date: new Date(2025, 3, 25), region: "italy" },
      { id: "it-6", name: "Labor Day", date: new Date(2025, 4, 1), region: "italy" },
      { id: "it-7", name: "Republic Day", date: new Date(2025, 5, 2), region: "italy" },
      { id: "it-8", name: "Assumption Day", date: new Date(2025, 7, 15), region: "italy" },
      { id: "it-9", name: "All Saints' Day", date: new Date(2025, 10, 1), region: "italy" },
      { id: "it-10", name: "Immaculate Conception", date: new Date(2025, 11, 8), region: "italy" },
      { id: "it-11", name: "Christmas Day", date: new Date(2025, 11, 25), region: "italy" },
      { id: "it-12", name: "St. Stephen's Day", date: new Date(2025, 11, 26), region: "italy" },
    ],
    2026: [
      { id: "it-13", name: "New Year's Day", date: new Date(2026, 0, 1), region: "italy" },
      { id: "it-14", name: "Epiphany", date: new Date(2026, 0, 6), region: "italy" },
      { id: "it-15", name: "Easter Sunday", date: new Date(2026, 3, 5), region: "italy" },
      { id: "it-16", name: "Easter Monday", date: new Date(2026, 3, 6), region: "italy" },
      { id: "it-17", name: "Liberation Day", date: new Date(2026, 3, 25), region: "italy" },
      { id: "it-18", name: "Labor Day", date: new Date(2026, 4, 1), region: "italy" },
      { id: "it-19", name: "Republic Day", date: new Date(2026, 5, 2), region: "italy" },
      { id: "it-20", name: "Assumption Day", date: new Date(2026, 7, 15), region: "italy" },
      { id: "it-21", name: "All Saints' Day", date: new Date(2026, 10, 1), region: "italy" },
      { id: "it-22", name: "Immaculate Conception", date: new Date(2026, 11, 8), region: "italy" },
      { id: "it-23", name: "Christmas Day", date: new Date(2026, 11, 25), region: "italy" },
      { id: "it-24", name: "St. Stephen's Day", date: new Date(2026, 11, 26), region: "italy" },
    ],
    // More years would be added similarly
  },
  europe: {
    2025: [
      { id: "eu-1", name: "New Year's Day", date: new Date(2025, 0, 1), region: "europe" },
      { id: "eu-2", name: "Good Friday", date: new Date(2025, 3, 18), region: "europe" },
      { id: "eu-3", name: "Easter Monday", date: new Date(2025, 3, 21), region: "europe" },
      { id: "eu-4", name: "Labor Day", date: new Date(2025, 4, 1), region: "europe" },
      { id: "eu-5", name: "Europe Day", date: new Date(2025, 4, 9), region: "europe" },
      { id: "eu-6", name: "Christmas Day", date: new Date(2025, 11, 25), region: "europe" },
      { id: "eu-7", name: "Boxing Day", date: new Date(2025, 11, 26), region: "europe" },
    ],
    2026: [
      { id: "eu-8", name: "New Year's Day", date: new Date(2026, 0, 1), region: "europe" },
      { id: "eu-9", name: "Good Friday", date: new Date(2026, 3, 3), region: "europe" },
      { id: "eu-10", name: "Easter Monday", date: new Date(2026, 3, 6), region: "europe" },
      { id: "eu-11", name: "Labor Day", date: new Date(2026, 4, 1), region: "europe" },
      { id: "eu-12", name: "Europe Day", date: new Date(2026, 4, 9), region: "europe" },
      { id: "eu-13", name: "Christmas Day", date: new Date(2026, 11, 25), region: "europe" },
      { id: "eu-14", name: "Boxing Day", date: new Date(2026, 11, 26), region: "europe" },
    ],
    // More years would be added similarly
  },
  usa: {
    2025: [
      { id: "us-1", name: "New Year's Day", date: new Date(2025, 0, 1), region: "usa" },
      { id: "us-2", name: "Martin Luther King Jr. Day", date: new Date(2025, 0, 20), region: "usa" },
      { id: "us-3", name: "Presidents' Day", date: new Date(2025, 1, 17), region: "usa" },
      { id: "us-4", name: "Memorial Day", date: new Date(2025, 4, 26), region: "usa" },
      { id: "us-5", name: "Independence Day", date: new Date(2025, 6, 4), region: "usa" },
      { id: "us-6", name: "Labor Day", date: new Date(2025, 8, 1), region: "usa" },
      { id: "us-7", name: "Columbus Day", date: new Date(2025, 9, 13), region: "usa" },
      { id: "us-8", name: "Veterans Day", date: new Date(2025, 10, 11), region: "usa" },
      { id: "us-9", name: "Thanksgiving", date: new Date(2025, 10, 27), region: "usa" },
      { id: "us-10", name: "Christmas Day", date: new Date(2025, 11, 25), region: "usa" },
    ],
    2026: [
      { id: "us-11", name: "New Year's Day", date: new Date(2026, 0, 1), region: "usa" },
      { id: "us-12", name: "Martin Luther King Jr. Day", date: new Date(2026, 0, 19), region: "usa" },
      { id: "us-13", name: "Presidents' Day", date: new Date(2026, 1, 16), region: "usa" },
      { id: "us-14", name: "Memorial Day", date: new Date(2026, 4, 25), region: "usa" },
      { id: "us-15", name: "Independence Day", date: new Date(2026, 6, 4), region: "usa" },
      { id: "us-16", name: "Labor Day", date: new Date(2026, 8, 7), region: "usa" },
      { id: "us-17", name: "Columbus Day", date: new Date(2026, 9, 12), region: "usa" },
      { id: "us-18", name: "Veterans Day", date: new Date(2026, 10, 11), region: "usa" },
      { id: "us-19", name: "Thanksgiving", date: new Date(2026, 10, 26), region: "usa" },
      { id: "us-20", name: "Christmas Day", date: new Date(2026, 11, 25), region: "usa" },
    ],
    // More years would be added similarly
  },
  asia: {
    2025: [
      { id: "as-1", name: "Chinese New Year", date: new Date(2025, 0, 29), region: "asia" },
      { id: "as-2", name: "Diwali", date: new Date(2025, 10, 12), region: "asia" },
      { id: "as-3", name: "Vesak", date: new Date(2025, 4, 12), region: "asia" },
      { id: "as-4", name: "Eid al-Fitr", date: new Date(2025, 3, 1), region: "asia" },
      { id: "as-5", name: "Eid al-Adha", date: new Date(2025, 6, 9), region: "asia" },
    ],
    2026: [
      { id: "as-6", name: "Chinese New Year", date: new Date(2026, 1, 17), region: "asia" },
      { id: "as-7", name: "Diwali", date: new Date(2026, 10, 1), region: "asia" },
      { id: "as-8", name: "Vesak", date: new Date(2026, 4, 31), region: "asia" },
      { id: "as-9", name: "Eid al-Fitr", date: new Date(2026, 2, 21), region: "asia" },
      { id: "as-10", name: "Eid al-Adha", date: new Date(2026, 5, 28), region: "asia" },
    ],
    // More years would be added similarly
  },
};

// Generic function to generate holidays for years we don't have static data for
function generateHolidaysForYear(region: Region, year: number): Holiday[] {
  // Get a base year that has data
  const baseHolidays = STATIC_HOLIDAYS[region][2025] || [];
  
  // Create holidays for the target year by adjusting the year
  return baseHolidays.map((holiday) => {
    const baseDate = new Date(holiday.date);
    const targetDate = new Date(year, baseDate.getMonth(), baseDate.getDate());
    
    return {
      id: `${holiday.id}-${year}`,
      name: holiday.name,
      date: targetDate,
      region: holiday.region,
    };
  });
}

// Helper function to generate weekend holidays for a specific year
/**
 * Generates weekend holidays for a specific year
 * This creates holiday entries for all Saturdays and Sundays in the specified year
 */
function generateWeekendHolidaysForYear(year: number): Holiday[] {
  const weekendHolidays: Holiday[] = [];
  const startDate = new Date(year, 0, 1);  // January 1st of the specified year
  const endDate = new Date(year, 11, 31);  // December 31st of the specified year
  
  // Assign a unique starting ID for weekend holidays
  let idCounter = 1000;
  
  // Loop through all days of the year
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    // Check if the day is Saturday (6) or Sunday (0)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const dayName = dayOfWeek === 0 ? "Sunday" : "Saturday";
      const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      
      weekendHolidays.push({
        id: `weekend-${year}-${idCounter++}`,
        name: `Weekend (${dayName} - ${formattedDate})`,
        date: new Date(date),
        region: "all", // Using 'all' to indicate this applies to all regions
      });
    }
  }
  
  return weekendHolidays;
}

/**
 * Gets all holidays for a specific year across selected regions
 * 
 * This function retrieves:
 * 1. Weekend holidays (Saturday & Sunday) for all years
 * 2. Region-specific holidays from STATIC_HOLIDAYS if available
 * 3. Dynamically generated holidays if not found in STATIC_HOLIDAYS
 * 
 * @param year - The year to get holidays for (e.g., 2025)
 * @param regions - Array of region codes to include holidays from (e.g., ["italy", "europe"])
 * @returns Promise resolving to an array of Holiday objects
 */
export async function getHolidaysForYear(year: number, regions: string[]): Promise<Holiday[]> {
  const holidays: Holiday[] = [];
  
  // Generate weekend holidays for all regions
  // Weekend holidays are always included regardless of selected regions
  const weekendHolidays = generateWeekendHolidaysForYear(year);
  holidays.push(...weekendHolidays);
  
  // Add regular holidays from the requested regions
  for (const region of regions) {
    if (region in STATIC_HOLIDAYS) {
      const regionHolidays = STATIC_HOLIDAYS[region as Region][year];
      
      if (regionHolidays) {
        // Use predefined holidays if available
        holidays.push(...regionHolidays);
      } else {
        // If we don't have data for this year, generate it dynamically
        const generatedHolidays = generateHolidaysForYear(region as Region, year);
        holidays.push(...generatedHolidays);
      }
    }
  }
  
  return holidays;
}
