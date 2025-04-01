import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // "admin" or "user"
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  defaultViewMode: text("default_view_mode").default("month"),
  defaultRegions: text("default_regions").array().default(['italy']),
  theme: text("theme").default("light"),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  notificationLeadTime: integer("notification_lead_time").default(1), // Days before event
  notificationMethods: text("notification_methods").array().default(['app']), // app, email, sms
  email: text("email"), // User's email for notifications
  phone: text("phone"), // User's phone for notifications
  customSettings: jsonb("custom_settings"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  updatedAt: true,
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  type: text("type").notNull(), // project, meeting, training, holiday
  status: text("status").notNull().default("confirmed"), // confirmed, tentative, hypothetical
  category: text("category"), // custom categorization
  location: text("location"), // location of the activity
  region: text("region"), // region associated with the activity (for holidays)
  notificationEnabled: boolean("notification_enabled").default(true),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
});

// Create and refine the insert schema to handle string dates properly
const baseInsertActivitySchema = createInsertSchema(activities).omit({
  id: true,
});

export const insertActivitySchema = baseInsertActivitySchema.extend({
  startDate: z.preprocess(
    (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
    z.date()
  ),
  endDate: z.preprocess(
    (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
    z.date()
  ),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => activities.id, { onDelete: "cascade" }),
  notifyDate: timestamp("notify_date").notNull(),
  read: boolean("read").default(false),
  method: text("method").default("app"), // app, email, sms
  status: text("status").default("pending"), // pending, sent, failed
  errorMessage: text("error_message"), // For logging delivery errors
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
});

// Create and refine the notification schema to handle string dates
const baseInsertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

export const insertNotificationSchema = baseInsertNotificationSchema.extend({
  notifyDate: z.preprocess(
    (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
    z.date()
  ),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = z.infer<typeof insertUserPreferencesSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Custom types for the application
export type ActivityType = "project" | "meeting" | "training" | "holiday";
export type ActivityStatus = "confirmed" | "tentative" | "hypothetical";

export type Region = "italy" | "europe" | "usa" | "asia" | "all";

export type ViewMode = "timeline" | "month" | "week" | "day";

export type ImportExportFormat = "xlsx" | "csv" | "json";

export type UserRole = "admin" | "user";

export type NotificationMethod = "app" | "email" | "sms";
export type NotificationStatus = "pending" | "sent" | "failed";

export type Holiday = {
  id: string;
  name: string;
  date: Date;
  region: Region;
};
