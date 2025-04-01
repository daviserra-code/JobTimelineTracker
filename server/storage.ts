import {
  activities,
  notifications,
  userPreferences,
  users,
  Activity,
  InsertActivity,
  Notification,
  InsertNotification,
  User,
  InsertUser,
  UserPreference,
  InsertUserPreference
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  
  // User Preferences methods
  getUserPreferences(userId: number): Promise<UserPreference | undefined>;
  createUserPreferences(preferences: InsertUserPreference): Promise<UserPreference>;
  updateUserPreferences(userId: number, preferences: Partial<UserPreference>): Promise<UserPreference>;
  
  // Activity methods
  getAllActivities(): Promise<Activity[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, activity: Partial<Activity>): Promise<Activity>;
  deleteActivity(id: number): Promise<void>;
  
  // Notification methods
  getAllNotifications(): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: number, notification: Partial<Notification>): Promise<Notification>;
  deleteNotification(id: number): Promise<void>;
  getPendingNotifications(): Promise<Notification[]>;
  getNotificationsForUser(userId: number, read?: boolean): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification>;
  
  // Database initialization
  initializeDatabase(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const existingUser = await this.getUser(id);
    
    if (!existingUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  // User Preferences methods
  async getUserPreferences(userId: number): Promise<UserPreference | undefined> {
    const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createUserPreferences(preferences: InsertUserPreference): Promise<UserPreference> {
    const result = await db.insert(userPreferences).values(preferences).returning();
    return result[0];
  }
  
  async updateUserPreferences(userId: number, preferencesData: Partial<UserPreference>): Promise<UserPreference> {
    // Find user preferences by userId
    const existingPreferences = await this.getUserPreferences(userId);
    
    if (!existingPreferences) {
      // If no preferences exist for this user, create them
      return this.createUserPreferences({ 
        userId, 
        ...preferencesData
      } as InsertUserPreference);
    }
    
    // Update the existing preferences
    const result = await db.update(userPreferences)
      .set({ ...preferencesData, updatedAt: new Date() })
      .where(eq(userPreferences.id, existingPreferences.id))
      .returning();
    
    return result[0];
  }
  
  // Activity methods
  async getAllActivities(): Promise<Activity[]> {
    return db.select().from(activities);
  }
  
  async getActivity(id: number): Promise<Activity | undefined> {
    const result = await db.select().from(activities).where(eq(activities.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const result = await db.insert(activities).values(insertActivity).returning();
    return result[0];
  }
  
  async updateActivity(id: number, activityData: Partial<Activity>): Promise<Activity> {
    const existingActivity = await this.getActivity(id);
    
    if (!existingActivity) {
      throw new Error(`Activity with ID ${id} not found`);
    }
    
    const result = await db.update(activities)
      .set(activityData)
      .where(eq(activities.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteActivity(id: number): Promise<void> {
    const deleteResult = await db.delete(activities)
      .where(eq(activities.id, id))
      .returning({ deletedId: activities.id });
    
    if (deleteResult.length === 0) {
      throw new Error(`Activity with ID ${id} not found`);
    }
    
    // Also delete related notifications
    await db.delete(notifications)
      .where(eq(notifications.activityId, id));
  }
  
  // Notification methods
  async getAllNotifications(): Promise<Notification[]> {
    return db.select().from(notifications);
  }
  
  async getNotification(id: number): Promise<Notification | undefined> {
    const result = await db.select().from(notifications).where(eq(notifications.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(insertNotification).returning();
    return result[0];
  }
  
  async updateNotification(id: number, notificationData: Partial<Notification>): Promise<Notification> {
    const existingNotification = await this.getNotification(id);
    
    if (!existingNotification) {
      throw new Error(`Notification with ID ${id} not found`);
    }
    
    const result = await db.update(notifications)
      .set(notificationData)
      .where(eq(notifications.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteNotification(id: number): Promise<void> {
    const deleteResult = await db.delete(notifications)
      .where(eq(notifications.id, id))
      .returning({ deletedId: notifications.id });
    
    if (deleteResult.length === 0) {
      throw new Error(`Notification with ID ${id} not found`);
    }
  }
  
  async getPendingNotifications(): Promise<Notification[]> {
    const now = new Date();
    
    // Use a simpler query for now
    const allNotifications = await db.select().from(notifications);
    return allNotifications.filter(
      notification => 
        notification.status === 'pending' && 
        notification.notifyDate <= now
    );
  }
  
  async getNotificationsForUser(userId: number, read?: boolean): Promise<Notification[]> {
    // Use a simpler query and filter in memory
    const allUserNotifications = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
      
    if (read !== undefined) {
      return allUserNotifications.filter(notification => notification.read === read);
    }
    
    return allUserNotifications;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification> {
    return this.updateNotification(id, { read: true });
  }
  
  // Database initialization with sample data
  async initializeDatabase(): Promise<void> {
    try {
      // Check if we already have a demo user
      const existingUser = await this.getUserByUsername("demo");
      const existingAdminUser = await this.getUserByUsername("Administrator");
      
      if (existingUser && existingAdminUser) {
        console.log("Database already initialized with sample data");
        return;
      }
      
      console.log("Initializing database with sample data...");
      
      // Create a sample user
      const user = await this.createUser({
        username: "demo",
        password: "demo123",
        role: "admin", // Admin role by default
      });
      
      // Create the Administrator user
      if (!existingAdminUser) {
        await this.createUser({
          username: "Administrator",
          password: "dvd70ply",
          role: "admin", // Admin role
        });
      }
      
      // Create default user preferences
      const defaultPreferences = await this.createUserPreferences({
        userId: user.id,
        defaultViewMode: "month",
        defaultRegions: ["italy", "europe"],
        theme: "light",
        notificationsEnabled: true,
        notificationLeadTime: 3,
        customSettings: {
          showWeekends: true,
          defaultWorkingHours: {
            start: "09:00",
            end: "17:00"
          }
        },
      });
      
      // Create sample activities
      const sampleActivities = [
        {
          title: "Project Alpha: Phase 1",
          description: "Initial phase of Project Alpha",
          startDate: new Date(2025, 0, 10),
          endDate: new Date(2025, 1, 25),
          type: "project",
          status: "confirmed",
          category: "Development",
          location: "Remote",
          region: "europe",
          notificationEnabled: true,
          userId: user.id,
        },
        {
          title: "Project Alpha: Phase 2",
          description: "Second phase of Project Alpha",
          startDate: new Date(2025, 2, 15),
          endDate: new Date(2025, 4, 20),
          type: "project",
          status: "tentative",
          category: "Development",
          location: "Remote",
          region: "europe",
          notificationEnabled: true,
          userId: user.id,
        },
        {
          title: "Project Alpha: Phase 3",
          description: "Final phase of Project Alpha",
          startDate: new Date(2025, 6, 10),
          endDate: new Date(2025, 9, 15),
          type: "project",
          status: "hypothetical",
          category: "Development",
          location: "Remote",
          region: "europe",
          notificationEnabled: true,
          userId: user.id,
        },
        {
          title: "Client Meeting: Kickoff",
          description: "Initial client kickoff meeting",
          startDate: new Date(2025, 0, 15),
          endDate: new Date(2025, 0, 15),
          type: "meeting",
          status: "confirmed",
          category: "Client",
          location: "Main Office",
          region: "europe",
          notificationEnabled: true,
          userId: user.id,
        },
        {
          title: "Client Meeting: Review",
          description: "Client review meeting",
          startDate: new Date(2025, 2, 25),
          endDate: new Date(2025, 2, 25),
          type: "meeting",
          status: "confirmed",
          category: "Client",
          location: "Main Office",
          region: "europe",
          notificationEnabled: true,
          userId: user.id,
        },
        {
          title: "Client Meeting: Planning",
          description: "Client planning session",
          startDate: new Date(2025, 5, 5),
          endDate: new Date(2025, 5, 5),
          type: "meeting",
          status: "tentative",
          category: "Client",
          location: "Conference Room",
          region: "europe",
          notificationEnabled: true,
          userId: user.id,
        },
        {
          title: "New Year's Day",
          description: "Public holiday",
          startDate: new Date(2025, 0, 1),
          endDate: new Date(2025, 0, 1),
          type: "holiday",
          status: "confirmed",
          category: "Public Holiday",
          location: "Italy",
          region: "italy",
          notificationEnabled: true,
          userId: user.id,
        },
        {
          title: "Easter",
          description: "Public holiday",
          startDate: new Date(2025, 3, 20),
          endDate: new Date(2025, 3, 20),
          type: "holiday",
          status: "confirmed",
          category: "Public Holiday",
          location: "Italy",
          region: "italy",
          notificationEnabled: true,
          userId: user.id,
        },
        {
          title: "Summer Vacation",
          description: "Annual summer holiday",
          startDate: new Date(2025, 7, 1),
          endDate: new Date(2025, 7, 15),
          type: "holiday",
          status: "confirmed",
          category: "Personal",
          location: "Beach Resort",
          region: "europe",
          notificationEnabled: true,
          userId: user.id,
        },
        {
          title: "Tech Conference",
          description: "Annual technology conference",
          startDate: new Date(2025, 2, 10),
          endDate: new Date(2025, 2, 15),
          type: "training",
          status: "tentative",
          category: "Professional Development",
          location: "Convention Center",
          region: "usa",
          notificationEnabled: true,
          userId: user.id,
        },
        {
          title: "Leadership Workshop",
          description: "Leadership skills development",
          startDate: new Date(2025, 5, 25),
          endDate: new Date(2025, 5, 30),
          type: "training",
          status: "confirmed",
          category: "Professional Development",
          location: "Corporate Training Center",
          region: "europe",
          notificationEnabled: true,
          userId: user.id,
        },
        {
          title: "Industry Summit",
          description: "Annual industry summit",
          startDate: new Date(2025, 8, 15),
          endDate: new Date(2025, 8, 20),
          type: "training",
          status: "hypothetical",
          category: "Professional Development",
          location: "Global Conference Center",
          region: "asia",
          notificationEnabled: true,
          userId: user.id,
        },
        {
          title: "Beta Testing",
          description: "Product beta testing phase",
          startDate: new Date(2025, 4, 10),
          endDate: new Date(2025, 4, 30),
          type: "project",
          status: "tentative",
          category: "Product Development",
          location: "Tech Lab",
          region: "europe",
          notificationEnabled: true,
          userId: user.id,
        },
        {
          title: "Marketing Campaign",
          description: "Marketing campaign kickoff",
          startDate: new Date(2025, 6, 1),
          endDate: new Date(2025, 6, 20),
          type: "project",
          status: "hypothetical",
          category: "Marketing",
          location: "Marketing Department",
          region: "usa",
          notificationEnabled: true,
          userId: user.id,
        },
        {
          title: "Product Launch",
          description: "Official product launch event",
          startDate: new Date(2025, 7, 15),
          endDate: new Date(2025, 7, 15),
          type: "meeting",
          status: "confirmed",
          category: "Product Development",
          location: "Conference Hall",
          region: "usa",
          notificationEnabled: true,
          userId: user.id,
        },
      ];
      
      // Add sample activities to the database and create notifications for each
      for (const activityData of sampleActivities) {
        const activity = await this.createActivity(activityData);
        
        // Create a notification for the activity
        const startDate = new Date(activity.startDate);
        const notifyDate = new Date(startDate);
        notifyDate.setDate(startDate.getDate() - 5);
        
        await this.createNotification({
          activityId: activity.id,
          notifyDate,
          read: false,
          method: 'app',
          status: 'pending',
          userId: user.id,
        });
      }
      
      console.log("Database initialized with sample data");
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }
}

// Create and export the storage instance
export const storage = new DatabaseStorage();
