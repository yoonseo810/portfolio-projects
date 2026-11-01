import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@repo/ui/badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  args: { children: "Live", tone: "success", dot: true },
  argTypes: { tone: { control: "inline-radio", options: ["neutral", "accent", "success", "warning", "danger"] } },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Neutral</Badge>
      <Badge tone="accent">Accent</Badge>
      <Badge tone="success" dot>Strong match</Badge>
      <Badge tone="warning" dot>Partial</Badge>
      <Badge tone="danger" dot>Missing</Badge>
    </div>
  ),
};
