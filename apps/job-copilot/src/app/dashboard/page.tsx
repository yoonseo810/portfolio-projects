import { Card } from "@repo/ui/card";
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
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-muted">Save your resume once, then analyze as many postings as you like.</p>
      <Suspense fallback={<p className="mt-8 text-muted">Loading…</p>}>
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
      <section aria-labelledby="new-title" className="grid gap-4 lg:grid-cols-2">
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
        <h2 id="jobs-title" className="mb-4 text-lg font-semibold tracking-tight">
          Applications
        </h2>
        {jobList.length === 0 ? (
          <Card className="p-8 text-center text-muted">No jobs analyzed yet. Paste a posting above to get your first score.</Card>
        ) : (
          <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {jobList.map((j) => (
              <li key={j.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2">
                {scores.has(j.id) && <ScoreBadge score={scores.get(j.id)!} />}
                <Link href={`/jobs/${j.id}`} className="min-w-0 flex-1 hover:text-accent">
                  <span className="block truncate font-medium">{j.title}</span>
                  <span className="block truncate text-sm text-muted">{j.company}</span>
                </Link>
                <StatusSelect jobId={j.id} status={j.status} />
              </li>
            ))}
          </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
