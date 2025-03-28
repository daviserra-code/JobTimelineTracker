import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getHolidaysForYear } from "./holiday-api";
import { z } from "zod";
import { insertActivitySchema, insertNotificationSchema, insertUserPreferencesSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix: /api
  
  // Activities Routes
  
  // Get all activities with optional filtering
  app.get("/api/activities", async (req, res) => {
    try {
      const { 
        search, 
        types, 
        statuses, 
        startDate, 
        endDate,
        category,
        location
      } = req.query;
      
      // Get all activities first
      const activities = await storage.getAllActivities();
      
      // Apply filters if any are present
      let filteredActivities = activities;
      
      // Text search filter (searches in title, description, category, location)
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filteredActivities = filteredActivities.filter(activity => 
          activity.title.toLowerCase().includes(searchLower) || 
          (activity.description && activity.description.toLowerCase().includes(searchLower)) ||
          (activity.category && activity.category.toLowerCase().includes(searchLower)) ||
          (activity.location && activity.location.toLowerCase().includes(searchLower))
        );
      }
      
      // Types filter
      if (types && typeof types === 'string') {
        const typesList = types.split(',');
        filteredActivities = filteredActivities.filter(activity => 
          typesList.includes(activity.type)
        );
      }
      
      // Statuses filter
      if (statuses && typeof statuses === 'string') {
        const statusesList = statuses.split(',');
        filteredActivities = filteredActivities.filter(activity => 
          statusesList.includes(activity.status)
        );
      }
      
      // Date range filter
      if (startDate && typeof startDate === 'string') {
        const startDateObj = new Date(startDate);
        filteredActivities = filteredActivities.filter(activity => 
          new Date(activity.startDate) >= startDateObj
        );
      }
      
      if (endDate && typeof endDate === 'string') {
        const endDateObj = new Date(endDate);
        filteredActivities = filteredActivities.filter(activity => 
          new Date(activity.endDate) <= endDateObj
        );
      }
      
      // Category filter
      if (category && typeof category === 'string') {
        filteredActivities = filteredActivities.filter(activity => 
          activity.category === category
        );
      }
      
      // Location filter
      if (location && typeof location === 'string') {
        filteredActivities = filteredActivities.filter(activity => 
          activity.location === location
        );
      }
      
      res.json(filteredActivities);
    } catch (error) {
      res.status(500).json({ message: `Error fetching activities: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Get activity by ID
  app.get("/api/activities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const activity = await storage.getActivity(id);
      
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: `Error fetching activity: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Create a new activity
  app.post("/api/activities", async (req, res) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const createdActivity = await storage.createActivity(validatedData);
      
      // Create a notification for this activity (5 days before start date)
      const startDate = new Date(validatedData.startDate);
      const notifyDate = new Date(startDate);
      notifyDate.setDate(startDate.getDate() - 5);
      
      await storage.createNotification({
        activityId: createdActivity.id,
        notifyDate,
        read: false,
        userId: validatedData.userId,
      });
      
      res.status(201).json(createdActivity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }
      
      res.status(500).json({ message: `Error creating activity: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Update an activity
  app.patch("/api/activities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const activity = await storage.getActivity(id);
      
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      // Process dates if they are strings
      let updateData = { ...req.body };
      
      if (updateData.startDate && typeof updateData.startDate === 'string') {
        updateData.startDate = new Date(updateData.startDate);
      }
      
      if (updateData.endDate && typeof updateData.endDate === 'string') {
        updateData.endDate = new Date(updateData.endDate);
      }
      
      const updatedActivity = await storage.updateActivity(id, updateData);
      res.json(updatedActivity);
    } catch (error) {
      console.error("Update activity error:", error);
      res.status(500).json({ message: `Error updating activity: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Delete an activity
  app.delete("/api/activities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const activity = await storage.getActivity(id);
      
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      await storage.deleteActivity(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: `Error deleting activity: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Import activities
  app.post("/api/activities/import", async (req, res) => {
    try {
      const { activities } = req.body;
      
      if (!Array.isArray(activities)) {
        return res.status(400).json({ message: "Invalid import data format, expected activities array" });
      }
      
      const importedActivities = [];
      
      for (const activity of activities) {
        try {
          const validatedData = insertActivitySchema.parse(activity);
          const createdActivity = await storage.createActivity(validatedData);
          
          // Create a notification for this activity (5 days before start date)
          const startDate = new Date(validatedData.startDate);
          const notifyDate = new Date(startDate);
          notifyDate.setDate(startDate.getDate() - 5);
          
          await storage.createNotification({
            activityId: createdActivity.id,
            notifyDate,
            read: false,
            userId: validatedData.userId,
          });
          
          importedActivities.push(createdActivity);
        } catch (error) {
          console.error("Error importing activity:", error);
          // Continue with next activity on error
        }
      }
      
      res.status(201).json({
        message: `Imported ${importedActivities.length} of ${activities.length} activities`,
        activities: importedActivities,
      });
    } catch (error) {
      res.status(500).json({ message: `Error importing activities: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Notifications Routes
  
  // Get all notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifications = await storage.getAllNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: `Error fetching notifications: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Mark notification as read
  app.patch("/api/notifications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.getNotification(id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      const updatedNotification = await storage.updateNotification(id, { read: true });
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: `Error updating notification: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // User Preferences Routes
  
  // Get user preferences by user ID
  app.get("/api/user-preferences/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        return res.status(404).json({ message: "User preferences not found" });
      }
      
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: `Error fetching user preferences: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Create or update user preferences
  app.post("/api/user-preferences", async (req, res) => {
    try {
      const validatedData = insertUserPreferencesSchema.parse(req.body);
      
      // Check if preferences already exist for this user
      const existingPreferences = await storage.getUserPreferences(validatedData.userId);
      
      if (existingPreferences) {
        // Update existing preferences
        const updatedPreferences = await storage.updateUserPreferences(
          validatedData.userId,
          validatedData
        );
        return res.json(updatedPreferences);
      } else {
        // Create new preferences
        const newPreferences = await storage.createUserPreferences(validatedData);
        return res.status(201).json(newPreferences);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user preferences data", errors: error.errors });
      }
      
      res.status(500).json({ message: `Error creating/updating user preferences: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Update user preferences
  app.patch("/api/user-preferences/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const updatedPreferences = await storage.updateUserPreferences(userId, req.body);
      res.json(updatedPreferences);
    } catch (error) {
      res.status(500).json({ message: `Error updating user preferences: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Holidays Routes
  
  // Get holidays for specific year and regions
  app.get("/api/holidays", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const regions = (req.query.regions as string || "italy,europe,usa,asia").split(",");
      
      const holidays = await getHolidaysForYear(year, regions);
      res.json(holidays);
    } catch (error) {
      res.status(500).json({ message: `Error fetching holidays: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
