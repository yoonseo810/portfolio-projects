import { describe, expect, it } from "vitest";
import { type DatasetFile, decode, isoToDay } from "@/lib/dataset";
import { DEFAULT_FILTERS, type Filters } from "@/lib/filters";
import { runQuery } from "@/lib/query";

const day = (iso: string) => isoToDay(iso)!;

// Five incidents across two lines, three stations and two months.
const file: DatasetFile = {
  meta: { source: "sample", title: "t", attribution: "", licenseUrl: "", sourceUrl: "", generatedAt: "", rowCount: 5 },
  dict: { station: ["UNION STATION", "KIPLING STATION", "UNION STATION TO KING"], line: ["YU", "BD"], code: ["MUSC", "PUOPO"], bound: ["N", "S"] },
  codeDescriptions: {},
  cols: {
    day: [day("2024-01-05"), day("2024-01-20"), day("2024-03-02"), day("2024-03-02"), day("2024-03-10")],
    minute: [8 * 60, 8 * 60 + 30, 17 * 60, 17 * 60 + 5, 23 * 60 + 59],
    station: [0, 1, 2, 0, 1],
    line: [0, 1, 0, 0, 1],
    code: [0, 1, 1, 0, 0],
    bound: [0, 1, 0, 1, 0],
    delay: [4, 10, 6, 0, 20],
    gap: [8, 14, 10, 0, 24],
  },
};
const ds = decode(file);
const q = (over: Partial<Filters> = {}) => runQuery(ds, { ...DEFAULT_FILTERS, ...over }, () => 0);

describe("runQuery", () => {
  it("returns every row newest first by default, with summary stats", () => {
    const r = q();
    expect([...r.rows]).toEqual([4, 3, 2, 1, 0]);
    expect(r.summary).toEqual({ incidents: 5, totalDelay: 40, medianDelay: 6, p90Delay: 20 });
  });

  it("filters by inclusive date range, line, code and minimum delay", () => {
    expect([...q({ from: "2024-01-20", to: "2024-03-02" }).rows]).toEqual([3, 2, 1]);
    expect([...q({ lines: ["BD"] }).rows]).toEqual([4, 1]);
    expect([...q({ code: "PUOPO" }).rows]).toEqual([2, 1]);
    expect([...q({ minDelay: 6 }).rows]).toEqual([4, 2, 1]);
  });

  it("matches stations by case-insensitive substring", () => {
    expect([...q({ station: "union" }).rows]).toEqual([3, 2, 0]);
  });

  it("matches nothing for an unknown line or code instead of ignoring the filter", () => {
    expect(q({ lines: ["XX"] }).rows.length).toBe(0);
    expect(q({ code: "NOPE" }).rows.length).toBe(0);
  });

  it("keeps the hour chart unfiltered by hour, and the station ranking unfiltered by station", () => {
    const r = q({ hour: 8, station: "kipling" });
    expect([...r.rows]).toEqual([1]);
    // byHour honours the station filter (Kipling only) but not the hour filter.
    expect(r.byHour[8]).toBe(10);
    expect(r.byHour[23]).toBe(20);
    // Station ranking honours the hour filter (08:xx only) but not the station filter.
    expect(r.topStations.map((s) => s.key)).toEqual(["KIPLING STATION", "UNION STATION"]);
  });

  it("fills empty months so the trend line has no gaps", () => {
    expect(q().byMonth.map((m) => m.minutes)).toEqual([14, 0, 26]);
  });

  it("sorts by any column in either direction, breaking ties newest first", () => {
    expect([...q({ sort: "delay", dir: "desc" }).rows]).toEqual([4, 1, 2, 0, 3]);
    expect([...q({ sort: "station", dir: "asc" }).rows]).toEqual([4, 1, 3, 0, 2]);
  });

  it("ranks delay codes by total minutes", () => {
    expect(q().topCodes).toEqual([
      { key: "MUSC", minutes: 24, count: 3 },
      { key: "PUOPO", minutes: 16, count: 2 },
    ]);
  });
});
