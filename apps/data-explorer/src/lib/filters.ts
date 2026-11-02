import { isoToDay } from "./dataset";

export type SortKey = "date" | "station" | "line" | "code" | "delay" | "gap";
export type SortDir = "asc" | "desc";

/** Everything that scopes the view. Lives in the URL, so a view can be shared or bookmarked. */
export type Filters = {
  from: string | null;
  to: string | null;
  lines: string[];
  station: string | null;
  code: string | null;
  /** Hour of day, 0-23, picked from the hour chart. */
  hour: number | null;
  /** Only incidents with at least this many minutes of delay. */
  minDelay: number;
  sort: SortKey;
  dir: SortDir;
};

export const DEFAULT_FILTERS: Filters = {
  from: null,
  to: null,
  lines: [],
  station: null,
  code: null,
  hour: null,
  minDelay: 0,
  sort: "date",
  dir: "desc",
};

const SORT_KEYS: SortKey[] = ["date", "station", "line", "code", "delay", "gap"];

/** Reads filters from URL params, dropping anything malformed instead of throwing. */
export function parseFilters(params: URLSearchParams): Filters {
  const date = (key: string) => {
    const v = params.get(key);
    return v && isoToDay(v) !== null ? v : null;
  };
  const text = (key: string) => {
    const v = params.get(key)?.trim();
    return v ? v.slice(0, 80) : null;
  };
  const int = (key: string, min: number, max: number) => {
    const raw = params.get(key);
    if (raw === null || !/^\d+$/.test(raw)) return null;
    const n = Number(raw);
    return n >= min && n <= max ? n : null;
  };
  const [sortKey, sortDir] = (params.get("sort") ?? "").split(":");
  const sort = SORT_KEYS.includes(sortKey as SortKey) ? (sortKey as SortKey) : DEFAULT_FILTERS.sort;
  const dir: SortDir = sortDir === "asc" || sortDir === "desc" ? sortDir : DEFAULT_FILTERS.dir;

  let from = date("from");
  let to = date("to");
  if (from && to && from > to) [from, to] = [to, from];

  return {
    from,
    to,
    lines: (params.get("line") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10),
    station: text("station"),
    code: text("code"),
    hour: int("hour", 0, 23),
    minDelay: int("min", 0, 1000) ?? 0,
    sort,
    dir,
  };
}

/** Writes only non-default values, so the default view has a clean URL. */
export function serializeFilters(f: Filters): string {
  const p = new URLSearchParams();
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.lines.length) p.set("line", f.lines.join(","));
  if (f.station) p.set("station", f.station);
  if (f.code) p.set("code", f.code);
  if (f.hour !== null) p.set("hour", String(f.hour));
  if (f.minDelay > 0) p.set("min", String(f.minDelay));
  if (f.sort !== DEFAULT_FILTERS.sort || f.dir !== DEFAULT_FILTERS.dir) p.set("sort", `${f.sort}:${f.dir}`);
  return p.toString();
}

export const activeFilterCount = (f: Filters) =>
  [f.from, f.to, f.station, f.code].filter(Boolean).length + (f.lines.length ? 1 : 0) + (f.hour !== null ? 1 : 0) + (f.minDelay > 0 ? 1 : 0);
