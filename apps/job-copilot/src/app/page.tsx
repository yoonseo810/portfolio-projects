const steps = [
  { title: "Paste a job posting", body: "The model extracts each requirement and whether it's a must-have or a nice-to-have." },
  { title: "Score your fit", body: "Each requirement is checked against your resume for evidence. The 0-100 score is computed from those verdicts in code, so it's explainable." },
  { title: "Close the gaps", body: "Get tailored resume bullets for the requirements you match, and a ranked list of the ones you don't." },
  { title: "Track the pipeline", body: "Move applications from saved to offer on a board." },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <p className="font-mono text-sm text-teal-700 dark:text-teal-400">Work in progress</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Job-Search Copilot</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Turn a job posting into a fit score, a gap list and tailored resume bullets.
      </p>
      <ol className="mt-10 space-y-6">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-300 font-mono text-sm dark:border-zinc-700">
              {i + 1}
            </span>
            <div>
              <h2 className="font-semibold">{s.title}</h2>
              <p className="text-zinc-600 dark:text-zinc-400">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
