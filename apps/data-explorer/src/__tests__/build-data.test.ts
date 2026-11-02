import { describe, expect, it } from "vitest";
import { normalizeLine, parseCsv } from "../../scripts/build-data.mjs";

describe("build-data", () => {
  it("folds the export's free-text Line values into current lines", () => {
    expect(["YU", "YUS", " bd ", "SHP"].map(normalizeLine)).toEqual(["YU", "YU", "BD", "SHP"]);
    expect(["YU/BD", "YU / BD", "BD/YUS", "YU/BD/SHP"].map(normalizeLine)).toEqual(["MULTI", "MULTI", "MULTI", "MULTI"]);
    expect(["YUS/YU", "", "SRT", "999"].map(normalizeLine)).toEqual(["YU", "OTHER", "OTHER", "OTHER"]);
  });

  it("parses quoted CSV fields with commas, quotes and CRLF", () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi"""\r\n')).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"'],
    ]);
  });
});
