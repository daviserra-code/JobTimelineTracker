import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInDays, addDays, isAfter, isBefore, isEqual } from "date-fns";
import { Activity } from "@shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return format(date, "MMM d, yyyy");
}

export function formatDateWithTime(date: Date): string {
  return format(date, "MMM d, yyyy (h:mm a)");
}

export function formatTimeRange(start: Date, end: Date): string {
  return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
}

export function getRelativeDays(date: Date): number {
  return differenceInDays(date, new Date());
}

export function getRelativeDaysText(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 0) return `In ${days} days`;
  return `${Math.abs(days)} days ago`;
}

export function getMonthsForYear(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(year, i, 1);
    return format(date, "MMM yyyy");
  });
}

export function getPositionPercentage(
  date: Date,
  startDate: Date,
  endDate: Date
): number {
  const totalDays = differenceInDays(endDate, startDate);
  const currentDays = differenceInDays(date, startDate);
  return (currentDays / totalDays) * 100;
}

export function getWidthPercentage(
  startDate: Date,
  endDate: Date,
  periodStart: Date,
  periodEnd: Date
): number {
  // Ensure dates are within period
  const effectiveStart = isBefore(startDate, periodStart) ? periodStart : startDate;
  const effectiveEnd = isAfter(endDate, periodEnd) ? periodEnd : endDate;
  
  // Calculate total period days and activity days
  const totalDays = differenceInDays(periodEnd, periodStart) + 1;
  const activityDays = differenceInDays(effectiveEnd, effectiveStart) + 1;
  
  return (activityDays / totalDays) * 100;
}

export function getLeftPositionPercentage(
  startDate: Date,
  periodStart: Date,
  periodEnd: Date
): number {
  // If the start date is before the period start, left position is 0
  if (isBefore(startDate, periodStart) || isEqual(startDate, periodStart)) {
    return 0;
  }
  
  const totalDays = differenceInDays(periodEnd, periodStart) + 1;
  const startOffset = differenceInDays(startDate, periodStart);
  
  return (startOffset / totalDays) * 100;
}

export function downloadFile(data: any, filename: string, type: string): void {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
}

export function getContrastTextColor(bgColor: string): string {
  // For this implementation, we'll just return preset colors
  // In a real app, you might calculate contrast based on the background color
  switch (bgColor) {
    case "bg-[#e91e63]": // confirmed - pink
      return "text-white";
    case "bg-[#03a9f4]": // tentative - light blue
      return "text-white";
    case "bg-[#f44336]": // holiday - red
      return "text-white";
    case "bg-[#ffeb3b]": // hypothetical - yellow
      return "text-black";
    default:
      return "text-white";
  }
}
