import { describe, expect, it } from "vitest";
import { bcbp, dayOfYear } from "@/lib/boarding-pass";
import { type Action, canAdvance, initialState, makeRecord, reducer, type State } from "@/lib/checkin";
import { CHECKIN_CLOSES_MIN, lookupBooking, normalizeName } from "@/lib/flights";
import { MESSAGES } from "@/lib/i18n";
import { autoAssign, getSeat, SEATS, seatBlock, soldSeats } from "@/lib/seats";

const NOW = Date.UTC(2026, 10, 3, 15, 0);
const none = new Set<string>();
const run = (actions: Action[], s: State = initialState) => actions.reduce(reducer, s);
const found = (code: string, last: string, taken: ReadonlySet<string> = none): Action => ({
  type: "lookup",
  result: lookupBooking(code, last, { now: NOW }),
  taken,
});

describe("lookupBooking", () => {
  it("matches any passenger's last name, ignoring case, spaces and accents", () => {
    expect(lookupBooking(" k7q2tr ", "tremblay", { now: NOW }).ok).toBe(true);
    expect(normalizeName("Lé-a ")).toBe("LEA");
  });

  it("reports a wrong name as not found, so codes can't be probed", () => {
    expect(lookupBooking("K7Q2TR", "Nguyen", { now: NOW })).toEqual({ ok: false, reason: "not_found" });
    expect(lookupBooking("ZZZZZZ", "Tremblay", { now: NOW })).toEqual({ ok: false, reason: "not_found" });
  });

  it("closes check-in 45 minutes before departure", () => {
    expect(lookupBooking("R2HZ6W", "Martin", { now: NOW })).toEqual({ ok: false, reason: "closed" });
    // HRB 214 leaves 150 min after the anchor, so it closes 105 min in.
    const anchor = NOW - (150 - CHECKIN_CLOSES_MIN) * 60_000;
    expect(lookupBooking("K7Q2TR", "Tremblay", { now: NOW, anchor })).toEqual({ ok: false, reason: "closed" });
    expect(lookupBooking("K7Q2TR", "Tremblay", { now: NOW, anchor: anchor + 60_000 }).ok).toBe(true);
  });

  it("treats this kiosk's earlier check-ins as done", () => {
    const ledger = { "B9DL3M/p2": "22D" };
    expect(lookupBooking("B9DL3M", "Okafor", { now: NOW, ledger })).toEqual({ ok: false, reason: "all_checked_in" });
  });
});

describe("seats", () => {
  it("has 16 premium and 120 economy seats", () => {
    expect(SEATS.filter((s) => s.cabin === "premium")).toHaveLength(16);
    expect(SEATS.filter((s) => s.cabin === "economy")).toHaveLength(120);
  });

  it("sells the same seats on every kiosk", () => {
    expect([...soldSeats("f214")]).toEqual([...soldSeats("f214")]);
    expect([...soldSeats("f214")]).not.toEqual([...soldSeats("f118")]);
  });

  it("keeps children out of exit rows and travellers in their cabin", () => {
    const child = { id: "c", first: "A", last: "B", type: "child", cabin: "economy" } as const;
    const adult = { ...child, type: "adult" } as const;
    expect(seatBlock(getSeat("14A")!, child, none)).toBe("child_exit");
    expect(seatBlock(getSeat("14A")!, adult, none)).toBeNull();
    expect(seatBlock(getSeat("2A")!, adult, none)).toBe("cabin");
    expect(seatBlock(getSeat("20A")!, adult, new Set(["20A"]))).toBe("taken");
  });

  it("seats a group side by side, skipping exit rows and gaps", () => {
    const family = lookupBooking("K7Q2TR", "Tremblay", { now: NOW });
    if (!family.ok) throw new Error();
    // Row 10 has a gap on the left (B taken) and only two seats on the right.
    const taken = new Set(["10B", "10F"]);
    const seats = autoAssign(family.booking.passengers, taken);
    expect(Object.values(seats)).toEqual(["11A", "11B", "11C"]);
  });
});

describe("check-in reducer", () => {
  it("walks a family through every step", () => {
    let s = run([{ type: "start" }, found("K7Q2TR", "Tremblay")]);
    expect(s.step).toBe("passengers");
    expect(s.selected).toEqual(["p1", "p2", "p3"]);
    s = run([{ type: "next", taken: none }], s);
    expect(s.step).toBe("seats");
    expect(Object.values(s.seats)).toEqual(["10A", "10B", "10C"]);
    s = run([{ type: "next", taken: none }, { type: "bags", passengerId: "p1", count: 5 }, { type: "next", taken: none }], s);
    expect(s.step).toBe("review");
    expect(s.bags.p1).toBe(2);
    s = reducer(s, { type: "confirmed", record: makeRecord(s, "id-1", NOW) });
    expect(s.step).toBe("done");
    expect(s.record?.passengers.map((p) => [p.seat, p.bags])).toEqual([["10A", 2], ["10B", 0], ["10C", 0]]);
  });

  it("goes straight to seats for a single traveller, and back returns to the search", () => {
    const s = run([{ type: "start" }, found("N4VX8P", "Nguyen")]);
    expect(s.step).toBe("seats");
    expect(getSeat(s.seats.p1)?.cabin).toBe("premium");
    expect(reducer(s, { type: "back" })).toEqual({ ...initialState, step: "find" });
  });

  it("only offers travellers who aren't checked in yet", () => {
    const s = run([{ type: "start" }, found("B9DL3M", "Okafor")]);
    expect(s.step).toBe("seats");
    expect(s.selected).toEqual(["p2"]);
    expect(reducer(s, { type: "toggle", passengerId: "p1" }).selected).toEqual(["p2"]);
  });

  it("can't continue with nobody selected", () => {
    let s = run([{ type: "start" }, found("K7Q2TR", "Tremblay")]);
    for (const id of ["p1", "p2", "p3"]) s = reducer(s, { type: "toggle", passengerId: id });
    expect(canAdvance(s)).toBe(false);
    expect(reducer(s, { type: "next", taken: none }).step).toBe("passengers");
    // Re-selecting keeps booking order, not click order.
    s = run([{ type: "toggle", passengerId: "p3" }, { type: "toggle", passengerId: "p1" }], s);
    expect(s.selected).toEqual(["p1", "p3"]);
  });

  it("swaps seats inside the group, but never puts the child in an exit row", () => {
    let s = run([{ type: "start" }, found("K7Q2TR", "Tremblay"), { type: "next", taken: none }]);
    s = reducer(s, { type: "seat", passengerId: "p1", seat: "10C", taken: none });
    expect([s.seats.p1, s.seats.p3]).toEqual(["10C", "10A"]);
    s = reducer(s, { type: "seat", passengerId: "p1", seat: "14A", taken: none });
    s = reducer(s, { type: "seat", passengerId: "p3", seat: "14A", taken: none });
    expect(s.seats.p3).toBe("10A");
    s = reducer(s, { type: "seat", passengerId: "p1", seat: "10A", taken: none });
    // p3 held 10A; p1's old seat is an exit row, so p3 is left to choose again.
    expect(s.seats.p1).toBe("10A");
    expect(s.seats.p3).toBeUndefined();
    expect(canAdvance(s)).toBe(false);
  });

  it("refuses a seat someone else holds", () => {
    const s = run([{ type: "start" }, found("N4VX8P", "Nguyen")]);
    expect(reducer(s, { type: "seat", passengerId: "p1", seat: "2A", taken: new Set(["2A"]) })).toBe(s);
  });

  it("forgets the traveller on reset", () => {
    const s = run([{ type: "start" }, found("K7Q2TR", "Tremblay"), { type: "reset" }]);
    expect(s).toEqual(initialState);
  });
});

describe("boarding pass", () => {
  it("builds a 60-character BCBP mandatory section", () => {
    const text = bcbp({
      first: "Léa",
      last: "Tremblay",
      code: "K7Q2TR",
      from: "YYZ",
      to: "YUL",
      flight: "HRB 214",
      departs: new Date(2026, 10, 3, 18).getTime(),
      cabin: "economy",
      seat: "10C",
      sequence: 7,
    });
    expect(text).toHaveLength(60);
    expect(text).toBe("M1TREMBLAY/LEA        EK7Q2TR YYZYULHRB0214 307Y010C0007 100");
    expect(dayOfYear(new Date(2026, 0, 1, 12).getTime())).toBe(1);
  });
});

describe("translations", () => {
  it("has every English key in French", () => {
    const keys = (o: object, p = ""): string[] =>
      Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
    expect(keys(MESSAGES.fr).sort()).toEqual(keys(MESSAGES.en).sort());
  });
});
