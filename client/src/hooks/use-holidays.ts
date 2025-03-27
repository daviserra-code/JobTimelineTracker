import { useQuery } from "@tanstack/react-query";
import { Holiday, Region } from "@shared/schema";

export function useHolidays(regions: Region[] = ["italy", "europe", "usa", "asia"], year: number = new Date().getFullYear()) {
  const { data: holidays, isLoading, error } = useQuery<Holiday[]>({
    queryKey: ['/api/holidays', year, regions.join(',')],
  });

  // Filter holidays by region
  const getHolidaysByRegion = (region: Region) => {
    return holidays?.filter(holiday => holiday.region === region) || [];
  };

  // Get all holidays for the selected regions
  const getAllHolidays = () => {
    return holidays || [];
  };

  return {
    holidays: getAllHolidays(),
    holidaysByRegion: {
      italy: getHolidaysByRegion("italy"),
      europe: getHolidaysByRegion("europe"),
      usa: getHolidaysByRegion("usa"),
      asia: getHolidaysByRegion("asia"),
    },
    isLoading,
    error,
  };
}
