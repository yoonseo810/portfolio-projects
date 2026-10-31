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
      "Parses job postings into structured requirements, scores fit against a resume and drafts tailored bullets, with an eval suite to measure quality.",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Supabase", "Drizzle", "Vercel AI SDK"],
    status: "planned",
    codeUrl: `${repo}/job-copilot`,
  },
  {
    slug: "realtime-board",
    name: "Real-Time Collaborative Board",
    tagline:
      "Multi-user board with live cursors, presence, optimistic updates and offline-tolerant sync.",
    stack: ["Next.js", "TypeScript", "Supabase Realtime", "dnd-kit"],
    status: "planned",
    codeUrl: `${repo}/realtime-board`,
  },
  {
    slug: "portfolio",
    name: "This portfolio",
    tagline:
      "Server-rendered Next.js site with typed content, dark mode, accessible navigation and CI on every pull request.",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Vitest"],
    status: "live",
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
