import type { RequirementMatch } from "./schemas";

/**
 * Fit score from 0-100, computed in code from the model's per-requirement
 * verdicts rather than asked of the model directly. This keeps the number
 * explainable and stable: the same verdicts always give the same score.
 */
export const WEIGHTS = { must: 3, nice: 1 } as const;
export const CREDIT = { strong: 1, partial: 0.5, missing: 0 } as const;

export function fitScore(matches: RequirementMatch[]): number {
  if (matches.length === 0) return 0;
  let earned = 0;
  let possible = 0;
  for (const m of matches) {
    const w = WEIGHTS[m.importance];
    possible += w;
    earned += w * CREDIT[m.verdict];
  }
  return Math.round((earned / possible) * 100);
}

/** Requirements the candidate should address first: missing musts, then partial musts, then missing nice-to-haves. */
export function gaps(matches: RequirementMatch[]): RequirementMatch[] {
  const rank = (m: RequirementMatch) =>
    m.importance === "must" ? (m.verdict === "missing" ? 0 : 1) : 2;
  return matches
    .filter((m) => m.verdict !== "strong" && !(m.importance === "nice" && m.verdict === "partial"))
    .sort((a, b) => rank(a) - rank(b));
}
