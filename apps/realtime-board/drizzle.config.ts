import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  // Shares a Supabase database with the job copilot, so keep a separate history table.
  migrations: { table: "__drizzle_migrations_board" },
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
