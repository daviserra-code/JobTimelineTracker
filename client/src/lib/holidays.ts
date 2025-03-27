import { Holiday, Region } from './types';

// Predefined holidays by region
const italianHolidays: Holiday[] = [
  { name: "New Year's Day", date: new Date(2025, 0, 1), region: 'Italy', type: 'national' },
  { name: "Epiphany", date: new Date(2025, 0, 6), region: 'Italy', type: 'religious' },
  { name: "Easter", date: new Date(2025, 3, 20), region: 'Italy', type: 'religious' },
  { name: "Easter Monday", date: new Date(2025, 3, 21), region: 'Italy', type: 'religious' },
  { name: "Liberation Day", date: new Date(2025, 3, 25), region: 'Italy', type: 'national' },
  { name: "Labor Day", date: new Date(2025, 4, 1), region: 'Italy', type: 'national' },
  { name: "Republic Day", date: new Date(2025, 5, 2), region: 'Italy', type: 'national' },
  { name: "Assumption Day", date: new Date(2025, 7, 15), region: 'Italy', type: 'religious' },
  { name: "All Saints' Day", date: new Date(2025, 10, 1), region: 'Italy', type: 'religious' },
  { name: "Immaculate Conception", date: new Date(2025, 11, 8), region: 'Italy', type: 'religious' },
  { name: "Christmas Day", date: new Date(2025, 11, 25), region: 'Italy', type: 'religious' },
  { name: "St. Stephen's Day", date: new Date(2025, 11, 26), region: 'Italy', type: 'religious' }
];

const europeanHolidays: Holiday[] = [
  { name: "New Year's Day", date: new Date(2025, 0, 1), region: 'Europe', type: 'national' },
  { name: "Easter", date: new Date(2025, 3, 20), region: 'Europe', type: 'religious' },
  { name: "Easter Monday", date: new Date(2025, 3, 21), region: 'Europe', type: 'religious' },
  { name: "Labor Day", date: new Date(2025, 4, 1), region: 'Europe', type: 'national' },
  { name: "Europe Day", date: new Date(2025, 4, 9), region: 'Europe', type: 'observance' },
  { name: "Christmas Day", date: new Date(2025, 11, 25), region: 'Europe', type: 'religious' },
  { name: "Boxing Day", date: new Date(2025, 11, 26), region: 'Europe', type: 'religious' }
];

const usaHolidays: Holiday[] = [
  { name: "New Year's Day", date: new Date(2025, 0, 1), region: 'USA', type: 'national' },
  { name: "Martin Luther King Jr. Day", date: new Date(2025, 0, 20), region: 'USA', type: 'national' },
  { name: "Presidents' Day", date: new Date(2025, 1, 17), region: 'USA', type: 'national' },
  { name: "Memorial Day", date: new Date(2025, 4, 26), region: 'USA', type: 'national' },
  { name: "Independence Day", date: new Date(2025, 6, 4), region: 'USA', type: 'national' },
  { name: "Labor Day", date: new Date(2025, 8, 1), region: 'USA', type: 'national' },
  { name: "Columbus Day", date: new Date(2025, 9, 13), region: 'USA', type: 'national' },
  { name: "Veterans Day", date: new Date(2025, 10, 11), region: 'USA', type: 'national' },
  { name: "Thanksgiving Day", date: new Date(2025, 10, 27), region: 'USA', type: 'national' },
  { name: "Christmas Day", date: new Date(2025, 11, 25), region: 'USA', type: 'religious' }
];

const asiaHolidays: Holiday[] = [
  { name: "Chinese New Year", date: new Date(2025, 1, 29), region: 'Asia', type: 'religious' },
  { name: "Diwali", date: new Date(2025, 10, 12), region: 'Asia', type: 'religious' },
  { name: "Eid al-Fitr", date: new Date(2025, 3, 1), region: 'Asia', type: 'religious' },
  { name: "Eid al-Adha", date: new Date(2025, 5, 8), region: 'Asia', type: 'religious' }
];

// Combine all holidays
const allHolidays: Record<Region, Holiday[]> = {
  'Italy': italianHolidays,
  'Europe': europeanHolidays,
  'USA': usaHolidays,
  'Asia': asiaHolidays
};

// Get holidays for a specific region
export const getHolidaysByRegion = (region: Region): Holiday[] => {
  return allHolidays[region] || [];
};

// Get all holidays for all regions
export const getAllHolidays = (): Holiday[] => {
  return [
    ...italianHolidays,
    ...europeanHolidays,
    ...usaHolidays,
    ...asiaHolidays
  ];
};

// Get holidays for a specific date range
export const getHolidaysInRange = (startDate: Date, endDate: Date, regions: Region[] = ['Italy', 'Europe', 'USA', 'Asia']): Holiday[] => {
  const holidaysInRange: Holiday[] = [];
  
  regions.forEach(region => {
    const regionHolidays = getHolidaysByRegion(region);
    
    regionHolidays.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      if (holidayDate >= startDate && holidayDate <= endDate) {
        holidaysInRange.push(holiday);
      }
    });
  });
  
  return holidaysInRange;
};

// Convert holidays to activities
export const convertHolidaysToActivities = (holidays: Holiday[]): any[] => {
  return holidays.map(holiday => ({
    id: `holiday-${holiday.name}-${holiday.date.getTime()}`,
    title: holiday.name,
    description: `${holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)} holiday in ${holiday.region}`,
    startDate: holiday.date,
    endDate: holiday.date,
    type: 'holiday',
    isSystemHoliday: true,
    region: holiday.region,
    notificationEnabled: false
  }));
};
