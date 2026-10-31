import { ProjectCard } from "@/components/ProjectCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { experience, profile, skills } from "@/content/profile";
import { projects, sortProjects } from "@/content/projects";

const nav = [
  { href: "#projects", label: "Projects" },
  { href: "#experience", label: "Experience" },
  { href: "#skills", label: "Skills" },
  { href: "#contact", label: "Contact" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 py-12">
      <h2 id={`${id}-title`} className="mb-6 text-sm font-semibold uppercase tracking-widest text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <a href="#" className="font-semibold">
            Michael Seo
          </a>
          <nav aria-label="Primary" className="flex items-center gap-4">
            <ul className="hidden gap-4 text-sm text-muted sm:flex">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="hover:text-fg">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-4">
        <section className="py-16 sm:py-24">
          <p className="font-mono text-sm text-accent">{profile.role}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{profile.name}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{profile.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
            <a href="#projects" className="rounded-md bg-fg px-4 py-2 text-bg hover:opacity-90">
              See projects
            </a>
            <a href={profile.github} className="rounded-md border border-line px-4 py-2 hover:border-fg">
              GitHub
            </a>
            <a href={`mailto:${profile.email}`} className="rounded-md border border-line px-4 py-2 hover:border-fg">
              Email
            </a>
          </div>
        </section>

        <Section id="projects" title="Projects">
          <div className="grid gap-4 sm:grid-cols-2">
            {sortProjects(projects).map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </Section>

        <Section id="experience" title="Experience">
          <ol className="space-y-10">
            {experience.map((e) => (
              <li key={e.company}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold">
                    {e.title} · <span className="text-accent">{e.company}</span>
                  </h3>
                  <p className="font-mono text-sm text-muted">{e.period}</p>
                </div>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
                  {e.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="skills" title="Skills">
          <dl className="grid gap-6 sm:grid-cols-2">
            {skills.map((s) => (
              <div key={s.group}>
                <dt className="font-semibold">{s.group}</dt>
                <dd className="mt-1 text-muted">{s.items.join(" · ")}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="contact" title="Contact">
          <p className="max-w-xl text-muted">
            I&apos;m looking for intermediate front-end or full-stack roles in the Toronto area or remote. The fastest
            way to reach me is{" "}
            <a href={`mailto:${profile.email}`} className="text-accent underline underline-offset-4">
              {profile.email}
            </a>
            .
          </p>
        </Section>
      </main>

      <footer className="mx-auto max-w-3xl border-t border-line px-4 py-8 text-sm text-muted">
        Built with Next.js and Tailwind CSS.{" "}
        <a href="https://github.com/yoonseo810/portfolio-projects" className="underline underline-offset-4">
          Source on GitHub
        </a>
        .
      </footer>
    </>
  );
}
