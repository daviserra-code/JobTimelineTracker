export interface Activity {
  id: number;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: ActivityType;
  category?: string;
  location?: string;
  userId?: number;
  notificationEnabled: boolean;
  notificationDate?: Date;
  isSystemHoliday: boolean;
  region?: string;
}

export type ActivityType = 'confirmed' | 'tentative' | 'holiday' | 'hypothetical';

export type ViewMode = 'timeline' | 'month' | 'week' | 'day';

export interface Notification {
  id: number;
  activityId: number;
  notificationDate: Date;
  isRead: boolean;
}

export interface UserSettings {
  id: number;
  userId: number;
  defaultView: ViewMode;
  defaultRegion: Region;
  notificationLeadTime: number;
  theme: 'light' | 'dark';
}

export type Region = 'Italy' | 'Europe' | 'USA' | 'Asia';

export interface Holiday {
  name: string;
  date: Date;
  region: Region;
  type: 'national' | 'religious' | 'observance';
}

export interface TimelineActivity {
  activity: Activity;
  positionLeft: string;
  width: string;
}

export interface ImportExportOptions {
  format: 'xls' | 'csv' | 'json';
  action: 'import' | 'export';
}
