import type { Express } from "express";
import { storage } from "../storage";
import { insertActivitySchema } from "@shared/schema";
import { z } from "zod";

export function registerAdminRoutes(app: Express) {
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

    // Special additional endpoint for admin delete that supports GET method
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
}
