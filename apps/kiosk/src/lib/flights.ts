/**
 * Sample data for a made-up airline. Departure times are stored as minutes from "now" and resolved
 * when a booking is looked up, so the demo always has flights leaving today.
 */
export const AIRLINE = "Harbourline Air";

export type Cabin = "premium" | "economy";
export type PassengerType = "adult" | "child";

export type Airport = { code: string; city: string };

export const AIRPORTS = {
  YYZ: { code: "YYZ", city: "Toronto" },
  YVR: { code: "YVR", city: "Vancouver" },
  YUL: { code: "YUL", city: "Montréal" },
  YHZ: { code: "YHZ", city: "Halifax" },
  YYC: { code: "YYC", city: "Calgary" },
} satisfies Record<string, Airport>;

export type FlightDef = {
  id: string;
  number: string;
  from: Airport;
  to: Airport;
  departsInMin: number;
  gate: string;
  /** Boarding starts this many minutes before departure. */
  boardingLeadMin: number;
};

export type PassengerDef = {
  id: string;
  first: string;
  last: string;
  type: PassengerType;
  cabin: Cabin;
  /** Already checked in elsewhere (online or another kiosk). */
  checkedIn?: { seat: string };
};

export type BookingDef = { code: string; flightId: string; passengers: PassengerDef[] };

export const FLIGHTS: FlightDef[] = [
  { id: "f214", number: "HRB 214", from: AIRPORTS.YYZ, to: AIRPORTS.YUL, departsInMin: 150, gate: "D24", boardingLeadMin: 40 },
  { id: "f118", number: "HRB 118", from: AIRPORTS.YYZ, to: AIRPORTS.YVR, departsInMin: 210, gate: "E71", boardingLeadMin: 45 },
  { id: "f402", number: "HRB 402", from: AIRPORTS.YYZ, to: AIRPORTS.YHZ, departsInMin: 95, gate: "D31", boardingLeadMin: 40 },
  { id: "f650", number: "HRB 650", from: AIRPORTS.YYZ, to: AIRPORTS.YYC, departsInMin: 30, gate: "E64", boardingLeadMin: 45 },
];

export const BOOKINGS: BookingDef[] = [
  {
    code: "K7Q2TR",
    flightId: "f214",
    passengers: [
      { id: "p1", first: "Camille", last: "Tremblay", type: "adult", cabin: "economy" },
      { id: "p2", first: "Marc", last: "Tremblay", type: "adult", cabin: "economy" },
      { id: "p3", first: "Léa", last: "Tremblay", type: "child", cabin: "economy" },
    ],
  },
  {
    code: "N4VX8P",
    flightId: "f118",
    passengers: [{ id: "p1", first: "Linh", last: "Nguyen", type: "adult", cabin: "premium" }],
  },
  {
    code: "B9DL3M",
    flightId: "f402",
    passengers: [
      { id: "p1", first: "Ada", last: "Okafor", type: "adult", cabin: "economy", checkedIn: { seat: "21C" } },
      { id: "p2", first: "Tunde", last: "Okafor", type: "adult", cabin: "economy" },
    ],
  },
  {
    code: "R2HZ6W",
    flightId: "f650",
    passengers: [{ id: "p1", first: "Sam", last: "Martin", type: "adult", cabin: "economy" }],
  },
];

/** Shown on the find-booking screen so visitors can try every path. */
export const DEMO_HINTS: { code: string; last: string; note: "family" | "premium" | "partial" | "closed" }[] = [
  { code: "K7Q2TR", last: "Tremblay", note: "family" },
  { code: "N4VX8P", last: "Nguyen", note: "premium" },
  { code: "B9DL3M", last: "Okafor", note: "partial" },
  { code: "R2HZ6W", last: "Martin", note: "closed" },
];

/** Online and kiosk check-in close this long before departure. */
export const CHECKIN_CLOSES_MIN = 45;

export type Flight = Omit<FlightDef, "departsInMin"> & { departs: number; boards: number };
export type Booking = { code: string; flight: Flight; passengers: PassengerDef[] };

export type LookupResult =
  | { ok: true; booking: Booking }
  | { ok: false; reason: "not_found" | "closed" | "all_checked_in" };

/** Normalizes what people type: case, spaces, and accents ("Léa" matches "Lea"). */
export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z]/gi, "")
    .toUpperCase();
}

export function normalizeCode(s: string): string {
  return s.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

/** Check-ins this kiosk has already made, keyed by `${code}/${passengerId}`, valued by seat. */
export type CheckinLedger = Record<string, string>;

export const ledgerKey = (code: string, passengerId: string) => `${code}/${passengerId}`;

/**
 * Finds a booking by confirmation code and any passenger's last name. `now` is a timestamp in ms;
 * `anchor` fixes the sample departure times (pass the kiosk's start time so they don't drift).
 */
export function lookupBooking(
  code: string,
  lastName: string,
  { now, anchor = now, ledger = {} }: { now: number; anchor?: number; ledger?: CheckinLedger },
): LookupResult {
  const def = BOOKINGS.find((b) => b.code === normalizeCode(code));
  if (!def || !def.passengers.some((p) => normalizeName(p.last) === normalizeName(lastName))) {
    return { ok: false, reason: "not_found" };
  }
  const { departsInMin, ...f } = FLIGHTS.find((x) => x.id === def.flightId)!;
  const departs = anchor + departsInMin * 60_000;
  const flight: Flight = { ...f, departs, boards: departs - f.boardingLeadMin * 60_000 };
  if (departs - now <= CHECKIN_CLOSES_MIN * 60_000) return { ok: false, reason: "closed" };
  const passengers = def.passengers.map((p) => {
    const seat = ledger[ledgerKey(def.code, p.id)];
    return seat && !p.checkedIn ? { ...p, checkedIn: { seat } } : p;
  });
  if (passengers.every((p) => p.checkedIn)) return { ok: false, reason: "all_checked_in" };
  return { ok: true, booking: { code: def.code, flight, passengers } };
}
