import { ActivityType, ActivityStatus, Region, ViewMode } from "@shared/schema";

export const ACTIVITY_TYPES: Record<ActivityType, { label: string; color: string }> = {
  project: { label: "Project", color: "bg-[#4caf50]" },
  meeting: { label: "Meeting", color: "bg-[#9c27b0]" },
  training: { label: "Training", color: "bg-[#ff9800]" },
  holiday: { label: "Holiday", color: "bg-[#f44336]" },
};

export const ACTIVITY_STATUSES: Record<ActivityStatus, { label: string; color: string }> = {
  confirmed: { label: "Confirmed", color: "bg-[#ff4081]" },
  tentative: { label: "Tentative", color: "bg-[#03a9f4]" },
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
