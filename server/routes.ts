import type { Express } from "express";
import { createServer, type Server } from "http";
import session from 'express-session';

// Import route modules
import { registerAuthRoutes } from "./routes/auth";
import { registerActivityRoutes } from "./routes/activities";
import { registerNotificationRoutes } from "./routes/notifications";
import { registerPreferenceRoutes } from "./routes/user-preferences";
import { registerHolidayRoutes } from "./routes/holidays";
import { registerAdminRoutes } from "./routes/admin";

// Extend Express Request type to include session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    outlookToken?: string; // Store Outlook Access Token in session
    oauthState?: string;
  }
}

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

  // Register modular routes
  registerAuthRoutes(app);
  registerActivityRoutes(app);
  registerNotificationRoutes(app);
  registerPreferenceRoutes(app);
  registerHolidayRoutes(app);
  registerAdminRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
