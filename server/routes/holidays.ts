import type { Express } from "express";
import { getHolidaysForYear } from "../holiday-api";

export function registerHolidayRoutes(app: Express) {
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
}
