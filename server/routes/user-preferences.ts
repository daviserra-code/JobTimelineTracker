import type { Express } from "express";
import { storage } from "../storage";
import { insertUserPreferencesSchema, InsertUserPreference } from "@shared/schema";
import { z } from "zod";

export function registerPreferenceRoutes(app: Express) {
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

    // User preferences route (legacy/simplified)
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

    // Update user preferences (legacy/simplified)
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
}
