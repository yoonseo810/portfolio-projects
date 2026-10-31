import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ScoreBadge } from "@/components/ScoreBadge";
import { StatusSelect } from "@/components/StatusSelect";
import { requireUserId } from "@/lib/auth";
import { getJobWithAnalysis } from "@/lib/data";
import { gaps } from "@/lib/score";

const verdictStyle = {
  strong: "text-teal-700 dark:text-teal-400",
  partial: "text-amber-700 dark:text-amber-400",
  missing: "text-rose-700 dark:text-rose-400",
} as const;

export default function JobPage({ params }: PageProps<"/jobs/[id]">) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
        ← Dashboard
      </Link>
      <Suspense fallback={<p className="mt-8 text-zinc-500">Loading…</p>}>
        <JobDetail params={params} />
      </Suspense>
    </main>
  );
}

async function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getJobWithAnalysis(userId, id);
  if (!data) notFound();
  const { job, analysis } = data;

  return (
    <article className="mt-6 space-y-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-zinc-500">{job.company}</p>
        </div>
        <StatusSelect jobId={job.id} status={job.status} />
      </header>

      {!analysis ? (
        <p>No analysis yet.</p>
      ) : (
        <>
          <section aria-labelledby="score-title" className="flex items-center gap-4">
            <ScoreBadge score={analysis.score} size="lg" />
            <div>
              <h2 id="score-title" className="font-semibold">
                Fit score
              </h2>
              <p className="text-sm text-zinc-500">
                Must-haves count 3×, nice-to-haves 1×, partial matches half.
              </p>
            </div>
          </section>

          <section aria-labelledby="gaps-title">
            <h2 id="gaps-title" className="mb-3 text-lg font-semibold">
              Address first
            </h2>
            {gaps(analysis.matches).length === 0 ? (
              <p className="text-zinc-500">No gaps found.</p>
            ) : (
              <ol className="list-decimal space-y-1 pl-5">
                {gaps(analysis.matches).map((g) => (
                  <li key={g.skill}>
                    {g.skill}{" "}
                    <span className="text-sm text-zinc-500">
                      ({g.importance === "must" ? "required" : "nice to have"}, {g.verdict})
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="bullets-title">
            <h2 id="bullets-title" className="mb-3 text-lg font-semibold">
              Tailored resume bullets
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              {analysis.tailoredBullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="req-title">
            <h2 id="req-title" className="mb-3 text-lg font-semibold">
              Requirement by requirement
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Requirement</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                    <th className="py-2 pr-4 font-medium">Verdict</th>
                    <th className="py-2 font-medium">Evidence from resume</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.matches.map((m) => (
                    <tr key={m.skill} className="border-b border-zinc-100 align-top dark:border-zinc-900">
                      <td className="py-2 pr-4">{m.skill}</td>
                      <td className="py-2 pr-4">{m.importance === "must" ? "Required" : "Nice"}</td>
                      <td className={`py-2 pr-4 font-medium ${verdictStyle[m.verdict]}`}>{m.verdict}</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">{m.evidence || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="text-xs text-zinc-500">
            {analysis.model} · {analysis.inputTokens.toLocaleString()} input +{" "}
            {analysis.outputTokens.toLocaleString()} output tokens · {(analysis.latencyMs / 1000).toFixed(1)}s
          </p>
        </>
      )}
    </article>
  );
}
