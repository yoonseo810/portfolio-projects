CREATE TABLE "kiosk_checkins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"fleet_id" text NOT NULL,
	"kiosk_id" text NOT NULL,
	"code" text NOT NULL,
	"flight_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"conflicts" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kiosk_seats" (
	"fleet_id" text NOT NULL,
	"flight_id" text NOT NULL,
	"seat" text NOT NULL,
	"code" text NOT NULL,
	"passenger_id" text NOT NULL,
	"checkin_id" uuid NOT NULL,
	CONSTRAINT "kiosk_seats_fleet_id_flight_id_seat_pk" PRIMARY KEY("fleet_id","flight_id","seat")
);
--> statement-breakpoint
ALTER TABLE "kiosk_seats" ADD CONSTRAINT "kiosk_seats_checkin_id_kiosk_checkins_id_fk" FOREIGN KEY ("checkin_id") REFERENCES "public"."kiosk_checkins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kiosk_checkins_fleet_idx" ON "kiosk_checkins" USING btree ("fleet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "kiosk_seats_passenger_idx" ON "kiosk_seats" USING btree ("fleet_id","code","passenger_id");--> statement-breakpoint
-- The app writes through a server-side Postgres connection. RLS with no policies closes these
-- tables to Supabase's public data API, so browsers can never read or write them directly.
ALTER TABLE "kiosk_checkins" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kiosk_seats" ENABLE ROW LEVEL SECURITY;
