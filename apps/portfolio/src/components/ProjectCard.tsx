import { Badge } from "@repo/ui/badge";
import { Card } from "@repo/ui/card";
import { cn } from "@repo/ui/cn";
import { ExternalLink } from "@repo/ui/external-link";
import { type Project, statusLabel } from "@/content/projects";

function Arrow() {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function ProjectCard({ project, className }: { project: Project; className?: string }) {
  const { name, tagline, stack, status, demoUrl, codeUrl } = project;
  return (
    <Card interactive className={cn("flex flex-col gap-4 p-6", className)}>
      <article className="contents">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight">{name}</h3>
          <Badge tone={status === "live" ? "success" : "neutral"} dot={status === "live"} className="shrink-0">
            {statusLabel[status]}
          </Badge>
        </div>
        <p className="leading-relaxed text-muted">{tagline}</p>
        <ul className="flex flex-wrap gap-1.5" aria-label="Tech stack">
          {stack.map((s) => (
            <li key={s} className="rounded-md border border-line bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-muted">
              {s}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex gap-5 pt-2 text-sm font-medium">
          {demoUrl && (
            <ExternalLink href={demoUrl} className="group/link inline-flex items-center gap-1 text-accent hover:text-fg">
              Live demo{" "}<span className="sr-only">of {name}</span>
              <Arrow />
            </ExternalLink>
          )}
          {codeUrl && status !== "planned" && (
            <ExternalLink href={codeUrl} className="group/link inline-flex items-center gap-1 text-muted hover:text-fg">
              Code{" "}<span className="sr-only">for {name}</span>
              <Arrow />
            </ExternalLink>
          )}
        </div>
      </article>
    </Card>
  );
}
