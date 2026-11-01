import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { JobRequirements, RequirementMatch } from "@/lib/schemas";

/** Pipeline stage of a saved job, shown as columns on the tracker board. */
export const jobStatus = pgEnum("job_status", [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
};

/** `user_id` references Supabase's `auth.users.id`; row-level security keys off it. */
export const resumes = pgTable(
  "resumes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    ...timestamps,
  },
  (t) => [index("resumes_user_idx").on(t.userId)],
);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    company: text("company").notNull(),
    title: text("title").notNull(),
    url: text("url"),
    posting: text("posting").notNull(),
    requirements: jsonb("requirements").$type<JobRequirements>(),
    status: jobStatus("status").notNull().default("saved"),
    /**
     * Set when the user removes the job. Rows are kept (hidden everywhere) so
     * deleting can't be used to reset the daily analysis limit.
     */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("jobs_user_status_idx").on(t.userId, t.status)],
);

/**
 * One fit analysis of a resume against a job. Token counts and latency are
 * stored so the app can report real cost and speed, not guesses.
 */
export const analyses = pgTable(
  "analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    resumeId: uuid("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    matches: jsonb("matches").$type<RequirementMatch[]>().notNull(),
    tailoredBullets: jsonb("tailored_bullets").$type<string[]>().notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    latencyMs: integer("latency_ms").notNull(),
    costUsd: real("cost_usd"),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("analyses_job_idx").on(t.jobId)],
);
