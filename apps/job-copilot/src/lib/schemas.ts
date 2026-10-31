import { z } from "zod";

/** What the model extracts from a raw job posting. */
export const requirementSchema = z.object({
  skill: z.string().min(1).describe("A single skill, tool or qualification, e.g. 'React' or '3+ years front-end'"),
  importance: z.enum(["must", "nice"]).describe("'must' if the posting requires it, 'nice' if preferred or a bonus"),
});

export const jobRequirementsSchema = z.object({
  title: z.string(),
  company: z.string(),
  seniority: z.enum(["junior", "intermediate", "senior", "staff", "unknown"]),
  requirements: z.array(requirementSchema).min(1).max(30),
});

/** The model's judgment of whether a resume shows evidence for one requirement. */
export const requirementMatchSchema = requirementSchema.extend({
  verdict: z.enum(["strong", "partial", "missing"]),
  evidence: z
    .string()
    .describe("Quote or close paraphrase from the resume supporting the verdict; empty when missing"),
});

export type Requirement = z.infer<typeof requirementSchema>;
export type JobRequirements = z.infer<typeof jobRequirementsSchema>;
export type RequirementMatch = z.infer<typeof requirementMatchSchema>;
