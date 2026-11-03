import type { PortalApp } from "./account-menu";

/**
 * Every app under the portfolio umbrella. Copilot and Board are zones served from the portfolio
 * domain, so they share one sign-in. Storybook is public documentation and needs no account.
 */
export const PORTAL_APPS: PortalApp[] = [
  { label: "Portfolio", href: "/", description: "Projects, experience and contact" },
  { label: "Job-Search Copilot", href: "/copilot", description: "Score your fit for a job posting" },
  { label: "Realtime Board", href: "/board", description: "Shareable kanban with live cursors" },
  { label: "TTC Delay Explorer", href: "/explorer", description: "Filter and chart Toronto subway delays" },
  { label: "Kiosk Check-in", href: "/kiosk", description: "Touch-first airline check-in" },
  { label: "Design System", href: "https://portfolio-projects-gtds.vercel.app", description: "Storybook for the shared UI" },
];
