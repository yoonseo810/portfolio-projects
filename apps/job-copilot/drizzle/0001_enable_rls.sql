-- The app reads and writes through a server-side Postgres connection and scopes
-- every query by user_id. Enabling RLS with no policies closes these tables to
-- Supabase's public data API (anon/authenticated roles), so the browser can
-- never query them directly.
ALTER TABLE "resumes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "analyses" ENABLE ROW LEVEL SECURITY;
