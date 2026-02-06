import type { Express } from "express";
import { storage } from "../storage";

export function registerNotificationRoutes(app: Express) {
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
}
