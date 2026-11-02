import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/site";

describe("safeNext", () => {
  it("keeps same-app paths", () => {
    expect(safeNext("/dashboard?tab=1")).toBe("/dashboard?tab=1");
  });

  it.each([null, "", "https://evil.example", "//evil.example", "/\\evil.example", "dashboard"])(
    "falls back to / for %s",
    (value) => {
      expect(safeNext(value)).toBe("/");
    },
  );
});
