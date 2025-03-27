import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  type: text("type").notNull(), // confirmed, tentative, holiday, hypothetical
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => activities.id, { onDelete: "cascade" }),
  notifyDate: timestamp("notify_date").notNull(),
  read: boolean("read").default(false),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Custom types for the application
export type ActivityType = "confirmed" | "tentative" | "holiday" | "hypothetical";

export type Region = "italy" | "europe" | "usa" | "asia";

export type ViewMode = "timeline" | "month" | "week" | "day";

export type ImportExportFormat = "xlsx" | "csv" | "json";

export type Holiday = {
  id: string;
  name: string;
  date: Date;
  region: Region;
};
