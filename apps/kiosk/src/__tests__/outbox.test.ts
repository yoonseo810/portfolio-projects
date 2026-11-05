import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import type { CheckinRecord } from "@/lib/checkin";
import { fleetLedger, takenSeats } from "@/lib/fleet";
import { applyFailure, applyResult, backoffMs, due, newEntry, outbox } from "@/lib/outbox";
import { soldSeats } from "@/lib/seats";

const record = (id: string, createdAt: number, seat = "10A"): CheckinRecord => ({
  id,
  code: "K7Q2TR",
  flightId: "f214",
  createdAt,
  passengers: [{ id: "p1", first: "Camille", last: "Tremblay", seat, bags: 1 }],
});

describe("outbox rules", () => {
  it("backs off 1, 2, 4 … seconds, up to 30", () => {
    expect([1, 2, 3, 4, 5, 6, 10].map(backoffMs)).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000]);
  });

  it("retries a failed upload later, and stops once the server answers", () => {
    let e = newEntry(record("a", 1));
    e = applyFailure(e, "offline", 5_000);
    expect(e).toMatchObject({ status: "pending", attempts: 1, retryAt: 6_000, lastError: "offline" });
    expect(due([e], 5_500)).toEqual([]);
    expect(due([e], 6_000)).toEqual([e]);
    const conflicts = [{ passengerId: "p1", seat: "10A", reason: "seat_taken" as const }];
    e = applyResult(e, { status: "conflict", conflicts, replayed: false }, 7_000);
    expect(e).toMatchObject({ status: "conflict", conflicts, syncedAt: 7_000, lastError: undefined });
    expect(due([e], 9_999_999)).toEqual([]);
  });

  it("uploads oldest first, so the earlier kiosk visit wins a seat", () => {
    const later = newEntry(record("b", 20));
    const earlier = newEntry(record("a", 10));
    expect(due([later, earlier], 0).map((e) => e.record.id)).toEqual(["a", "b"]);
  });
});

describe("outbox storage", () => {
  it("keeps check-ins in IndexedDB across page loads", async () => {
    await outbox.put(newEntry(record("a", 1)));
    await outbox.put({ ...newEntry(record("a", 1)), status: "synced" });
    await outbox.put(newEntry(record("b", 2)));
    const all = await outbox.all();
    expect(all.map((e) => [e.record.id, e.status]).sort()).toEqual([["a", "synced"], ["b", "pending"]]);
    await outbox.clear();
    expect(await outbox.all()).toEqual([]);
  });
});

describe("fleet view", () => {
  it("combines sold seats, this kiosk's check-ins and other kiosks' seats", () => {
    const remote = [{ flightId: "f214", seat: "29F", code: "B9DL3M", passengerId: "p2" }];
    const taken = takenSeats("f214", [record("a", 1, "10A")], remote);
    expect(taken.has("10A") && taken.has("29F")).toBe(true);
    expect(taken.size).toBe(soldSeats("f214").size + 2 - [...soldSeats("f214")].filter((s) => s === "10A" || s === "29F").length);
    expect(fleetLedger([record("a", 1, "10A")], remote)).toEqual({ "K7Q2TR/p1": "10A", "B9DL3M/p2": "29F" });
  });
});
