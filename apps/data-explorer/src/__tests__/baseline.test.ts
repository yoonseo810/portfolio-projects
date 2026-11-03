import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runQueryNaive, toRows } from "@/lib/baseline";
import { type DatasetFile, decode } from "@/lib/dataset";
import { DEFAULT_FILTERS, type Filters } from "@/lib/filters";
import { runQuery } from "@/lib/query";

// The case study compares these two engines, so they must agree on the real data, not just a fixture.
const ds = decode(JSON.parse(readFileSync(join(__dirname, "../../public/data/subway-delays.json"), "utf8")) as DatasetFile);
const rows = toRows(ds);

const cases: Partial<Filters>[] = [
  {},
  { lines: ["BD"], hour: 8 },
  { station: "union", sort: "delay", dir: "desc" },
  { from: "2025-06-01", to: "2025-08-31", minDelay: 5, sort: "station", dir: "asc" },
  { code: "SUDP", sort: "code", dir: "asc" },
  { lines: ["YU", "SHP"], sort: "gap", dir: "asc" },
  { code: "NOPE" },
];

describe("runQueryNaive", () => {
  it.each(cases)("matches runQuery for %j", (over) => {
    const f = { ...DEFAULT_FILTERS, ...over };
    // tookMs is 0 for both, since the clock is stubbed.
    expect(runQueryNaive(rows, f, () => 0)).toEqual(runQuery(ds, f, () => 0));
  });
});
