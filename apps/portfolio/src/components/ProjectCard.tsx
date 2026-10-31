import { type Project, statusLabel } from "@/content/projects";

export function ProjectCard({ project }: { project: Project }) {
  const { name, tagline, stack, status, demoUrl, codeUrl } = project;
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-line p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold">{name}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            status === "live" ? "bg-accent/15 text-accent" : "bg-line text-muted"
          }`}
        >
          {statusLabel[status]}
        </span>
      </div>
      <p className="text-muted">{tagline}</p>
      <ul className="flex flex-wrap gap-2" aria-label="Tech stack">
        {stack.map((s) => (
          <li key={s} className="rounded bg-line/60 px-2 py-0.5 font-mono text-xs">
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex gap-4 pt-2 text-sm font-medium">
        {demoUrl && (
          <a href={demoUrl} className="text-accent underline-offset-4 hover:underline">
            Live demo{" "}<span className="sr-only">of {name}</span>
          </a>
        )}
        {codeUrl && status !== "planned" && (
          <a href={codeUrl} className="text-accent underline-offset-4 hover:underline">
            Code{" "}<span className="sr-only">for {name}</span>
          </a>
        )}
      </div>
    </article>
  );
}
