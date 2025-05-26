import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required. Get this from your Supabase project settings."
  );
}

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./migrations",
  driver: "pg", // PostgreSQL driver
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
  // Supabase specific settings
  verbose: true,
  strict: true,
  tablesFilter: ["!_prisma_migrations"], // Exclude Prisma migration tables if they exist
});
