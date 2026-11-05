import { and, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "@/db/schema";
import type { FleetSeat, SeatConflict, Upload, UploadResult } from "@/lib/sync-api";

// Works with postgres-js in production and PGlite in tests.
type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

const { kioskCheckins: checkins, kioskSeats: seats } = schema;

/**
 * Stores a check-in exactly once. The first upload claims each seat; a seat (or traveller) another
 * kiosk already claimed becomes a conflict for an agent to sort out. Any later upload of the same id
 * gets the stored answer back, so a kiosk can retry as often as it likes.
 */
export async function saveCheckin(db: DB, { fleetId, kioskId, record }: Upload): Promise<UploadResult> {
  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(checkins)
      .values({ id: record.id, fleetId, kioskId, code: record.code, flightId: record.flightId, createdAt: new Date(record.createdAt) })
      .onConflictDoNothing({ target: checkins.id })
      .returning({ id: checkins.id });

    if (!inserted.length) {
      const [prev] = await tx.select().from(checkins).where(eq(checkins.id, record.id));
      // Ids are random UUIDs, so another fleet's row with this id means a forged upload.
      if (!prev || prev.fleetId !== fleetId) throw new Error("Check-in id belongs to another fleet");
      return result(prev.conflicts, true);
    }

    const conflicts: SeatConflict[] = [];
    for (const p of record.passengers) {
      const claimed = await tx
        .insert(seats)
        .values({ fleetId, flightId: record.flightId, seat: p.seat, code: record.code, passengerId: p.id, checkinId: record.id })
        .onConflictDoNothing()
        .returning({ seat: seats.seat });
      if (claimed.length) continue;
      const [already] = await tx
        .select({ seat: seats.seat })
        .from(seats)
        .where(and(eq(seats.fleetId, fleetId), eq(seats.code, record.code), eq(seats.passengerId, p.id)));
      conflicts.push({ passengerId: p.id, seat: p.seat, reason: already ? "already_checked_in" : "seat_taken" });
    }
    if (conflicts.length) await tx.update(checkins).set({ conflicts }).where(eq(checkins.id, record.id));
    return result(conflicts, false);
  });
}

const result = (conflicts: SeatConflict[], replayed: boolean): UploadResult => ({
  status: conflicts.length ? "conflict" : "ok",
  conflicts,
  replayed,
});

export async function fleetSeats(db: DB, fleetId: string): Promise<FleetSeat[]> {
  return db
    .select({ flightId: seats.flightId, seat: seats.seat, code: seats.code, passengerId: seats.passengerId })
    .from(seats)
    .where(eq(seats.fleetId, fleetId))
    .limit(2000);
}
