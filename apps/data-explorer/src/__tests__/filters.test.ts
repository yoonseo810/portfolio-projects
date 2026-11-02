import { describe, expect, it } from "vitest";
import { activeFilterCount, DEFAULT_FILTERS, parseFilters, serializeFilters } from "@/lib/filters";

const parse = (qs: string) => parseFilters(new URLSearchParams(qs));

describe("URL filters", () => {
  it("round-trips a full view", () => {
    const qs = "from=2024-01-01&to=2024-06-30&line=YU%2CBD&station=union&code=MUSC&hour=8&min=5&sort=delay%3Aasc";
    const f = parse(qs);
    expect(f).toEqual({
      from: "2024-01-01",
      to: "2024-06-30",
      lines: ["YU", "BD"],
      station: "union",
      code: "MUSC",
      hour: 8,
      minDelay: 5,
      sort: "delay",
      dir: "asc",
    });
    expect(serializeFilters(f)).toBe(qs);
    expect(activeFilterCount(f)).toBe(7);
  });

  it("writes nothing for the default view", () => {
    expect(serializeFilters(DEFAULT_FILTERS)).toBe("");
    expect(parse("")).toEqual(DEFAULT_FILTERS);
  });

  it("drops malformed values instead of throwing", () => {
    expect(parse("from=2024-02-30&to=yesterday&hour=24&min=-3&sort=evil:sideways")).toEqual(DEFAULT_FILTERS);
  });

  it("swaps a reversed date range", () => {
    const f = parse("from=2024-12-31&to=2024-01-01");
    expect([f.from, f.to]).toEqual(["2024-01-01", "2024-12-31"]);
  });
});
