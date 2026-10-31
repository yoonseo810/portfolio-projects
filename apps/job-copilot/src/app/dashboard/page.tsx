import Link from "next/link";
import { Suspense } from "react";
import { analyzePosting, saveResume } from "@/app/actions";
import { ScoreBadge } from "@/components/ScoreBadge";
import { StatusSelect } from "@/components/StatusSelect";
import { TextForm } from "@/components/TextForm";
import { requireUserId } from "@/lib/auth";
import { getLatestResume, latestScores, listJobs } from "@/lib/data";
import { SAMPLE_POSTING, SAMPLE_RESUME } from "@/lib/samples";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Suspense fallback={<p className="mt-8 text-zinc-500">Loading…</p>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  const userId = await requireUserId();
  const [resume, jobList, scores] = await Promise.all([
    getLatestResume(userId),
    listJobs(userId),
    latestScores(userId),
  ]);

  return (
    <div className="mt-8 space-y-12">
      <section aria-labelledby="new-title" className="space-y-8">
        <h2 id="new-title" className="sr-only">
          New analysis
        </h2>
        <TextForm
          action={saveResume}
          name="resume"
          label="1. Your resume (plain text)"
          defaultValue={resume?.content}
          sample={SAMPLE_RESUME}
          submitLabel={resume ? "Update resume" : "Save resume"}
          pendingLabel="Saving…"
          savedLabel="Saved."
          rows={8}
        />
        <TextForm
          action={analyzePosting}
          name="posting"
          label="2. Job posting"
          sample={SAMPLE_POSTING}
          submitLabel="Analyze fit"
          pendingLabel="Analyzing, about 10 seconds…"
          rows={10}
        />
      </section>

      <section aria-labelledby="jobs-title">
        <h2 id="jobs-title" className="mb-4 text-lg font-semibold">
          Applications
        </h2>
        {jobList.length === 0 ? (
          <p className="text-zinc-500">No jobs analyzed yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {jobList.map((j) => (
              <li key={j.id} className="flex items-center gap-4 p-4">
                {scores.has(j.id) && <ScoreBadge score={scores.get(j.id)!} />}
                <Link href={`/jobs/${j.id}`} className="min-w-0 flex-1 hover:underline">
                  <span className="block truncate font-medium">{j.title}</span>
                  <span className="block truncate text-sm text-zinc-500">{j.company}</span>
                </Link>
                <StatusSelect jobId={j.id} status={j.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
