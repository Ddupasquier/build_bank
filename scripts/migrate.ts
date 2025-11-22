import { initDb } from "../electron/db";

// Simple entrypoint to ensure DB and tables exist.
initDb();
console.log("Database initialized.");
