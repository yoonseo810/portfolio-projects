/**
 * Compact, column-oriented encoding of TTC subway delay incidents.
 *
 * Strings that repeat (stations, lines, codes) are stored once in `dict` and referenced by index,
 * and each field is its own array. ~100k rows parse in a few milliseconds and fit in typed arrays,
 * so filtering and sorting stay fast without a server round trip.
 */
export type DatasetFile = {
  meta: DatasetMeta;
  dict: { station: string[]; line: string[]; code: string[]; bound: string[] };
  /** Delay code -> plain-English description (from the TTC's code list, when available). */
  codeDescriptions: Record<string, string>;
  cols: {
    /** Days since 1970-01-01 (UTC). */
    day: number[];
    /** Minutes after midnight, 0-1439. */
    minute: number[];
    station: number[];
    line: number[];
    code: number[];
    bound: number[];
    /** Minutes of delay. */
    delay: number[];
    /** Minutes of gap between trains. */
    gap: number[];
  };
};

export type DatasetMeta = {
  /** "sample" until the real export is committed, so the UI can say so. */
  source: "ttc" | "sample";
  title: string;
  attribution: string;
  licenseUrl: string;
  sourceUrl: string;
  generatedAt: string;
  rowCount: number;
};

export type Columns = {
  day: Int32Array;
  minute: Int16Array;
  station: Int32Array;
  line: Int16Array;
  code: Int16Array;
  bound: Int8Array;
  delay: Int32Array;
  gap: Int32Array;
};

export type Dataset = {
  meta: DatasetMeta;
  dict: DatasetFile["dict"];
  codeDescriptions: Record<string, string>;
  cols: Columns;
  size: number;
};

export function decode(file: DatasetFile): Dataset {
  const c = file.cols;
  const size = c.day.length;
  for (const [name, arr] of Object.entries(c)) {
    if (arr.length !== size) throw new Error(`Column "${name}" has ${arr.length} rows, expected ${size}`);
  }
  return {
    meta: file.meta,
    dict: file.dict,
    codeDescriptions: file.codeDescriptions,
    size,
    cols: {
      day: Int32Array.from(c.day),
      minute: Int16Array.from(c.minute),
      station: Int32Array.from(c.station),
      line: Int16Array.from(c.line),
      code: Int16Array.from(c.code),
      bound: Int8Array.from(c.bound),
      delay: Int32Array.from(c.delay),
      gap: Int32Array.from(c.gap),
    },
  };
}

const MS_PER_DAY = 86_400_000;

export const dayToIso = (day: number) => new Date(day * MS_PER_DAY).toISOString().slice(0, 10);

/** "2024-03-05" -> day number, or null when the string isn't a real calendar date. */
export function isoToDay(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const ms = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(ms) || dayToIso(ms / MS_PER_DAY) !== iso) return null;
  return ms / MS_PER_DAY;
}

/** Month index since 1970-01 (UTC), for grouping by month. */
export function dayToMonth(day: number) {
  const d = new Date(day * MS_PER_DAY);
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
}

export function monthLabel(month: number) {
  const y = Math.floor(month / 12);
  const m = month % 12;
  return new Date(Date.UTC(y, m, 1)).toLocaleDateString("en-CA", { month: "short", year: "numeric", timeZone: "UTC" });
}

export const minuteToTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
