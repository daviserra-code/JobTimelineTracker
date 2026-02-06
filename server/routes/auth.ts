import type { Express } from "express";
import { storage } from "../storage";
import { OutlookAuth } from "../outlook-auth";

export function registerAuthRoutes(app: Express) {
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

    // Outlook Integration Routes

    // 1. Redirect to Microsoft Login
    app.get("/api/auth/outlook/login", (req, res) => {
        try {
            // Create a state to prevent CSRF (simple random string for now)
            const state = Math.random().toString(36).substring(7);
            req.session.oauthState = state;

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
}
