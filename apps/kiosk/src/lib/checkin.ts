import type { Booking, LookupResult, PassengerDef } from "./flights";
import { autoAssign, getSeat, seatBlock } from "./seats";

/**
 * The check-in flow as a pure reducer, so every rule (who can sit where, when you can move on,
 * what a reset clears) is unit-tested without rendering anything.
 */
export type Step = "welcome" | "find" | "passengers" | "seats" | "bags" | "review" | "done";

/** The steps shown in the progress bar. */
export const PROGRESS: Step[] = ["find", "passengers", "seats", "bags", "review"];

export const MAX_BAGS = 2;

export type LookupFailure = Extract<LookupResult, { ok: false }>["reason"];

export type CheckinRecord = {
  /** Made on the kiosk, so a retried upload can never create a second check-in. */
  id: string;
  code: string;
  flightId: string;
  createdAt: number;
  passengers: { id: string; first: string; last: string; seat: string; bags: number }[];
};

export type State = {
  step: Step;
  booking: Booking | null;
  /** Passengers being checked in now, in booking order. */
  selected: string[];
  seats: Record<string, string>;
  bags: Record<string, number>;
  lookupError: LookupFailure | null;
  record: CheckinRecord | null;
};

export const initialState: State = {
  step: "welcome",
  booking: null,
  selected: [],
  seats: {},
  bags: {},
  lookupError: null,
  record: null,
};

export type Action =
  | { type: "start" }
  | { type: "lookup"; result: LookupResult; taken: ReadonlySet<string> }
  | { type: "toggle"; passengerId: string }
  | { type: "seat"; passengerId: string; seat: string; taken: ReadonlySet<string> }
  | { type: "bags"; passengerId: string; count: number }
  | { type: "next"; taken: ReadonlySet<string> }
  | { type: "back" }
  | { type: "confirmed"; record: CheckinRecord }
  | { type: "reset" };

export const eligible = (b: Booking | null): PassengerDef[] => b?.passengers.filter((p) => !p.checkedIn) ?? [];

const passenger = (s: State, id: string) => s.booking?.passengers.find((p) => p.id === id);

export function canAdvance(s: State): boolean {
  switch (s.step) {
    case "passengers":
      return s.selected.length > 0;
    case "seats":
      return s.selected.every((id) => s.seats[id]);
    case "bags":
    case "review":
      return true;
    default:
      return false;
  }
}

/** Gives every selected passenger without a seat one next to the group if possible. */
function fillSeats(s: State, taken: ReadonlySet<string>): Record<string, string> {
  const seats = Object.fromEntries(Object.entries(s.seats).filter(([id]) => s.selected.includes(id)));
  const missing = s.selected.map((id) => passenger(s, id)!).filter((p) => !seats[p.id]);
  if (!missing.length) return seats;
  const held = new Set([...taken, ...Object.values(seats)]);
  return { ...seats, ...autoAssign(missing, held) };
}

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "start":
      return { ...initialState, step: "find" };

    case "lookup": {
      if (!a.result.ok) return { ...s, lookupError: a.result.reason };
      const booking = a.result.booking;
      const people = eligible(booking);
      const next: State = {
        ...s,
        booking,
        lookupError: null,
        selected: people.map((p) => p.id),
        bags: Object.fromEntries(people.map((p) => [p.id, 0])),
        seats: {},
      };
      // One traveller has nobody to choose, so go straight to seats.
      if (people.length === 1) return { ...next, step: "seats", seats: fillSeats(next, a.taken) };
      return { ...next, step: "passengers" };
    }

    case "toggle": {
      const p = passenger(s, a.passengerId);
      if (!p || p.checkedIn) return s;
      const on = s.selected.includes(p.id);
      const order = s.booking!.passengers.map((x) => x.id);
      const selected = on ? s.selected.filter((id) => id !== p.id) : order.filter((id) => id === p.id || s.selected.includes(id));
      return { ...s, selected };
    }

    case "seat": {
      const p = passenger(s, a.passengerId);
      const seat = getSeat(a.seat);
      if (!p || !seat || !s.selected.includes(p.id)) return s;
      // Seats held by this group aren't "taken" for the group; picking one swaps.
      const ours = new Set(Object.values(s.seats));
      const othersTaken = new Set([...a.taken].filter((id) => !ours.has(id)));
      if (seatBlock(seat, p, othersTaken)) return s;
      const seats = { ...s.seats, [p.id]: seat.id };
      const holder = Object.keys(s.seats).find((id) => id !== p.id && s.seats[id] === seat.id);
      if (holder) {
        const prev = s.seats[p.id] && getSeat(s.seats[p.id]);
        const q = passenger(s, holder)!;
        if (prev && !seatBlock(prev, q, othersTaken)) seats[holder] = prev.id;
        else delete seats[holder];
      }
      return { ...s, seats };
    }

    case "bags": {
      if (!s.selected.includes(a.passengerId)) return s;
      const count = Math.max(0, Math.min(MAX_BAGS, Math.round(a.count)));
      return { ...s, bags: { ...s.bags, [a.passengerId]: count } };
    }

    case "next": {
      if (!canAdvance(s)) return s;
      if (s.step === "passengers") return { ...s, step: "seats", seats: fillSeats(s, a.taken) };
      if (s.step === "seats") return { ...s, step: "bags" };
      if (s.step === "bags") return { ...s, step: "review" };
      return s;
    }

    case "back": {
      const single = eligible(s.booking).length === 1;
      const prev: Partial<Record<Step, Step>> = {
        find: "welcome",
        passengers: "find",
        seats: single ? "find" : "passengers",
        bags: "seats",
        review: "bags",
      };
      const step = prev[s.step];
      if (!step) return s;
      return step === "find" || step === "welcome" ? { ...initialState, step } : { ...s, step };
    }

    case "confirmed":
      return s.step === "review" ? { ...s, step: "done", record: a.record } : s;

    case "reset":
      return initialState;
  }
}

/** The check-in to save, once the traveller confirms the review screen. */
export function makeRecord(s: State, id: string, now: number): CheckinRecord {
  const b = s.booking!;
  return {
    id,
    code: b.code,
    flightId: b.flight.id,
    createdAt: now,
    passengers: s.selected.map((pid) => {
      const p = passenger(s, pid)!;
      return { id: p.id, first: p.first, last: p.last, seat: s.seats[pid], bags: s.bags[pid] ?? 0 };
    }),
  };
}
