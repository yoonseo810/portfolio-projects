import { Backdrop } from "@repo/ui/backdrop";
import { buttonClass } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { cn } from "@repo/ui/cn";
import { Eyebrow } from "@repo/ui/eyebrow";
import { SiteHeader } from "@repo/ui/site-header";
import { ProjectCard } from "@/components/ProjectCard";
import { experience, profile, skills } from "@/content/profile";
import { projects, sortProjects } from "@/content/projects";

const nav = [
  { href: "#projects", label: "Projects" },
  { href: "#experience", label: "Experience" },
  { href: "#skills", label: "Skills" },
  { href: "#contact", label: "Contact" },
];

const stats = [
  { value: "3 yrs", label: "Production React + TypeScript" },
  { value: String(projects.filter((p) => p.status === "live").length), label: "Live apps in this monorepo" },
  { value: "IATA · CUSS", label: "Regulated airport software" },
];

function Section({ id, title, kicker, children }: { id: string; title: string; kicker: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 py-14">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{kicker}</p>
      <h2 id={`${id}-title`} className="mb-8 mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Home() {
  const list = sortProjects(projects);
  return (
    <>
      <SiteHeader brand="Michael Seo" href="#">
        <nav aria-label="Primary">
          <ul className="hidden gap-1 text-sm sm:flex">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="rounded-md px-3 py-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-fg">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </SiteHeader>

      <main id="main" className="mx-auto max-w-5xl px-4 sm:px-6">
        <section className="relative isolate pb-12 pt-20 sm:pt-28">
          <Backdrop />
          <Eyebrow>Open to front-end and full-stack roles · Toronto or remote</Eyebrow>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.05]">
            <span className="text-gradient">{profile.name}</span>
          </h1>
          <p className="mt-3 font-mono text-sm text-muted">{profile.role}</p>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{profile.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#projects" className={buttonClass({ size: "lg" })}>
              See projects
            </a>
            <a href={profile.github} className={buttonClass({ variant: "secondary", size: "lg" })}>
              GitHub
            </a>
            {profile.linkedin && (
              <a href={profile.linkedin} className={buttonClass({ variant: "secondary", size: "lg" })}>
                LinkedIn
              </a>
            )}
            <a href={`mailto:${profile.email}`} className={buttonClass({ variant: "ghost", size: "lg" })}>
              Email
            </a>
          </div>

          <dl className="mt-14 grid gap-3 sm:grid-cols-3">
            {stats.map((s) => (
              <Card key={s.label} className="px-5 py-4">
                <dt className="text-sm text-muted">{s.label}</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-tight">{s.value}</dd>
              </Card>
            ))}
          </dl>
        </section>

        <Section id="projects" kicker="Selected work" title="Projects">
          <div className="grid gap-4 sm:grid-cols-2">
            {list.map((p, i) => (
              <ProjectCard
                key={p.slug}
                project={p}
                className={cn(list.length % 2 === 1 && i === list.length - 1 && "sm:col-span-2")}
              />
            ))}
          </div>
        </Section>

        <Section id="experience" kicker="Where I've worked" title="Experience">
          <ol className="relative space-y-6 border-l border-line pl-6">
            {experience.map((e) => (
              <li key={e.company} className="relative">
                <span aria-hidden className="absolute -left-[1.85rem] top-6 h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_0_4px_var(--bg),0_0_12px_var(--accent)]" />
                <Card className="p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-semibold tracking-tight">
                      {e.title} · <span className="text-accent">{e.company}</span>
                    </h3>
                    <p className="font-mono text-xs text-muted">{e.period}</p>
                  </div>
                  <ul className="mt-4 space-y-2 text-muted">
                    {e.highlights.map((h) => (
                      <li key={h} className="flex gap-3">
                        <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-muted" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="skills" kicker="Toolbox" title="Skills">
          <dl className="grid gap-4 sm:grid-cols-2">
            {skills.map((s) => (
              <Card key={s.group} className="p-6">
                <dt className="font-semibold">{s.group}</dt>
                <dd className="mt-3 flex flex-wrap gap-1.5">
                  {s.items.map((i) => (
                    <span key={i} className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-sm text-muted">
                      {i}
                    </span>
                  ))}
                </dd>
              </Card>
            ))}
          </dl>
        </Section>

        <Section id="contact" kicker="Say hello" title="Contact">
          <Card className="relative isolate overflow-hidden p-8 sm:p-10">
            <Backdrop className="opacity-70" />
            <p className="max-w-xl text-lg text-muted">
              I&apos;m looking for intermediate front-end or full-stack roles in the Toronto area or remote. The fastest
              way to reach me is email.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`mailto:${profile.email}`} className={buttonClass({ size: "lg" })}>
                {profile.email}
              </a>
              {profile.linkedin && (
                <a href={profile.linkedin} className={buttonClass({ variant: "secondary", size: "lg" })}>
                  LinkedIn
                </a>
              )}
            </div>
          </Card>
        </Section>
      </main>

      <footer className="mx-auto max-w-5xl border-t border-line px-4 py-8 text-sm text-muted sm:px-6">
        Built with Next.js, Tailwind CSS and a shared design system.{" "}
        <a href="https://github.com/yoonseo810/portfolio-projects" className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-accent">
          Source on GitHub
        </a>
        .
      </footer>
    </>
  );
}
