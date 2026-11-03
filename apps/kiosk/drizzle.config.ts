import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  // Shares a Supabase database with the other apps, so keep a separate history table.
  migrations: { table: "__drizzle_migrations_kiosk" },
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
