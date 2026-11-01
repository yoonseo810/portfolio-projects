import type { Meta, StoryObj } from "@storybook/react-vite";
import { Eyebrow } from "@repo/ui/eyebrow";
import { ExternalLink } from "@repo/ui/external-link";
import { SiteHeader } from "@repo/ui/site-header";
import { ThemeToggle } from "@repo/ui/theme";
import { expect } from "storybook/test";

const meta = {
  title: "Components/Navigation",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Header: Story = {
  render: () => (
    <SiteHeader brand="Job-Search Copilot">
      <a href="#dashboard" className="text-sm text-muted hover:text-fg">Dashboard</a>
    </SiteHeader>
  ),
};

/** Opens in a new tab with `rel="noopener noreferrer"` and tells screen-reader users it will. */
export const External: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <ExternalLink href="https://github.com/yoonseo810/portfolio-projects" className="text-accent underline underline-offset-4">
      Source on GitHub
    </ExternalLink>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "Source on GitHub (opens in a new tab)" });
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  },
};

export const EyebrowLabel: Story = {
  parameters: { layout: "padded" },
  render: () => <Eyebrow>Live demo</Eyebrow>,
};

/** Flips the `dark` class on `<html>`; its label always names the theme it switches to. */
export const Toggle: Story = {
  parameters: { layout: "padded" },
  render: () => <ThemeToggle />,
  play: async ({ canvas, userEvent }) => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    const button = canvas.getByRole("button", { name: wasDark ? "Switch to light theme" : "Switch to dark theme" });
    await userEvent.click(button);
    await expect(root.classList.contains("dark")).toBe(!wasDark);
    await expect(button).toHaveAccessibleName(wasDark ? "Switch to dark theme" : "Switch to light theme");
    await userEvent.click(button);
  },
};
