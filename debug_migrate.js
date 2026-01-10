import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@db:5432/job_scheduler",
});
const db = drizzle(pool);

console.log("Current directory:", process.cwd());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log("__dirname:", __dirname);

const migrationsFolder = "/app/migrations";
console.log("Target migrations folder:", migrationsFolder);
console.log("Exists?", fs.existsSync(migrationsFolder));
if (fs.existsSync(migrationsFolder)) {
    console.log("Contents:", fs.readdirSync(migrationsFolder));
}

(async () => {
    try {
        console.log("Running migrate...");
        await migrate(db, { migrationsFolder });
        console.log("Done.");
    } catch (e) {
        console.error("Migration error:", e);
    } finally {
        await pool.end();
    }
})();
