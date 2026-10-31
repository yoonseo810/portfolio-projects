import { Backdrop } from "@repo/ui/backdrop";
import { Card } from "@repo/ui/card";
import { Eyebrow } from "@repo/ui/eyebrow";
import { StartDemo } from "@/components/StartDemo";

const steps = [
  { title: "Paste a job posting", body: "The model extracts each requirement and whether it's a must-have or a nice-to-have." },
  { title: "Score your fit", body: "Each requirement is checked against your resume for evidence. The 0-100 score is computed from those verdicts in code, so it's explainable." },
  { title: "Close the gaps", body: "Get tailored resume bullets for the requirements you match, and a ranked list of the ones you don't." },
  { title: "Track the pipeline", body: "Move each application from saved to offer." },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6">
      <section className="relative isolate pb-12 pt-20 text-center sm:pt-28">
        <Backdrop />
        <Eyebrow>AI-powered · Gemini + Vercel AI SDK</Eyebrow>
        <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.05]">
          <span className="text-gradient">Know your fit before you apply.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted">
          Turn a job posting into a fit score, a gap list and tailored resume bullets.
        </p>
        <StartDemo />
      </section>
      <ol className="grid gap-4 pb-16 sm:grid-cols-2">
        {steps.map((s, i) => (
          <li key={s.title}>
            <Card interactive className="h-full p-6">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 font-mono text-sm text-accent">
                {i + 1}
              </span>
              <h2 className="mt-4 font-semibold tracking-tight">{s.title}</h2>
              <p className="mt-1.5 leading-relaxed text-muted">{s.body}</p>
            </Card>
          </li>
        ))}
      </ol>
    </main>
  );
}
