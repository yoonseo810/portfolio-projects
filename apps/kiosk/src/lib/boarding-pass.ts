import type { Cabin } from "./flights";

/**
 * Builds the barcode text in the fixed-width layout of the IATA bar-coded boarding pass (BCBP)
 * mandatory section: 60 characters, one leg, no optional fields.
 */
export type PassFields = {
  first: string;
  last: string;
  code: string;
  from: string;
  to: string;
  /** e.g. "HRB 214" */
  flight: string;
  departs: number;
  cabin: Cabin;
  seat: string;
  sequence: number;
};

const pad = (s: string, n: number) => s.slice(0, n).padEnd(n, " ");
const ascii = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();

/** Day of the year (1–366) in local time, as BCBP stores the flight date. */
export function dayOfYear(ms: number): number {
  const d = new Date(ms);
  return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86_400_000);
}

export function bcbp(p: PassFields): string {
  const [carrier, number] = p.flight.split(" ");
  const seatMatch = /^(\d+)([A-Z])$/.exec(p.seat);
  const seat = seatMatch ? seatMatch[1].padStart(3, "0") + seatMatch[2] : pad(p.seat, 4);
  return [
    "M1",
    pad(`${ascii(p.last)}/${ascii(p.first)}`, 20),
    "E",
    pad(p.code, 7),
    p.from,
    p.to,
    pad(carrier, 3),
    pad(number.padStart(4, "0"), 5),
    String(dayOfYear(p.departs)).padStart(3, "0"),
    p.cabin === "premium" ? "J" : "Y",
    seat,
    String(p.sequence).padStart(4, "0") + " ",
    "1",
    "00",
  ].join("");
}
