import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getHolidaysForYear } from "./holiday-api";
import { z } from "zod";
import { insertActivitySchema, insertNotificationSchema, insertUserPreferencesSchema, InsertUserPreference, User, insertAttendeeSchema } from "@shared/schema";
import { OutlookAuth } from "./outlook-auth";
import { OutlookService } from "./outlook-service";

// Admin authorization middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Method 1: Check for direct admin token in header (most reliable in deployed env)
  const adminToken = req.headers['x-admin-auth-token'];
  if (adminToken === 'Administrator-dvd70ply') {
    console.log("Admin authenticated via auth token header");
    return next();
  }

  // Method 2: Check for admin token in query string (for GET requests, etc.)
  if (req.query.adminToken === 'Administrator-dvd70ply') {
    console.log("Admin authenticated via query parameter token");
    return next();
  }

  // Method 3: Check admin secret in Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader === 'Bearer Admin-dvd70ply') {
    console.log("Admin authenticated via Authorization bearer token");
    return next();
  }

  // Method 4: Check for special URL pattern in the path (safest fallback)
  if (req.path.includes('admin-secret-dvd70ply')) {
    console.log("Admin authenticated via special URL pattern");
    return next();
  }

  // Method 5: Traditional session-based authentication (fallback for dev environment)
  const userId = req.session.userId;
  if (!userId) {
    console.log("Authentication failed: No user ID in session");
    return res.status(401).json({
      message: "Authentication required: You must be logged in as an administrator",
      code: "NOT_AUTHENTICATED"
    });
  }

  storage.getUser(userId).then(user => {
    if (!user) {
      console.log(`User not found in database: ID ${userId}`);
      return res.status(404).json({
        message: "User not found in database",
        code: "USER_NOT_FOUND"
      });
    }

    // Administrator username is special
    if (user.role !== "admin" && user.username !== "Administrator") {
      console.log(`Permission denied: User ${user.username} has role ${user.role}, not admin`);
      return res.status(403).json({
        message: "Permission denied: Admin role required",
        code: "NOT_ADMIN"
      });
    }

    next();
  }).catch(error => {
    console.error("Authorization error:", error);
    res.status(500).json({ message: `Authorization error: ${error instanceof Error ? error.message : 'Unknown error'}` });
  });
}

// Extend Express Request type to include session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    outlookToken?: string; // Store Outlook Access Token in session
    oauthState?: string;
  }
}

// Import express session
import session from 'express-session';

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'activity-planner-secret',
    resave: true, // Changed to true to save session on each request
    saveUninitialized: true, // Changed to true to create session even without login
    cookie: {
      // For deployment on Replit, we need these specific settings
      secure: false, // Set to false to work in all environments
      sameSite: 'none', // Allow cross-site cookies
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      path: '/'
    }
  }));

  // Log all requests for debugging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Session ID: ${req.session.id}, User ID: ${req.session.userId || 'none'}`);
    next();
  });

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
    // ... existing implementation ...
    try {
      console.log("Create activity request received:", {
        sessionId: req.session.id,
        userId: req.session.userId,
        headers: {
          origin: req.headers.origin,
          cookie: req.headers.cookie ? "present" : "absent",
          authorization: req.headers.authorization ? "present" : "absent"
        }
      });

      // SPECIAL DEPLOYMENT HANDLING: Check for admin role in header instead of session
      // This is specifically for the deployed version where sessions might not work
      const adminHeader = req.headers.authorization;
      if (adminHeader === "Bearer Admin-dvd70ply") {
        console.log("Admin authenticated via authorization header");

        // Process directly as Admin (bypass session check)
        // Continue with activity creation
      } else {
        // Regular session-based authentication if no special header
        // Check if user is logged in
        const userId = req.session.userId;
        if (!userId) {
          console.log("Authentication failed: No user ID in session");
          return res.status(401).json({
            message: "Authentication required: You must be logged in as an administrator",
            code: "NOT_AUTHENTICATED"
          });
        }

        // Get user and check role
        const user = await storage.getUser(userId);
        if (!user) {
          console.log(`User not found in database: ID ${userId}`);
          return res.status(404).json({
            message: "User not found in database",
            code: "USER_NOT_FOUND"
          });
        }

        if (user.role !== "admin") {
          console.log(`Permission denied: User ${user.username} has role ${user.role}, not admin`);
          return res.status(403).json({
            message: "Permission denied: Admin role required",
            code: "NOT_ADMIN"
          });
        }
      }

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

      // Log differently based on authentication method
      if (adminHeader === "Bearer Admin-dvd70ply") {
        console.log(`Activity created successfully: ID ${createdActivity.id} by special admin header auth`);
      } else {
        const userInfo = await storage.getUser(req.session.userId!);
        console.log(`Activity created successfully: ID ${createdActivity.id} by user ${userInfo ? userInfo.username : 'unknown'}`);
      }

      // Set explicit headers for cookie handling in cross-domain situations
      res.set({
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': req.headers.origin || '*'
      });

      res.status(201).json(createdActivity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }

      console.error("Error creating activity:", error);
      res.status(500).json({ message: `Error creating activity: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Smart Scheduling Endpoint
  app.post("/api/schedule/smart", async (req, res) => {
    try {
      // Check for special admin header first
      const adminHeader = req.headers.authorization;
      if (adminHeader === "Bearer Admin-dvd70ply") {
        // Admin is authenticated via header, proceed
      } else if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { durationMinutes } = req.body;
      if (!durationMinutes || typeof durationMinutes !== 'number') {
        return res.status(400).json({ message: "durationMinutes (number) is required" });
      }

      let preferences;
      if (req.session.userId) {
        preferences = await storage.getUserPreferences(req.session.userId);
      }
      let startHour = 9;
      let endHour = 17;

      if (preferences?.customSettings) {
        // safely cast or check types
        const settings = preferences.customSettings as any;
        if (settings.defaultWorkingHours) {
          const startStr = settings.defaultWorkingHours.start;
          const endStr = settings.defaultWorkingHours.end;
          if (startStr) startHour = parseInt(startStr.split(':')[0]);
          if (endStr) endHour = parseInt(endStr.split(':')[0]);
        }
      }

      const activities = await storage.getAllActivities();

      // Determine userId to filter activities (if not admin header)
      let userId = req.session.userId;

      // If authenticating via admin header, we might not have a session userId.
      // In this case, we can either consider ALL activities or specific ones. 
      // For smart scheduling, we ideally want to respect the schedule of the intended user.
      // If we don't have a user ID (pure admin call), use 1 (Administrator) or skip filtering to consider all busy slots.
      // Let's filter by the current user if available, otherwise just consider all activities to avoid conflicts.

      const userActivities = userId
        ? activities.filter(a => a.userId === userId)
        : activities; // If admin header and no session, consider ALL activities as potential conflicts
      const { findNextAvailableSlot } = await import("./lib/scheduler");

      const nextSlot = findNextAvailableSlot(
        userActivities,
        durationMinutes,
        new Date(),
        startHour,
        endHour
      );

      if (!nextSlot) {
        return res.status(404).json({ message: "No available slot found in the next 14 days" });
      }

      res.json({ slot: nextSlot });
    } catch (error) {
      console.error("Smart schedule error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Update an activity
  app.patch("/api/activities/:id", async (req, res) => {
    try {
      console.log("Update activity request received:", {
        activityId: req.params.id,
        sessionId: req.session.id,
        userId: req.session.userId,
        headers: {
          origin: req.headers.origin,
          cookie: req.headers.cookie ? "present" : "absent",
          authorization: req.headers.authorization ? "present" : "absent"
        }
      });

      // SPECIAL DEPLOYMENT HANDLING: Check for admin role in header instead of session
      // This is specifically for the deployed version where sessions might not work
      const adminHeader = req.headers.authorization;
      if (adminHeader === "Bearer Admin-dvd70ply") {
        console.log("Admin authenticated via authorization header");

        // Process directly as Admin (bypass session check)
        // Continue with activity update
      } else {
        // Regular session-based authentication if no special header
        // Check if user is logged in
        const userId = req.session.userId;
        if (!userId) {
          console.log("Authentication failed: No user ID in session");
          return res.status(401).json({
            message: "Authentication required: You must be logged in as an administrator",
            code: "NOT_AUTHENTICATED"
          });
        }

        // Get user and check role
        const user = await storage.getUser(userId);
        if (!user) {
          console.log(`User not found in database: ID ${userId}`);
          return res.status(404).json({
            message: "User not found in database",
            code: "USER_NOT_FOUND"
          });
        }

        if (user.role !== "admin") {
          console.log(`Permission denied: User ${user.username} has role ${user.role}, not admin`);
          return res.status(403).json({
            message: "Permission denied: Admin role required",
            code: "NOT_ADMIN"
          });
        }
      }

      const id = parseInt(req.params.id);
      const activity = await storage.getActivity(id);

      if (!activity) {
        console.log(`Activity not found: ID ${id}`);
        return res.status(404).json({
          message: "Activity not found",
          code: "ACTIVITY_NOT_FOUND"
        });
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

      // Log differently based on authentication method
      if (adminHeader === "Bearer Admin-dvd70ply") {
        console.log(`Activity updated successfully: ID ${id} by special admin header auth`);
      } else {
        const userInfo = await storage.getUser(req.session.userId!);
        console.log(`Activity updated successfully: ID ${id} by user ${userInfo ? userInfo.username : 'unknown'}`);
      }

      // Set explicit headers for cookie handling in cross-domain situations
      res.set({
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': req.headers.origin || '*'
      });

      res.json(updatedActivity);
    } catch (error) {
      console.error("Update activity error:", error);
      res.status(500).json({ message: `Error updating activity: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Special admin endpoints for operations (special case for deployment environment)

  // Special admin endpoint for CREATE operations
  app.post("/api/admin-secret-dvd70ply/activities", async (req, res) => {
    try {
      // This is a special unauthenticated admin endpoint for deployment
      console.log("Special admin create endpoint called");

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

      console.log(`Activity created successfully: ID ${createdActivity.id} by special admin endpoint`);

      // Set CORS headers to be fully permissive
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      });

      return res.status(201).json(createdActivity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }

      console.error("Error in special admin create endpoint:", error);
      res.status(500).json({
        message: `Error creating activity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: "SERVER_ERROR"
      });
    }
  });

  // Special admin endpoint for UPDATE operations
  app.patch("/api/admin-secret-dvd70ply/activities/:id", async (req, res) => {
    try {
      // This is a special unauthenticated admin endpoint for deployment
      console.log("Special admin update endpoint called for activity:", req.params.id);

      const id = parseInt(req.params.id);
      const activity = await storage.getActivity(id);

      if (!activity) {
        console.log(`Activity not found: ID ${id}`);
        return res.status(404).json({
          message: "Activity not found",
          code: "ACTIVITY_NOT_FOUND",
          activityId: id
        });
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
      console.log(`Activity updated successfully: ID ${id} by special admin endpoint`);

      // Set CORS headers to be fully permissive
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      });

      return res.json(updatedActivity);
    } catch (error) {
      console.error("Error in special admin update endpoint:", error);
      res.status(500).json({
        message: `Error updating activity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: "SERVER_ERROR"
      });
    }
  });

  // Special admin endpoint for IMPORT operations
  app.post("/api/admin-secret-dvd70ply/activities/import", async (req, res) => {
    try {
      // This is a special unauthenticated admin endpoint for deployment
      console.log("Special admin import endpoint called");

      const { activities } = req.body;

      if (!Array.isArray(activities)) {
        return res.status(400).json({ message: "Invalid import data: 'activities' must be an array" });
      }

      const importedActivities = [];
      const errors = [];

      for (let i = 0; i < activities.length; i++) {
        try {
          const activity = activities[i];
          const validatedData = insertActivitySchema.parse(activity);
          const createdActivity = await storage.createActivity(validatedData);
          importedActivities.push(createdActivity);

          // Create notification for imported activity
          const startDate = new Date(validatedData.startDate);
          const notifyDate = new Date(startDate);
          notifyDate.setDate(startDate.getDate() - 5);

          await storage.createNotification({
            activityId: createdActivity.id,
            notifyDate,
            read: false,
            userId: validatedData.userId,
          });
        } catch (error) {
          errors.push({
            index: i,
            activity: activities[i],
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      console.log(`${importedActivities.length} activities imported successfully by special admin endpoint`);

      // Set CORS headers to be fully permissive
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      });

      return res.status(201).json({
        message: `Imported ${importedActivities.length} activities successfully`,
        importedCount: importedActivities.length,
        totalCount: activities.length,
        importedActivities,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("Error in special admin import endpoint:", error);
      res.status(500).json({
        message: `Error importing activities: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: "SERVER_ERROR"
      });
    }
  });

  // Special admin endpoint for DELETE operations - this is a guaranteed no-auth endpoint 
  // specifically for the deployed environment
  app.delete("/api/admin-secret-dvd70ply/activities/:id", async (req, res) => {
    try {
      // Make sure CORS works by setting headers for all responses
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS, HEAD, GET',
        'Access-Control-Allow-Headers': '*'
      });

      console.log("Special admin delete endpoint called for activity:", req.params.id);
      console.log("Request headers:", req.headers);

      const id = parseInt(req.params.id);

      // Add super robust error handling
      if (isNaN(id)) {
        console.log("Invalid ID format:", req.params.id);
        return res.status(400).json({
          message: "Invalid activity ID format",
          providedId: req.params.id
        });
      }

      let activity;
      try {
        activity = await storage.getActivity(id);
      } catch (dbError) {
        console.error("Database error when fetching activity:", dbError);
        return res.status(500).json({
          message: "Database error when fetching activity",
          error: dbError instanceof Error ? dbError.message : String(dbError)
        });
      }

      if (!activity) {
        console.log(`Activity not found: ID ${id}`);
        return res.status(404).json({
          message: "Activity not found",
          code: "ACTIVITY_NOT_FOUND",
          activityId: id
        });
      }

      // Try to delete with extra error handling
      try {
        await storage.deleteActivity(id);
        console.log(`Activity deleted successfully: ID ${id} by special admin endpoint`);
      } catch (deleteError) {
        console.error("Database error when deleting activity:", deleteError);
        return res.status(500).json({
          message: "Database error when deleting activity",
          error: deleteError instanceof Error ? deleteError.message : String(deleteError)
        });
      }

      // Return successful response
      return res.status(204).send();
    } catch (error) {
      console.error("Unhandled error in special admin delete endpoint:", error);
      // Even in case of error, set CORS headers
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      });

      return res.status(500).json({
        message: `Error deleting activity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: "SERVER_ERROR"
      });
    }
  });

  // Special additional endpoint for admin deletion that supports GET method
  // This is specifically designed for deployment environments where DELETE might be blocked
  app.get("/api/admin-delete-activity-dvd70ply/:id", async (req, res) => {
    try {
      // Set permissive CORS and cache headers for cross-domain operations
      res.set({
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });

      console.log("Alternative GET-based admin delete endpoint called for activity:", req.params.id, "Session ID:", req.session.id);

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const activity = await storage.getActivity(id);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      // Process deletion
      await storage.deleteActivity(id);
      console.log(`Activity deleted successfully via GET: ID ${id}`);

      // If the user is logged in as Administrator, make sure to maintain admin role
      let loggedInUser = null;
      if (req.session.userId) {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          loggedInUser = { id: user.id, username: user.username, role: user.role };

          if (user.username === 'Administrator' && user.role !== 'admin') {
            // Ensure role is admin for Administrator user
            await storage.updateUser(user.id, { role: 'admin' });
            loggedInUser.role = 'admin';
            console.log(`Updated Administrator role to admin for user ID ${user.id}`);
          }
        }
      }

      // Save session to ensure it persists
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Return success with session debug info
      return res.status(200).json({
        success: true,
        message: "Activity deleted successfully",
        id,
        session: {
          id: req.session.id,
          userId: req.session.userId,
          user: loggedInUser
        }
      });
    } catch (error) {
      console.error("Error in GET-based delete endpoint:", error);
      return res.status(500).json({
        message: `Error deleting activity: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // Regular delete activity endpoint (requires authentication)
  app.delete("/api/activities/:id", async (req, res) => {
    try {
      // Set permissive CORS headers for all responses
      res.set({
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS, HEAD, GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key'
      });

      // Debug: Log detailed session and request info
      console.log("Delete activity request received:", {
        activityId: req.params.id,
        sessionId: req.session.id,
        userId: req.session.userId,
        headers: {
          origin: req.headers.origin,
          cookie: req.headers.cookie ? "present" : "absent",
          authorization: req.headers.authorization ? "present" : "absent",
          'x-admin-key': req.headers['x-admin-key'] ? "present" : "absent"
        }
      });

      // SPECIAL DEPLOYMENT HANDLING: Check for admin identifiers in headers
      // This is specifically for the deployed version where sessions might not work
      const adminHeader = req.headers.authorization;
      const adminKey = req.headers['x-admin-key'];
      const adminToken = req.headers['x-admin-auth-token'];
      const adminTokenInQuery = req.query.adminToken;

      // Check all possible admin authentication methods
      if (adminHeader === "Bearer Admin-dvd70ply" ||
        adminKey === "dvd70ply" ||
        adminToken === 'Administrator-dvd70ply' ||
        adminTokenInQuery === 'Administrator-dvd70ply') {
        console.log("Admin authenticated via special header/token");

        // Process directly as Admin (bypass session check)
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid ID format" });
        }

        const activity = await storage.getActivity(id);

        if (!activity) {
          console.log(`Activity not found: ID ${id}`);
          return res.status(404).json({
            message: "Activity not found",
            code: "ACTIVITY_NOT_FOUND",
            activityId: id
          });
        }

        await storage.deleteActivity(id);
        console.log(`Activity deleted successfully: ID ${id} by special admin header auth`);

        return res.status(204).send();
      } else {
        // Regular session-based authentication if no special header
        // Check if user is logged in
        const userId = req.session.userId;
        if (!userId) {
          console.log("Authentication failed: No user ID in session");
          return res.status(401).json({
            message: "Authentication required: You must be logged in as an administrator",
            code: "NOT_AUTHENTICATED",
            debug: {
              sessionId: req.session.id,
              cookiePresent: req.headers.cookie ? true : false
            }
          });
        }

        // Get user and check role
        const user = await storage.getUser(userId);
        if (!user) {
          console.log(`User not found in database: ID ${userId}`);
          return res.status(404).json({
            message: "User not found in database",
            code: "USER_NOT_FOUND",
            userId
          });
        }

        if (user.role !== "admin") {
          console.log(`Permission denied: User ${user.username} has role ${user.role}, not admin`);
          return res.status(403).json({
            message: "Permission denied: Admin role required",
            code: "NOT_ADMIN",
            userRole: user.role
          });
        }

        // Process deletion
        const id = parseInt(req.params.id);
        const activity = await storage.getActivity(id);

        if (!activity) {
          console.log(`Activity not found: ID ${id}`);
          return res.status(404).json({
            message: "Activity not found",
            code: "ACTIVITY_NOT_FOUND",
            activityId: id
          });
        }

        await storage.deleteActivity(id);
        console.log(`Activity deleted successfully: ID ${id} by user ${user.username}`);

        // Set explicit headers for cookie handling in cross-domain situations
        res.set({
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Origin': req.headers.origin || '*'
        });

        res.status(204).send();
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
      res.status(500).json({
        message: `Error deleting activity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: "SERVER_ERROR"
      });
    }
  });

  // Import activities
  app.post("/api/activities/import", async (req, res) => {
    try {
      console.log("Import activities request received:", {
        sessionId: req.session.id,
        userId: req.session.userId,
        activitiesCount: req.body.activities?.length
      });

      // Check if user is logged in
      const userId = req.session.userId;
      if (!userId) {
        console.log("Authentication failed: No user ID in session");
        return res.status(401).json({
          message: "Authentication required: You must be logged in as an administrator",
          code: "NOT_AUTHENTICATED"
        });
      }

      // Get user and check role
      const user = await storage.getUser(userId);
      if (!user) {
        console.log(`User not found in database: ID ${userId}`);
        return res.status(404).json({
          message: "User not found in database",
          code: "USER_NOT_FOUND"
        });
      }

      if (user.role !== "admin") {
        console.log(`Permission denied: User ${user.username} has role ${user.role}, not admin`);
        return res.status(403).json({
          message: "Permission denied: Admin role required",
          code: "NOT_ADMIN"
        });
      }

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

      console.log(`Activities imported successfully: ${importedActivities.length} of ${activities.length} by user ${user.username}`);

      // Set explicit headers for cookie handling in cross-domain situations
      res.set({
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': req.headers.origin || '*'
      });

      res.status(201).json({
        message: `Imported ${importedActivities.length} of ${activities.length} activities`,
        activities: importedActivities,
      });
    } catch (error) {
      console.error("Error importing activities:", error);
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
      let preferences = await storage.getUserPreferences(userId);

      // If preferences don't exist, create default preferences
      if (!preferences) {
        const defaultPreferences: InsertUserPreference = {
          userId,
          defaultViewMode: "timeline",
          defaultRegions: ["italy"],
          notificationsEnabled: true,
          notificationLeadTime: 3,
          notificationMethods: ["app"],
          theme: "light",
          customSettings: {
            showWeekends: true,
            defaultWorkingHours: { start: "09:00", end: "17:00" }
          }
        };

        console.log(`Creating default preferences for user ${userId}`);
        preferences = await storage.createUserPreferences(defaultPreferences);
      }

      res.json(preferences);
    } catch (error) {
      console.error('Error in GET /api/user-preferences/:userId:', error);
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

  // User Routes

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log(`Login attempt for user: ${username}`);

      // Find user by username
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        console.log(`Login failed: Invalid credentials for ${username}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Special handling for administrator account - ensure role is always admin
      let userRole = user.role;
      if (username.toLowerCase() === "administrator" && password === "dvd70ply") {
        // Always ensure admin role for administrator
        userRole = "admin";

        // If the saved role is not admin, update it
        if (user.role !== "admin") {
          console.log(`Updating role for administrator account to admin (was: ${user.role})`);
          await storage.updateUser(user.id, { role: "admin" });
        }
      }

      // Set up session (simplified for demo)
      req.session.userId = user.id;

      // Save session immediately to ensure cookie is set
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      console.log(`Login successful for ${username} (${userRole}). Session ID: ${req.session.id}, User ID: ${user.id}`);

      // Set explicit headers for cookie handling in cross-domain situations
      res.set({
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': req.headers.origin || '*'
      });

      res.json({
        id: user.id,
        username: user.username,
        role: userRole, // Use the potentially updated role
        sessionId: req.session.id // Include for debugging
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: `Login error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    try {
      // Clear the session
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: `Logout error: ${err.message}` });
        }
        res.status(200).json({ message: "Logged out successfully" });
      });
    } catch (error) {
      res.status(500).json({ message: `Logout error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Get current user
  app.get("/api/users/me", async (req, res) => {
    try {
      // Check if user is logged in
      const userId = req.session.userId;

      if (!userId) {
        // Return a default user with 'user' role when not logged in (read-only access)
        return res.json({
          id: 1,
          username: "guest",
          role: "user"
        });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send password to client
      const { password, ...userWithoutPassword } = user;

      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: `Error fetching user: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Update user role (regular method requires session)
  app.patch("/api/users/role", async (req, res) => {
    try {
      const userId = req.session.userId || 1; // Default to user 1 for demo
      const { role } = req.body;

      if (!role || (role !== "admin" && role !== "user")) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user role
      const updatedUser = await storage.updateUser(userId, { role });

      // Don't send password to client
      const { password, ...userWithoutPassword } = updatedUser;

      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: `Error updating user role: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Special admin role update endpoint with direct access using admin key
  app.patch("/api/users/admin-role", async (req, res) => {
    try {
      const { adminKey, role } = req.body;

      // Verify admin key
      if (adminKey !== "dvd70ply") {
        return res.status(401).json({ message: "Invalid admin key" });
      }

      if (!role || (role !== "admin" && role !== "user")) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Find Administrator user
      const user = await storage.getUserByUsername("Administrator");

      if (!user) {
        return res.status(404).json({ message: "Administrator user not found" });
      }

      // Update role for Administrator to always be admin
      const updatedUser = await storage.updateUser(user.id, { role: "admin" });

      // Don't send password to client
      const { password, ...userWithoutPassword } = updatedUser;

      console.log(`Admin role updated successfully for user ${user.username} using admin key`);
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating admin role:", error);
      res.status(500).json({ message: `Error updating admin role: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // User preferences route
  app.get("/api/preferences", async (req, res) => {
    try {
      const userId = req.session.userId || 1; // Default to user 1 for demo
      const preferences = await storage.getUserPreferences(userId);

      if (!preferences) {
        // Create default preferences if not found
        const defaultPreferences = await storage.createUserPreferences({
          userId,
          defaultViewMode: "month",
          defaultRegions: ["italy"],
          theme: "light",
          notificationsEnabled: true,
          notificationLeadTime: 1
        });

        return res.json(defaultPreferences);
      }

      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: `Error fetching preferences: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Update user preferences
  app.patch("/api/preferences", async (req, res) => {
    try {
      const userId = req.session.userId || 1; // Default to user 1 for demo

      // Check if preferences exist, create if not
      let preferences = await storage.getUserPreferences(userId);

      if (!preferences) {
        // Create default preferences first
        preferences = await storage.createUserPreferences({
          userId,
          defaultViewMode: "month",
          defaultRegions: ["italy"],
          theme: "light",
          notificationsEnabled: true,
          notificationLeadTime: 1,
          ...req.body
        });
      } else {
        // Update existing preferences
        preferences = await storage.updateUserPreferences(userId, req.body);
      }

      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: `Error updating preferences: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Attendees Routes

  // Get attendees for an activity
  app.get("/api/activities/:id/attendees", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID format" });

      const attendees = await storage.getAttendees(id);

      // Enhance attendee data with user details (username)
      const attendeesWithUsers = await Promise.all(attendees.map(async (attendee) => {
        const user = await storage.getUser(attendee.userId);
        return {
          ...attendee,
          user: user ? { id: user.id, username: user.username } : null
        };
      }));

      res.json(attendeesWithUsers);
    } catch (error) {
      res.status(500).json({ message: `Error fetching attendees: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Add an attendee to an activity
  app.post("/api/activities/:id/attendees", async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      if (isNaN(activityId)) return res.status(400).json({ message: "Invalid ID format" });

      const validatedData = insertAttendeeSchema.parse({ ...req.body, activityId });

      // Check if already attends
      const currentAttendees = await storage.getAttendees(activityId);
      const existing = currentAttendees.find(a => a.userId === validatedData.userId);

      if (existing) {
        return res.status(409).json({ message: "User is already an attendee" });
      }

      const newAttendee = await storage.addAttendee(validatedData);
      res.status(201).json(newAttendee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attendee data", errors: error.errors });
      }
      res.status(500).json({ message: `Error adding attendee: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Update attendee status
  app.patch("/api/activities/:id/attendees/:userId", async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      if (isNaN(activityId) || isNaN(userId)) return res.status(400).json({ message: "Invalid ID format" });

      const { status } = req.body;
      if (!status) return res.status(400).json({ message: "Status is required" });

      const updatedAttendee = await storage.updateAttendeeStatus(activityId, userId, status);
      res.json(updatedAttendee);
    } catch (error) {
      res.status(500).json({ message: `Error updating attendee: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Remove an attendee
  app.delete("/api/activities/:id/attendees/:userId", async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      if (isNaN(activityId) || isNaN(userId)) return res.status(400).json({ message: "Invalid ID format" });

      await storage.removeAttendee(activityId, userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: `Error removing attendee: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Get all users (for selection in UI)
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send passwords
      const safeUsers = users.map(u => ({ id: u.id, username: u.username, role: u.role }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: `Error fetching users: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  const httpServer = createServer(app);

  // Calendar Export Endpoint
  app.get("/api/calendar/export", async (req, res) => {
    try {
      // 1. Authentication Check (Session, Admin Header, or Query Token)
      let userId = req.session.userId;
      const adminHeader = req.headers.authorization;
      const queryToken = req.query.adminToken;

      if (adminHeader === "Bearer Admin-dvd70ply" || queryToken === "Administrator-dvd70ply") {
        // Admin via header or query token - treat as Administrator (ID 1)
        const adminUser = await storage.getUserByUsername("Administrator");
        if (adminUser) userId = adminUser.id;
      }

      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // 2. Fetch Activities
      // We want activities where:
      // - The user is the creator (a.userId === userId)
      // - OR The user is an attendee

      const allActivities = await storage.getAllActivities();
      const allAttendees = await storage.getAllAttendees();

      // Filter: Creator
      const ownedActivities = allActivities.filter(a => a.userId === userId);

      // Filter: Attendee
      const attendedActivityIds = allAttendees
        .filter(at => at.userId === userId)
        .map(at => at.activityId);

      const attendedActivities = allActivities.filter(a => attendedActivityIds.includes(a.id));

      // Combine and Deduplicate
      const activityMap = new Map();
      [...ownedActivities, ...attendedActivities].forEach(a => activityMap.set(a.id, a));
      const userActivities = Array.from(activityMap.values());

      // 3. Generate ICS
      // We need to dynamically import ical-generator as it might be an ESM module
      const { default: ical } = await import("ical-generator");

      const calendar = ical({
        name: 'JobTrack Export',
        timezone: 'Europe/Rome' // Defaulting to simple timezone for now
      });

      userActivities.forEach(activity => {
        calendar.createEvent({
          start: new Date(activity.startDate),
          end: new Date(activity.endDate),
          summary: activity.title,
          description: activity.description || '',
          location: activity.location || '',
          url: `http://localhost:5005/activities/${activity.id}` // Link back to app
        });
      });

      // 4. Send Response
      const filename = `jobtrack-export-${new Date().toISOString().split('T')[0]}.ics`;
      res.set({
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      });
      res.send(calendar.toString());

    } catch (error) {
      console.error("Calendar export error:", error);
      res.status(500).json({ message: "Failed to generate calendar export" });
    }
  });


  // Outlook Integration Routes

  // 1. Redirect to Microsoft Login
  app.get("/api/auth/outlook/login", (req, res) => {
    try {
      // Create a state to prevent CSRF (simple random string for now)
      const state = Math.random().toString(36).substring(7);
      req.session.oauthState = state; // We need to add this to SessionData if strict, or just ignore TS error for now or add it

      const authUrl = OutlookAuth.getAuthUrl(state);
      res.redirect(authUrl);
    } catch (error) {
      console.error("Outlook auth error:", error);
      res.status(500).json({ message: "Failed to initialize Outlook login" });
    }
  });

  // 2. Handle Callback
  app.get("/api/auth/outlook/callback", async (req, res) => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.status(400).send(`Error from Microsoft: ${error}`);
      }

      // Verify state (optional but recommended)
      // if (state !== req.session.oauthState) ...

      if (!code || typeof code !== 'string') {
        return res.status(400).send("No authorization code received");
      }

      // Exchange code for tokens
      const tokenResponse = await OutlookAuth.getTokens(code);

      // Store token in session
      req.session.outlookToken = tokenResponse.access_token;

      // Redirect back to dashboard with success flag
      res.redirect('/dashboard?outlook_connected=true');
    } catch (error) {
      console.error("Outlook callback error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // 3. Status Check
  app.get("/api/outlook/status", (req, res) => {
    res.json({ connected: !!req.session.outlookToken });
  });

  // 4. Manual Sync Trigger
  app.post("/api/outlook/sync", async (req, res) => {
    try {
      const token = req.session.outlookToken;
      if (!token) {
        return res.status(401).json({ message: "Not connected to Outlook" });
      }

      // Get activities for current user
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not logged in" });
      }

      // Get user's activities coming up
      const activities = await storage.getAllActivities();
      const userActivities = activities.filter(a => a.userId === userId);

      const results = [];
      for (const activity of userActivities) {
        try {
          // Only sync future activities or recent ones? For now, sync all.
          await OutlookService.syncActivity(token, activity);
          results.push({ id: activity.id, status: 'synced' });
        } catch (e) {
          console.error(`Failed to sync activity ${activity.id}`, e);
          results.push({ id: activity.id, status: 'failed', error: String(e) });
        }
      }

      res.json({ message: "Sync completed", results });
    } catch (error) {
      console.error("Sync error:", error);
      res.status(500).json({ message: "Sync failed" });
    }
  });

  // Bulk Import Endpoint (for Excel Import)
  app.post("/api/activities/import", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { activities } = req.body;

      if (!Array.isArray(activities)) {
        return res.status(400).json({ message: "Invalid format: activities must be an array" });
      }

      const results = {
        imported: 0,
        errors: 0,
        activities: [] as any[]
      };

      for (const activityData of activities) {
        try {
          // Prepare data for insertion
          const insertData = {
            ...activityData,
            userId: req.session.userId,
            // Defaults if missing
            type: activityData.type || 'project',
            status: activityData.status || 'confirmed',
            startDate: new Date(activityData.startDate),
            endDate: new Date(activityData.endDate)
          };

          // Basic validation
          const validatedData = insertActivitySchema.parse(insertData);

          // Check for duplicates (Simple check based on matching title + start date)
          // Ideally we would do this in a single query but for now iteration is fine for small batches
          const allActivities = await storage.getAllActivities();
          const existing = allActivities.find(a =>
            a.userId === req.session.userId &&
            a.title === validatedData.title &&
            new Date(a.startDate).getTime() === new Date(validatedData.startDate).getTime()
          );

          if (existing) {
            // Update if exists?? Or Skip?
            // Plan said "Default: Update".
            const updated = await storage.updateActivity(existing.id, validatedData);
            results.activities.push(updated);
            results.imported++;
          } else {
            // Create new
            const created = await storage.createActivity(validatedData);

            // Create a notification for this activity (5 days before start date)
            const startDate = new Date(validatedData.startDate);
            const notifyDate = new Date(startDate);
            notifyDate.setDate(startDate.getDate() - 5);

            await storage.createNotification({
              activityId: created.id,
              notifyDate,
              read: false,
              userId: req.session.userId!,
            });

            results.activities.push(created);
            results.imported++;
          }

        } catch (error) {
          console.error("Error importing single activity:", error);
          results.errors++;
        }
      }

      res.status(201).json({
        message: `Processed ${activities.length} rows. Imported/Updated: ${results.imported}, Failed: ${results.errors}`,
        activities: results.activities
      });

    } catch (error) {
      console.error("Bulk import error:", error);
      res.status(500).json({ message: "Bulk import failed" });
    }
  });

  return httpServer;
}

