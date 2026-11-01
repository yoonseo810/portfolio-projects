import "server-only";
import { and, count, desc, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/db";
import { analyses, jobs, resumes } from "@/db/schema";

// Every query is scoped by userId. The app connects as the database owner,
// so this filter is the access check; RLS additionally blocks the public data API.

export async function getLatestResume(userId: string) {
  const [row] = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.updatedAt))
    .limit(1);
  return row ?? null;
}

export async function listJobs(userId: string) {
  return db
    .select({
      id: jobs.id,
      title: jobs.title,
      company: jobs.company,
      status: jobs.status,
      createdAt: jobs.createdAt,
    })
    .from(jobs)
    .where(and(eq(jobs.userId, userId), isNull(jobs.deletedAt)))
    .orderBy(desc(jobs.createdAt));
}

export async function getJobWithAnalysis(userId: string, jobId: string) {
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.userId, userId), isNull(jobs.deletedAt)))
    .limit(1);
  if (!job) return null;
  const [analysis] = await db
    .select()
    .from(analyses)
    .where(eq(analyses.jobId, job.id))
    .orderBy(desc(analyses.createdAt))
    .limit(1);
  return { job, analysis: analysis ?? null };
}

export async function latestScores(userId: string) {
  const rows = await db
    .select({ jobId: analyses.jobId, score: analyses.score, createdAt: analyses.createdAt })
    .from(analyses)
    .innerJoin(jobs, eq(jobs.id, analyses.jobId))
    .where(and(eq(jobs.userId, userId), isNull(jobs.deletedAt)))
    .orderBy(desc(analyses.createdAt));
  const map = new Map<string, number>();
  for (const r of rows) if (!map.has(r.jobId)) map.set(r.jobId, r.score);
  return map;
}

/** Counts deleted jobs too, so removing a job doesn't free up quota. */
export async function analysesInLastDay(userId: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({ n: count() })
    .from(analyses)
    .innerJoin(jobs, eq(jobs.id, analyses.jobId))
    .where(and(eq(jobs.userId, userId), gte(analyses.createdAt, since)));
  return row?.n ?? 0;
}
