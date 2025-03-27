import { ActivityType, Region, ViewMode } from "@shared/schema";

export const ACTIVITY_TYPES: Record<ActivityType, { label: string; color: string }> = {
  confirmed: { label: "Confirmed", color: "bg-[#e91e63]" },
  tentative: { label: "Tentative", color: "bg-[#03a9f4]" },
  holiday: { label: "Holiday", color: "bg-[#f44336]" },
  hypothetical: { label: "Hypothetical", color: "bg-[#ffeb3b]" },
};

export const VIEW_MODES: Record<ViewMode, string> = {
  timeline: "Timeline",
  month: "Month",
  week: "Week",
  day: "Day",
};

export const REGIONS: Record<Region, string> = {
  italy: "Italy",
  europe: "Europe",
  usa: "USA",
  asia: "Asia",
};

export const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
