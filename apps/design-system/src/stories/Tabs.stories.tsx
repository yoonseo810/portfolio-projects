import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs } from "@repo/ui/tabs";
import { expect, fn } from "storybook/test";

const items = [
  { id: "overview", label: "Overview", content: <p className="text-sm text-muted">Fit score, top gaps and next steps.</p> },
  { id: "matches", label: "Matches", content: <p className="text-sm text-muted">Each requirement with quoted evidence.</p> },
  { id: "bullets", label: "Bullets", content: <p className="text-sm text-muted">Tailored resume bullets to copy.</p> },
];

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  args: { items, label: "Analysis sections", onValueChange: fn() },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Follows the WAI-ARIA tabs pattern: arrows move and select, Home/End jump, and Tab goes into the panel. */
export const KeyboardNavigation: Story = {
  play: async ({ args, canvas, userEvent, step }) => {
    const tab = (name: string) => canvas.getByRole("tab", { name });

    await step("Only the selected tab is in the tab order", async () => {
      await userEvent.tab();
      await expect(tab("Overview")).toHaveFocus();
      await expect(tab("Matches")).toHaveAttribute("tabindex", "-1");
    });

    await step("Arrow keys move focus and selection, wrapping at the ends", async () => {
      await userEvent.keyboard("{ArrowRight}");
      await expect(tab("Matches")).toHaveFocus();
      await expect(tab("Matches")).toHaveAttribute("aria-selected", "true");
      await expect(canvas.getByRole("tabpanel")).toHaveTextContent("quoted evidence");
      await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
      await expect(tab("Bullets")).toHaveFocus();
    });

    await step("Home and End jump to the first and last tab", async () => {
      await userEvent.keyboard("{Home}");
      await expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
      await userEvent.keyboard("{End}");
      await expect(tab("Bullets")).toHaveAttribute("aria-selected", "true");
      await expect(args.onValueChange).toHaveBeenLastCalledWith("bullets");
    });

    await step("Tab moves into the active panel", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("tabpanel")).toHaveFocus();
    });
  },
};
