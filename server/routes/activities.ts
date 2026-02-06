import type { Express } from "express";
import { storage } from "../storage";
import { insertActivitySchema, insertAttendeeSchema } from "@shared/schema";
import { z } from "zod";
import { OutlookService } from "../outlook-service";

export function registerActivityRoutes(app: Express) {
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
            const adminHeader = req.headers.authorization;
            if (adminHeader === "Bearer Admin-dvd70ply") {
                console.log("Admin authenticated via authorization header");
                // Process directly as Admin
            } else {
                // Regular session-based authentication
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

            const userActivities = userId
                ? activities.filter(a => a.userId === userId)
                : activities; // If admin header and no session, consider ALL activities as potential conflicts

            const { findNextAvailableSlot } = await import("../lib/scheduler");

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
            const adminHeader = req.headers.authorization;
            if (adminHeader === "Bearer Admin-dvd70ply") {
                console.log("Admin authenticated via authorization header");
                // Process directly as Admin
            } else {
                // Regular session-based authentication
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

    // Regular delete activity endpoint (requires authentication)
    app.delete("/api/activities/:id", async (req, res) => {
        try {
            // Set permissive CORS headers for all responses
            res.set({
                'Access-Control-Allow-Origin': req.headers.origin || '*',
                'Access-Control-Allow-Methods': 'DELETE, OPTIONS, HEAD, GET, POST',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key'
            });

            // SPECIAL DEPLOYMENT HANDLING: Check for admin identifiers in headers
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

                // Process directly as Admin
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
                // Regular session-based authentication
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
                    return res.status(404).json({
                        message: "User not found in database",
                        code: "USER_NOT_FOUND",
                        userId
                    });
                }

                if (user.role !== "admin") {
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

                    // Check for duplicates
                    const allActivities = await storage.getAllActivities();
                    const existing = allActivities.find(a =>
                        a.userId === req.session.userId &&
                        a.title === validatedData.title &&
                        new Date(a.startDate).getTime() === new Date(validatedData.startDate).getTime()
                    );

                    if (existing) {
                        // Update if exists?? Or Skip?
                        const updated = await storage.updateActivity(existing.id, validatedData);
                        results.activities.push(updated);
                        results.imported++;
                    } else {
                        // Create new
                        const created = await storage.createActivity(validatedData);

                        // Create a notification
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

    // Outlook Integration Routes for Manual Sync Trigger
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
}
