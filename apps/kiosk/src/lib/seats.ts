import type { Cabin, PassengerDef } from "./flights";

/** An A320-style layout: premium rows are 2-2, economy rows are 3-3. */
export const PREMIUM_ROWS = [1, 2, 3, 4];
export const ECONOMY_ROWS = Array.from({ length: 20 }, (_, i) => i + 10); // 10–29
export const EXIT_ROWS = new Set([14, 15]);
export const PREMIUM_LETTERS = ["A", "C", "D", "F"] as const;
export const ECONOMY_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

export type SeatKind = "window" | "middle" | "aisle";

export type Seat = {
  id: string;
  row: number;
  letter: string;
  cabin: Cabin;
  kind: SeatKind;
  exit: boolean;
  /** Left side of the aisle (A–C), used to keep groups together. */
  side: "left" | "right";
};

export function seatKind(cabin: Cabin, letter: string): SeatKind {
  if (letter === "A" || letter === "F") return "window";
  if (cabin === "premium") return "aisle";
  return letter === "B" || letter === "E" ? "middle" : "aisle";
}

export function buildSeats(): Seat[] {
  const make = (cabin: Cabin, rows: number[], letters: readonly string[]) =>
    rows.flatMap((row) =>
      letters.map((letter) => ({
        id: `${row}${letter}`,
        row,
        letter,
        cabin,
        kind: seatKind(cabin, letter),
        exit: EXIT_ROWS.has(row),
        side: (letter <= "C" ? "left" : "right") as Seat["side"],
      })),
    );
  return [...make("premium", PREMIUM_ROWS, PREMIUM_LETTERS), ...make("economy", ECONOMY_ROWS, ECONOMY_LETTERS)];
}

export const SEATS = buildSeats();
const SEAT_BY_ID = new Map(SEATS.map((s) => [s.id, s]));
export const getSeat = (id: string) => SEAT_BY_ID.get(id);

/** Small deterministic PRNG so every kiosk sees the same "sold" seats for a flight. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Seats sold to other travellers on this flight (a bit under half the cabin). */
export function soldSeats(flightId: string, share = 0.45): Set<string> {
  const rand = mulberry32(hash(flightId));
  return new Set(SEATS.filter(() => rand() < share).map((s) => s.id));
}

export type SeatBlock = "taken" | "cabin" | "child_exit";

/** Why a passenger can't take a seat, or null if they can. */
export function seatBlock(seat: Seat, passenger: PassengerDef, taken: ReadonlySet<string>): SeatBlock | null {
  if (taken.has(seat.id)) return "taken";
  if (seat.cabin !== passenger.cabin) return "cabin";
  if (seat.exit && passenger.type === "child") return "child_exit";
  return null;
}

/**
 * Picks seats for a group: side by side in one row if possible (avoiding exit rows, since children
 * can't sit there and adults have to agree to it), otherwise the earliest open seats.
 */
export function autoAssign(passengers: PassengerDef[], taken: ReadonlySet<string>): Record<string, string> {
  const out: Record<string, string> = {};
  const used = new Set(taken);
  const byCabin = new Map<Cabin, PassengerDef[]>();
  for (const p of passengers) byCabin.set(p.cabin, [...(byCabin.get(p.cabin) ?? []), p]);

  for (const [cabin, group] of byCabin) {
    const free = SEATS.filter((s) => s.cabin === cabin && !s.exit && !used.has(s.id));
    const rows = [...new Set(free.map((s) => s.row))];
    let block: Seat[] | undefined;
    for (const row of rows) {
      for (const side of ["left", "right"] as const) {
        const run = free.filter((s) => s.row === row && s.side === side);
        block = adjacentRun(run, group.length, cabin);
        if (block) break;
      }
      if (block) break;
    }
    const chosen = block ?? free.slice(0, group.length);
    group.forEach((p, i) => {
      if (chosen[i]) {
        out[p.id] = chosen[i].id;
        used.add(chosen[i].id);
      }
    });
  }
  return out;
}

/** The first `n` side-by-side seats in `run` (one row, one side), if there are that many. */
function adjacentRun(run: Seat[], n: number, cabin: Cabin): Seat[] | undefined {
  const letters: readonly string[] = cabin === "premium" ? PREMIUM_LETTERS : ECONOMY_LETTERS;
  for (let i = 0; i + n <= run.length; i++) {
    const window = run.slice(i, i + n);
    const idx = window.map((s) => letters.indexOf(s.letter));
    if (idx.every((v, j) => j === 0 || v === idx[j - 1] + 1)) return window;
  }
  return undefined;
}
