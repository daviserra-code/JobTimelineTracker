import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, format } from "date-fns";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date for display
export function formatDate(date: Date): string {
  return format(date, 'MMM d, yyyy');
}

// Get relative days from now to a date
export function getRelativeDays(date: Date): number {
  const now = new Date();
  return differenceInDays(date, now);
}

// Convert relative days to text description
export function getRelativeDaysText(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1) return `In ${days} days`;
  if (days === -1) return "Yesterday";
  return `${Math.abs(days)} days ago`;
}

// Function to determine if text should be dark or light based on background color
export function getContrastTextColor(hexColor: string): "black" | "white" {
  // Remove the hash symbol if present
  hexColor = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);
  
  // Calculate brightness (YIQ equation)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return black for bright colors and white for dark colors
  return brightness > 128 ? "black" : "white";
}

// Calculate width percentage for timeline activities
export function getWidthPercentage(
  startDate: Date,
  endDate: Date,
  periodStart: Date,
  periodEnd: Date
): number {
  // Ensure dates are within the period
  const clampedStart = startDate < periodStart ? periodStart : startDate;
  const clampedEnd = endDate > periodEnd ? periodEnd : endDate;
  
  // Calculate total days in period
  const totalDays = differenceInDays(periodEnd, periodStart) + 1;
  
  // Calculate activity duration in days
  const durationDays = differenceInDays(clampedEnd, clampedStart) + 1;
  
  // Calculate percentage of period that the activity spans
  return (durationDays / totalDays) * 100;
}

// Calculate left position percentage for timeline activities
export function getLeftPositionPercentage(
  startDate: Date,
  periodStart: Date,
  periodEnd: Date
): number {
  // Ensure date is within the period
  const clampedStart = startDate < periodStart ? periodStart : startDate;
  
  // Calculate total days in period
  const totalDays = differenceInDays(periodEnd, periodStart) + 1;
  
  // Calculate days from period start to activity start
  const daysFromStart = differenceInDays(clampedStart, periodStart);
  
  // Calculate percentage position
  return (daysFromStart / totalDays) * 100;
}