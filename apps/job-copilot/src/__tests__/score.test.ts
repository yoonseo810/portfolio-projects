import { describe, expect, it } from "vitest";
import { jobRequirementsSchema, type RequirementMatch } from "@/lib/schemas";
import { fitScore, gaps } from "@/lib/score";

const m = (
  skill: string,
  importance: "must" | "nice",
  verdict: "strong" | "partial" | "missing",
): RequirementMatch => ({ skill, importance, verdict, evidence: "" });

describe("fitScore", () => {
  it("is 0 with no requirements", () => {
    expect(fitScore([])).toBe(0);
  });

  it("weights must-haves three times nice-to-haves", () => {
    // possible = 3 + 1 = 4; earned = 3 (strong must) + 0 (missing nice) = 3
    expect(fitScore([m("React", "must", "strong"), m("GraphQL", "nice", "missing")])).toBe(75);
  });

  it("gives half credit for partial matches", () => {
    expect(fitScore([m("Node", "must", "partial")])).toBe(50);
  });

  it("is 100 when everything is strong", () => {
    expect(fitScore([m("a", "must", "strong"), m("b", "nice", "strong")])).toBe(100);
  });
});

describe("gaps", () => {
  it("orders missing musts, then partial musts, then missing nice-to-haves, and drops the rest", () => {
    const result = gaps([
      m("nice-missing", "nice", "missing"),
      m("must-partial", "must", "partial"),
      m("must-strong", "must", "strong"),
      m("nice-partial", "nice", "partial"),
      m("must-missing", "must", "missing"),
    ]);
    expect(result.map((r) => r.skill)).toEqual(["must-missing", "must-partial", "nice-missing"]);
  });
});

describe("jobRequirementsSchema", () => {
  it("rejects an extraction with no requirements", () => {
    const r = jobRequirementsSchema.safeParse({
      title: "Dev",
      company: "Acme",
      seniority: "intermediate",
      requirements: [],
    });
    expect(r.success).toBe(false);
  });

  it("rejects an unknown importance level", () => {
    const r = jobRequirementsSchema.safeParse({
      title: "Dev",
      company: "Acme",
      seniority: "intermediate",
      requirements: [{ skill: "React", importance: "critical" }],
    });
    expect(r.success).toBe(false);
  });
});
