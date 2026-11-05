import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import type { Upload } from "@/lib/sync-api";
import { fleetSeats, saveCheckin } from "@/server/checkins";

// Runs the real migration on an in-process Postgres, so the keys that prevent double-booking are tested too.
const migration = readFileSync(join(__dirname, "../../drizzle/0000_init.sql"), "utf8").split("--> statement-breakpoint");

let db: ReturnType<typeof drizzle<typeof schema>>;
beforeEach(async () => {
  const pg = new PGlite();
  for (const sql of migration) await pg.exec(sql);
  db = drizzle(pg, { schema });
});

const FLEET = "fleet-0001";
const upload = (id: string, passengers: [string, string][], kioskId = "kiosk-a", code = "K7Q2TR"): Upload => ({
  fleetId: FLEET,
  kioskId,
  record: {
    id,
    code,
    flightId: "f214",
    createdAt: Date.UTC(2026, 10, 3, 15),
    passengers: passengers.map(([pid, seat]) => ({ id: pid, first: "A", last: "B", seat, bags: 0 })),
  },
});
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("saveCheckin", () => {
  it("stores a check-in and its seats", async () => {
    expect(await saveCheckin(db, upload(uuid(1), [["p1", "10A"], ["p2", "10B"]]))).toEqual({ status: "ok", conflicts: [], replayed: false });
    expect((await fleetSeats(db, FLEET)).map((s) => s.seat).sort()).toEqual(["10A", "10B"]);
  });

  it("returns the same answer when a kiosk retries, without storing twice", async () => {
    await saveCheckin(db, upload(uuid(1), [["p1", "10A"]]));
    expect(await saveCheckin(db, upload(uuid(1), [["p1", "10A"]]))).toEqual({ status: "ok", conflicts: [], replayed: true });
    expect(await fleetSeats(db, FLEET)).toHaveLength(1);
  });

  it("gives a seat to the first kiosk to sync and flags the second", async () => {
    await saveCheckin(db, upload(uuid(1), [["p1", "14B"]], "kiosk-a", "N4VX8P"));
    const second = await saveCheckin(db, upload(uuid(2), [["p1", "14B"], ["p2", "14C"]], "kiosk-b", "B9DL3M"));
    expect(second).toEqual({ status: "conflict", conflicts: [{ passengerId: "p1", seat: "14B", reason: "seat_taken" }], replayed: false });
    // The traveller without a clash keeps their seat, and a retry repeats the conflict.
    expect((await fleetSeats(db, FLEET)).map((s) => s.seat).sort()).toEqual(["14B", "14C"]);
    expect((await saveCheckin(db, upload(uuid(2), [["p1", "14B"], ["p2", "14C"]], "kiosk-b", "B9DL3M"))).conflicts).toHaveLength(1);
  });

  it("flags a traveller checked in on two kiosks", async () => {
    await saveCheckin(db, upload(uuid(1), [["p1", "10A"]]));
    const again = await saveCheckin(db, upload(uuid(2), [["p1", "20F"]], "kiosk-b"));
    expect(again.conflicts).toEqual([{ passengerId: "p1", seat: "20F", reason: "already_checked_in" }]);
  });

  it("keeps fleets apart", async () => {
    await saveCheckin(db, upload(uuid(1), [["p1", "10A"]]));
    const other = { ...upload(uuid(2), [["p1", "10A"]]), fleetId: "fleet-0002" };
    expect((await saveCheckin(db, other)).status).toBe("ok");
    expect(await fleetSeats(db, "fleet-0002")).toHaveLength(1);
    await expect(saveCheckin(db, { ...upload(uuid(1), [["p1", "10A"]]), fleetId: "fleet-0002" })).rejects.toThrow();
  });
});
