import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./db";
import { log } from "./vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
    try {
        log("Running database migrations...");

        // Check if migrations folder exists
        const migrationsFolder = path.resolve(__dirname, "..", "migrations");
        if (!fs.existsSync(migrationsFolder)) {
            log("Migrations folder not found, skipping migrations.", "warn");
            return;
        }

        // Run migrations
        await migrate(db, { migrationsFolder });
        log("Migrations completed successfully.");
    } catch (error) {
        log(`Migration failed: ${error}`, "error");
        // We don't exit here, allowing the app to attempt to start even if migration fails 
        // (though in prod it might be fatal)
        throw error;
    }
}
