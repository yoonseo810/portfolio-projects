import { Badge, type BadgeTone } from "@repo/ui/badge";
import { Card } from "@repo/ui/card";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ScoreBadge } from "@/components/ScoreBadge";
import { StatusSelect } from "@/components/StatusSelect";
import { requireUserId } from "@/lib/auth";
import { getJobWithAnalysis } from "@/lib/data";
import { gaps } from "@/lib/score";

const verdictTone: Record<"strong" | "partial" | "missing", BadgeTone> = {
  strong: "success",
  partial: "warning",
  missing: "danger",
};

export default function JobPage({ params }: PageProps<"/jobs/[id]">) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/dashboard" className="text-sm text-muted transition-colors hover:text-fg">
        ← Dashboard
      </Link>
      <Suspense fallback={<p className="mt-8 text-muted">Loading…</p>}>
        <JobDetail params={params} />
      </Suspense>
    </main>
  );
}

function Panel({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <section aria-labelledby={id}>
        <h2 id={id} className="mb-4 text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {children}
      </section>
    </Card>
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
    <article className="mt-6 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-4 pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{job.title}</h1>
          <p className="mt-1 text-muted">{job.company}</p>
        </div>
        <StatusSelect jobId={job.id} status={job.status} />
      </header>

      {!analysis ? (
        <Card className="p-8 text-center text-muted">No analysis yet.</Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="flex items-center gap-5 p-6 md:col-span-2">
              <section aria-labelledby="score-title" className="contents">
                <ScoreBadge score={analysis.score} size="lg" />
                <div>
                  <h2 id="score-title" className="font-semibold tracking-tight">
                    Fit score
                  </h2>
                  <p className="mt-1 text-sm text-muted">Must-haves count 3×, nice-to-haves 1×, partial matches half.</p>
                </div>
              </section>
            </Card>
            <div className="md:col-span-3">
              <Panel id="gaps-title" title="Address first">
                {gaps(analysis.matches).length === 0 ? (
                  <p className="text-muted">No gaps found.</p>
                ) : (
                  <ol className="space-y-2">
                    {gaps(analysis.matches).map((g, i) => (
                      <li key={g.skill} className="flex items-center gap-3">
                        <span className="w-5 font-mono text-xs text-muted">{i + 1}.</span>
                        <span className="flex-1">{g.skill}</span>
                        <Badge tone={g.importance === "must" ? "danger" : "neutral"}>
                          {g.importance === "must" ? "required" : "nice to have"}, {g.verdict}
                        </Badge>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
            </div>
          </div>

          <Panel id="bullets-title" title="Tailored resume bullets">
            <ul className="space-y-3">
              {analysis.tailoredBullets.map((b) => (
                <li key={b} className="flex gap-3 leading-relaxed">
                  <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel id="req-title" title="Requirement by requirement">
            <div className="-mx-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="py-2 pl-6 pr-4 font-medium">Requirement</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                    <th className="py-2 pr-4 font-medium">Verdict</th>
                    <th className="py-2 pr-6 font-medium">Evidence from resume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {analysis.matches.map((m) => (
                    <tr key={m.skill} className="align-top">
                      <td className="py-3 pl-6 pr-4 font-medium">{m.skill}</td>
                      <td className="py-3 pr-4 text-muted">{m.importance === "must" ? "Required" : "Nice"}</td>
                      <td className="py-3 pr-4">
                        <Badge tone={verdictTone[m.verdict]}>{m.verdict}</Badge>
                      </td>
                      <td className="py-3 pr-6 text-muted">{m.evidence || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <p className="font-mono text-xs text-muted">
            {analysis.model} · {analysis.inputTokens.toLocaleString()} input +{" "}
            {analysis.outputTokens.toLocaleString()} output tokens · {(analysis.latencyMs / 1000).toFixed(1)}s
          </p>
        </>
      )}
    </article>
  );
}
