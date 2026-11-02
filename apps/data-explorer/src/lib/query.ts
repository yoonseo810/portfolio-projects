import { type Dataset, dayToMonth, isoToDay } from "./dataset";
import type { Filters, SortKey } from "./filters";

export type Ranked = { key: string; minutes: number; count: number };

export type QueryResult = {
  /** Row indices that match every filter, in sort order. */
  rows: Int32Array;
  summary: {
    incidents: number;
    totalDelay: number;
    medianDelay: number;
    p90Delay: number;
  };
  /** Delay minutes per hour of day. Ignores the hour filter, so the chart can be used to pick one. */
  byHour: number[];
  /** Delay minutes per month, oldest first, with empty months filled in. */
  byMonth: { month: number; minutes: number }[];
  /** Stations with the most delay minutes. Ignores the station filter, for the same reason. */
  topStations: Ranked[];
  topCodes: Ranked[];
  tookMs: number;
};

type Predicates = {
  fromDay: number;
  toDay: number;
  lines: Set<number> | null;
  stations: Uint8Array | null;
  code: number;
  hour: number;
  minDelay: number;
};

function compile(ds: Dataset, f: Filters): Predicates {
  const lines = f.lines.length ? new Set(f.lines.map((l) => ds.dict.line.indexOf(l)).filter((i) => i >= 0)) : null;
  let stations: Uint8Array | null = null;
  if (f.station) {
    const needle = f.station.toLowerCase();
    stations = new Uint8Array(ds.dict.station.length);
    ds.dict.station.forEach((name, i) => {
      if (name.toLowerCase().includes(needle)) stations![i] = 1;
    });
  }
  return {
    fromDay: f.from ? (isoToDay(f.from) ?? -Infinity) : -Infinity,
    toDay: f.to ? (isoToDay(f.to) ?? Infinity) : Infinity,
    lines: lines && lines.size ? lines : lines ? new Set([-1]) : null,
    stations,
    // -2 never matches: an unknown code filters everything out instead of being ignored.
    code: f.code ? (ds.dict.code.indexOf(f.code) === -1 ? -2 : ds.dict.code.indexOf(f.code)) : -1,
    hour: f.hour ?? -1,
    minDelay: f.minDelay,
  };
}

const quantile = (sorted: Int32Array, q: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : 0);

function rank(minutes: Float64Array, counts: Uint32Array, names: string[], limit: number): Ranked[] {
  const out: Ranked[] = [];
  for (let i = 0; i < names.length; i++) if (counts[i]) out.push({ key: names[i], minutes: minutes[i], count: counts[i] });
  return out.sort((a, b) => b.minutes - a.minutes || b.count - a.count || a.key.localeCompare(b.key)).slice(0, limit);
}

/** One pass over the data for the table, the stats and every chart. Pure, so it runs the same in a worker or a test. */
export function runQuery(ds: Dataset, f: Filters, now: () => number = () => performance.now()): QueryResult {
  const start = now();
  const p = compile(ds, f);
  const { day, minute, station, line, code, delay } = ds.cols;

  const matches = new Int32Array(ds.size);
  let n = 0;
  const byHour = new Array<number>(24).fill(0);
  const months = new Map<number, number>();
  const stationMinutes = new Float64Array(ds.dict.station.length);
  const stationCounts = new Uint32Array(ds.dict.station.length);
  const codeMinutes = new Float64Array(ds.dict.code.length);
  const codeCounts = new Uint32Array(ds.dict.code.length);

  for (let i = 0; i < ds.size; i++) {
    const d = day[i];
    if (d < p.fromDay || d > p.toDay) continue;
    if (p.lines && !p.lines.has(line[i])) continue;
    if (p.code !== -1 && code[i] !== p.code) continue;
    if (delay[i] < p.minDelay) continue;
    const stationOk = !p.stations || p.stations[station[i]] === 1;
    const h = (minute[i] / 60) | 0;
    const hourOk = p.hour === -1 || h === p.hour;

    if (stationOk) byHour[h] += delay[i];
    if (hourOk) {
      stationMinutes[station[i]] += delay[i];
      stationCounts[station[i]]++;
    }
    if (!stationOk || !hourOk) continue;

    matches[n++] = i;
    const m = dayToMonth(d);
    months.set(m, (months.get(m) ?? 0) + delay[i]);
    codeMinutes[code[i]] += delay[i];
    codeCounts[code[i]]++;
  }

  const rows = sortRows(ds, matches.subarray(0, n), f.sort, f.dir === "asc" ? 1 : -1);

  const delays = new Int32Array(n);
  let totalDelay = 0;
  for (let j = 0; j < n; j++) {
    delays[j] = delay[rows[j]];
    totalDelay += delays[j];
  }
  delays.sort();

  const byMonth: QueryResult["byMonth"] = [];
  if (months.size) {
    const keys = [...months.keys()];
    const lo = Math.min(...keys);
    const hi = Math.max(...keys);
    for (let m = lo; m <= hi; m++) byMonth.push({ month: m, minutes: months.get(m) ?? 0 });
  }

  return {
    rows,
    summary: { incidents: n, totalDelay, medianDelay: quantile(delays, 0.5), p90Delay: quantile(delays, 0.9) },
    byHour,
    byMonth,
    topStations: rank(stationMinutes, stationCounts, ds.dict.station, 10),
    topCodes: rank(codeMinutes, codeCounts, ds.dict.code, 8),
    tookMs: now() - start,
  };
}

function sortRows(ds: Dataset, rows: Int32Array, key: SortKey, sign: 1 | -1): Int32Array {
  const c = ds.cols;
  // Sort dictionary indices by their label once, so string columns compare as integers.
  const order = (names: string[]) => {
    const rankOf = new Int32Array(names.length);
    names
      .map((name, i) => [name, i] as const)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([, i], r) => (rankOf[i] = r));
    return rankOf;
  };
  let primary: (i: number) => number;
  switch (key) {
    case "station": {
      const r = order(ds.dict.station);
      primary = (i) => r[c.station[i]];
      break;
    }
    case "line": {
      const r = order(ds.dict.line);
      primary = (i) => r[c.line[i]];
      break;
    }
    case "code": {
      const r = order(ds.dict.code);
      primary = (i) => r[c.code[i]];
      break;
    }
    case "delay":
      primary = (i) => c.delay[i];
      break;
    case "gap":
      primary = (i) => c.gap[i];
      break;
    default:
      primary = (i) => c.day[i] * 1440 + c.minute[i];
  }
  const out = Int32Array.from(rows);
  // Ties fall back to newest first, then row order, so the sort is stable and deterministic.
  out.sort((a, b) => sign * (primary(a) - primary(b)) || c.day[b] * 1440 + c.minute[b] - (c.day[a] * 1440 + c.minute[a]) || a - b);
  return out;
}
