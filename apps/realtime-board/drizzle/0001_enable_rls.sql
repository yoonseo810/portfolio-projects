-- The app reads and writes through a server-side Postgres connection. Enabling
-- RLS with no policies closes these tables to Supabase's public data API, so
-- the browser can never query them directly. Live updates go over Realtime
-- broadcast channels instead of table subscriptions.
ALTER TABLE "boards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cards" ENABLE ROW LEVEL SECURITY;
