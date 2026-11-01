import type { Meta, StoryObj } from "@storybook/react-vite";
import { Accordion } from "@repo/ui/accordion";
import { Avatar } from "@repo/ui/avatar";
import { Tooltip } from "@repo/ui/tooltip";
import { expect, waitFor } from "storybook/test";

const meta = { title: "Display/Accordion, Avatar and Tooltip" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const faq = [
  { id: "score", title: "How is the fit score calculated?", content: "Must-haves count 3×, nice-to-haves 1×, and partial matches count half." },
  { id: "data", title: "What happens to my resume?", content: "It's stored in your guest session only and never used for training." },
  { id: "limit", title: "Is there a usage limit?", content: "Ten analyses per day while the demo runs on a free model tier." },
];

/** Native `<details>`: Enter/Space toggle, and a shared `name` keeps one item open at a time. */
export const AccordionExclusive: Story = {
  name: "Accordion",
  render: () => <Accordion items={faq} name="faq" defaultOpen="score" className="max-w-xl" />,
  play: async ({ canvasElement, canvas, userEvent }) => {
    const details = canvasElement.querySelectorAll("details");
    await expect(details[0]).toHaveAttribute("open");
    await userEvent.click(canvas.getByText("What happens to my resume?"));
    await waitFor(() => expect(details[1]).toHaveAttribute("open"));
    await expect(details[0]).not.toHaveAttribute("open");
  },
};

export const Avatars: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar name="Yoon Seong Seo" size="sm" />
      <Avatar name="Ada Lovelace" />
      <Avatar name="Grace Hopper" size="lg" />
      <Avatar name="Broken Image" src="/does-not-exist.png" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Yoon Seong Seo" })).toHaveTextContent("YS");
    await waitFor(() => expect(canvas.getByRole("img", { name: "Broken Image" })).toHaveTextContent("BI"));
  },
};

/** Shows on hover and keyboard focus, describes its trigger, and Escape hides it. */
export const TooltipOnFocus: Story = {
  name: "Tooltip",
  render: () => (
    <div className="pt-12">
      <Tooltip content="Must-haves count 3×">
        <button type="button" className="rounded-md border border-line-strong px-3 py-1.5 text-sm">
          How scoring works
        </button>
      </Tooltip>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "How scoring works" });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await expect(canvas.getByRole("tooltip")).toBeVisible();
    await expect(trigger).toHaveAccessibleDescription("Must-haves count 3×");
    await userEvent.keyboard("{Escape}");
    await expect(canvas.queryByRole("tooltip")).toBeNull();
  },
};
