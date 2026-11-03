import { index, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/** Why one traveller's seat didn't stick when a check-in reached the server. */
export type SeatConflict = {
  passengerId: string;
  seat: string;
  reason: "seat_taken" | "already_checked_in";
};

/**
 * One row per check-in, keyed by the id the kiosk made. Uploading the same check-in again finds this
 * row and returns the stored result, so retries after a dropped connection can't double-book.
 * A "fleet" is one visitor's set of kiosks (their browser tabs), so demos never collide.
 */
export const kioskCheckins = pgTable(
  "kiosk_checkins",
  {
    id: uuid("id").primaryKey(),
    fleetId: text("fleet_id").notNull(),
    kioskId: text("kiosk_id").notNull(),
    code: text("code").notNull(),
    flightId: text("flight_id").notNull(),
    /** When the traveller confirmed on the kiosk, which may be long before it synced. */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    conflicts: jsonb("conflicts").$type<SeatConflict[]>().notNull().default([]),
  },
  (t) => [index("kiosk_checkins_fleet_idx").on(t.fleetId)],
);

/** The seat each traveller holds. The keys make "one traveller per seat" and "one seat per traveller" true in the database. */
export const kioskSeats = pgTable(
  "kiosk_seats",
  {
    fleetId: text("fleet_id").notNull(),
    flightId: text("flight_id").notNull(),
    seat: text("seat").notNull(),
    code: text("code").notNull(),
    passengerId: text("passenger_id").notNull(),
    checkinId: uuid("checkin_id")
      .notNull()
      .references(() => kioskCheckins.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.fleetId, t.flightId, t.seat] }),
    uniqueIndex("kiosk_seats_passenger_idx").on(t.fleetId, t.code, t.passengerId),
  ],
);
