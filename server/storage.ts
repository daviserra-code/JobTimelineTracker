import {
  activities,
  notifications,
  userPreferences,
  Activity,
  InsertActivity,
  Notification,
  InsertNotification,
  User,
  InsertUser,
  UserPreference,
  InsertUserPreference
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private activitiesMap: Map<number, Activity>;
  private notificationsMap: Map<number, Notification>;
  private userPreferencesMap: Map<number, UserPreference>;
  
  private userCurrentId: number;
  private activityCurrentId: number;
  private notificationCurrentId: number;
  private userPreferenceCurrentId: number;

  constructor() {
    this.users = new Map();
    this.activitiesMap = new Map();
    this.notificationsMap = new Map();
    this.userPreferencesMap = new Map();
    
    this.userCurrentId = 1;
    this.activityCurrentId = 1;
    this.notificationCurrentId = 1;
    this.userPreferenceCurrentId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  private initializeSampleData() {
    // Create a sample user
    const user: User = {
      id: this.userCurrentId++,
      username: "demo",
      password: "demo123",
    };
    this.users.set(user.id, user);
    
    // Create default user preferences
    const defaultPreferences: UserPreference = {
      id: this.userPreferenceCurrentId++,
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
      updatedAt: new Date()
    };
    this.userPreferencesMap.set(defaultPreferences.id, defaultPreferences);
    
    // Create sample activities
    const sampleActivities: Omit<Activity, "id">[] = [
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
    
    // Add sample activities to the map
    sampleActivities.forEach((activity) => {
      const id = this.activityCurrentId++;
      this.activitiesMap.set(id, { ...activity, id });
      
      // Create notifications for each activity
      const startDate = new Date(activity.startDate);
      const notifyDate = new Date(startDate);
      notifyDate.setDate(startDate.getDate() - 5);
      
      this.notificationsMap.set(this.notificationCurrentId++, {
        id: this.notificationCurrentId,
        activityId: id,
        notifyDate,
        read: false,
        userId: user.id,
      });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // User Preferences methods
  async getUserPreferences(userId: number): Promise<UserPreference | undefined> {
    // Find user preferences by userId
    return Array.from(this.userPreferencesMap.values()).find(
      (prefs) => prefs.userId === userId
    );
  }
  
  async createUserPreferences(preferences: InsertUserPreference): Promise<UserPreference> {
    const id = this.userPreferenceCurrentId++;
    const now = new Date();
    
    // Create a properly typed UserPreference object
    const userPreference: UserPreference = {
      id,
      userId: preferences.userId,
      defaultViewMode: preferences.defaultViewMode !== undefined ? preferences.defaultViewMode : null,
      defaultRegions: preferences.defaultRegions !== undefined ? preferences.defaultRegions : ['italy'],
      theme: preferences.theme !== undefined ? preferences.theme : null,
      notificationsEnabled: preferences.notificationsEnabled !== undefined ? preferences.notificationsEnabled : null,
      notificationLeadTime: preferences.notificationLeadTime !== undefined ? preferences.notificationLeadTime : null,
      customSettings: preferences.customSettings !== undefined ? preferences.customSettings : null,
      updatedAt: now
    };
    
    this.userPreferencesMap.set(id, userPreference);
    return userPreference;
  }
  
  async updateUserPreferences(userId: number, preferencesData: Partial<UserPreference>): Promise<UserPreference> {
    // Find user preferences by userId
    const existingPreferences = Array.from(this.userPreferencesMap.values()).find(
      (prefs) => prefs.userId === userId
    );
    
    if (!existingPreferences) {
      // If no preferences exist for this user, create them
      return this.createUserPreferences({ 
        userId, 
        ...preferencesData
      } as InsertUserPreference);
    }
    
    // Update the existing preferences
    const updatedPreferences: UserPreference = { 
      ...existingPreferences, 
      ...preferencesData,
      updatedAt: new Date()
    };
    
    this.userPreferencesMap.set(existingPreferences.id, updatedPreferences);
    return updatedPreferences;
  }
  
  // Activity methods
  async getAllActivities(): Promise<Activity[]> {
    return Array.from(this.activitiesMap.values());
  }
  
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activitiesMap.get(id);
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityCurrentId++;
    // Ensure proper type conversion for required fields
    const activity: Activity = {
      id,
      title: insertActivity.title,
      description: insertActivity.description || null,
      startDate: insertActivity.startDate,
      endDate: insertActivity.endDate,
      type: insertActivity.type,
      status: insertActivity.status || "confirmed",
      category: insertActivity.category || null,
      location: insertActivity.location || null,
      region: insertActivity.region || null,
      notificationEnabled: insertActivity.notificationEnabled !== undefined ? insertActivity.notificationEnabled : true,
      userId: insertActivity.userId || null
    };
    this.activitiesMap.set(id, activity);
    return activity;
  }
  
  async updateActivity(id: number, activityData: Partial<Activity>): Promise<Activity> {
    const existingActivity = this.activitiesMap.get(id);
    
    if (!existingActivity) {
      throw new Error(`Activity with ID ${id} not found`);
    }
    
    const updatedActivity: Activity = { ...existingActivity, ...activityData };
    this.activitiesMap.set(id, updatedActivity);
    
    return updatedActivity;
  }
  
  async deleteActivity(id: number): Promise<void> {
    const deleted = this.activitiesMap.delete(id);
    
    if (!deleted) {
      throw new Error(`Activity with ID ${id} not found`);
    }
    
    // Also delete related notifications
    // Use Array.from to avoid MapIterator issues
    Array.from(this.notificationsMap.entries()).forEach(([notifId, notification]) => {
      if (notification.activityId === id) {
        this.notificationsMap.delete(notifId);
      }
    });
  }
  
  // Notification methods
  async getAllNotifications(): Promise<Notification[]> {
    return Array.from(this.notificationsMap.values());
  }
  
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notificationsMap.get(id);
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationCurrentId++;
    // Ensure proper type conversion for required fields
    const notification: Notification = {
      id,
      userId: insertNotification.userId || null,
      activityId: insertNotification.activityId || null,
      notifyDate: insertNotification.notifyDate,
      read: insertNotification.read || false
    };
    this.notificationsMap.set(id, notification);
    return notification;
  }
  
  async updateNotification(id: number, notificationData: Partial<Notification>): Promise<Notification> {
    const existingNotification = this.notificationsMap.get(id);
    
    if (!existingNotification) {
      throw new Error(`Notification with ID ${id} not found`);
    }
    
    const updatedNotification: Notification = { ...existingNotification, ...notificationData };
    this.notificationsMap.set(id, updatedNotification);
    
    return updatedNotification;
  }
  
  async deleteNotification(id: number): Promise<void> {
    const deleted = this.notificationsMap.delete(id);
    
    if (!deleted) {
      throw new Error(`Notification with ID ${id} not found`);
    }
  }
}

export const storage = new MemStorage();
