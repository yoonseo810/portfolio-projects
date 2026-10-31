import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProjectCard } from "@/components/ProjectCard";
import { type Project, sortProjects } from "@/content/projects";

const base: Omit<Project, "slug" | "status"> = { name: "X", tagline: "t", stack: ["TS"] };

describe("sortProjects", () => {
  it("puts live first, then in-progress, then planned, keeping original order within a group", () => {
    const list: Project[] = [
      { ...base, slug: "a", status: "planned" },
      { ...base, slug: "b", status: "live" },
      { ...base, slug: "c", status: "in-progress" },
      { ...base, slug: "d", status: "live" },
    ];
    expect(sortProjects(list).map((p) => p.slug)).toEqual(["b", "d", "c", "a"]);
  });
});

describe("ProjectCard", () => {
  it("shows demo and code links for a live project with accessible names", () => {
    render(
      <ProjectCard
        project={{ ...base, name: "Board", slug: "b", status: "live", demoUrl: "https://d", codeUrl: "https://c" }}
      />,
    );
    expect(screen.getByRole("link", { name: "Live demo of Board" })).toHaveAttribute("href", "https://d");
    expect(screen.getByRole("link", { name: "Code for Board" })).toHaveAttribute("href", "https://c");
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("hides the code link and labels a planned project as coming soon", () => {
    render(<ProjectCard project={{ ...base, slug: "p", status: "planned", codeUrl: "https://c" }} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });
});
