import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@repo/ui/badge";
import { Card } from "@repo/ui/card";

const meta = {
  title: "Components/Card",
  component: Card,
  args: { interactive: false },
  render: (args) => (
    <Card {...args} className="max-w-sm p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold tracking-tight">Realtime Board</h3>
        <Badge tone="success" dot>Live</Badge>
      </div>
      <p className="mt-2 text-sm text-muted">Shared kanban with live cursors, presence and conflict-free drag and drop.</p>
    </Card>
  ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Adds a glow on hover, for cards that link somewhere. */
export const Interactive: Story = { args: { interactive: true } };
