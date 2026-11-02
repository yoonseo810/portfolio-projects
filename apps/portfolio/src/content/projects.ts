export type ProjectStatus = "live" | "in-progress" | "planned";

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  stack: string[];
  status: ProjectStatus;
  demoUrl?: string;
  codeUrl?: string;
};

const repo = "https://github.com/yoonseo810/portfolio-projects/tree/main/apps";

export const projects: Project[] = [
  {
    slug: "job-copilot",
    name: "AI Job-Search Copilot",
    tagline:
      "Paste a job posting to get a fit score, ranked gaps and tailored resume bullets. Gemini judges each requirement with quoted evidence; the score is computed in code so it stays explainable.",
    stack: ["Next.js 16", "TypeScript", "Supabase", "PostgreSQL", "Drizzle", "Vercel AI SDK", "Gemini"],
    status: "live",
    demoUrl: "/copilot",
    codeUrl: `${repo}/job-copilot`,
  },
  {
    slug: "realtime-board",
    name: "Real-Time Collaborative Board",
    tagline:
      "Shareable kanban board with live cursors, presence and accessible drag and drop. Optimistic updates sync over Supabase Realtime, and a tested last-write-wins reducer keeps everyone's board consistent.",
    stack: ["Next.js 16", "TypeScript", "Supabase Realtime", "PostgreSQL", "Drizzle", "dnd-kit"],
    status: "live",
    demoUrl: "/board",
    codeUrl: `${repo}/realtime-board`,
  },
  {
    slug: "design-system",
    name: "Design System",
    tagline:
      "The shared UI library behind every app here, documented in Storybook. Each story runs as a browser test with axe in both themes, and keyboard tests cover accessible tabs and dialogs.",
    stack: ["React", "TypeScript", "Tailwind CSS", "Storybook", "Vitest", "axe", "Playwright"],
    status: "live",
    demoUrl: "https://portfolio-projects-gtds.vercel.app",
    codeUrl: `${repo}/design-system`,
  },
  {
    slug: "portfolio",
    name: "This portfolio",
    tagline:
      "Server-rendered Next.js site with typed content, dark mode, accessible navigation and CI on every pull request.",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Vitest"],
    status: "live",
    demoUrl: "https://portfolio-projects-wine.vercel.app",
    codeUrl: `${repo}/portfolio`,
  },
];

const order: Record<ProjectStatus, number> = { live: 0, "in-progress": 1, planned: 2 };

/** Live projects first, then in-progress, then planned; stable within a group. */
export function sortProjects(list: Project[]): Project[] {
  return list
    .map((p, i) => ({ p, i }))
    .sort((a, b) => order[a.p.status] - order[b.p.status] || a.i - b.i)
    .map(({ p }) => p);
}

export const statusLabel: Record<ProjectStatus, string> = {
  live: "Live",
  "in-progress": "In progress",
  planned: "Coming soon",
};
