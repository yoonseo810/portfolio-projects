"use server";

import { google } from "@ai-sdk/google";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { analyses, jobs, jobStatus, resumes } from "@/db/schema";
import { analyzeJob, MAX_INPUT_CHARS } from "@/lib/analyze";
import { requireUserId } from "@/lib/auth";
import { analysesInLastDay, getLatestResume } from "@/lib/data";
import { DAILY_ANALYSIS_LIMIT, GEMINI_MODEL } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean };

/** Starts an anonymous Supabase session so visitors can try the app without signing up. */
export async function startDemo(): Promise<FormState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("signInAnonymously failed", error);
      return { error: "Couldn't start a guest session right now. Please try again in a minute." };
    }
  }
  redirect("/dashboard");
}

const text = (label: string, min: number) =>
  z
    .string()
    .trim()
    .min(min, `${label} looks too short.`)
    .max(MAX_INPUT_CHARS, `${label} is over ${MAX_INPUT_CHARS.toLocaleString()} characters.`);

export async function saveResume(_: FormState, form: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = text("Resume", 100).safeParse(form.get("resume"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await getLatestResume(userId);
  if (existing) {
    await db.update(resumes).set({ content: parsed.data }).where(eq(resumes.id, existing.id));
  } else {
    await db.insert(resumes).values({ userId, title: "My resume", content: parsed.data });
  }
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function analyzePosting(_: FormState, form: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = text("Job posting", 200).safeParse(form.get("posting"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const resume = await getLatestResume(userId);
  if (!resume) return { error: "Save your resume first." };
  if ((await analysesInLastDay(userId)) >= DAILY_ANALYSIS_LIMIT) {
    return { error: `You've reached the demo limit of ${DAILY_ANALYSIS_LIMIT} analyses per day.` };
  }

  let jobId: string;
  try {
    const result = await analyzeJob({
      model: google(GEMINI_MODEL),
      posting: parsed.data,
      resume: resume.content,
    });
    jobId = await db.transaction(async (tx) => {
      const [job] = await tx
        .insert(jobs)
        .values({
          userId,
          title: result.job.title,
          company: result.job.company,
          posting: parsed.data,
          requirements: result.job,
        })
        .returning({ id: jobs.id });
      await tx.insert(analyses).values({
        jobId: job.id,
        resumeId: resume.id,
        score: result.score,
        matches: result.matches,
        tailoredBullets: result.tailoredBullets,
        model: GEMINI_MODEL,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        latencyMs: result.latencyMs,
      });
      return job.id;
    });
  } catch (err) {
    console.error("analyzePosting failed", err);
    return { error: "The analysis failed. Please try again in a minute." };
  }
  redirect(`/jobs/${jobId}`);
}

const statusSchema = z.enum(jobStatus.enumValues);

export async function updateStatus(jobId: string, form: FormData) {
  const userId = await requireUserId();
  const status = statusSchema.parse(form.get("status"));
  await db
    .update(jobs)
    .set({ status })
    .where(and(eq(jobs.id, jobId), eq(jobs.userId, userId)));
  revalidatePath("/dashboard");
  revalidatePath(`/jobs/${jobId}`);
}
