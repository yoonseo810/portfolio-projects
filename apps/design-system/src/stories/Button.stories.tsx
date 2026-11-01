import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, buttonClass } from "@repo/ui/button";
import { expect, fn } from "storybook/test";

const meta = {
  title: "Components/Button",
  component: Button,
  args: { children: "Analyze fit", onClick: fn() },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "ghost", "danger"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Analyze fit" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="primary">Primary</Button>
      <Button {...args} variant="secondary">Secondary</Button>
      <Button {...args} variant="ghost">Ghost</Button>
      <Button {...args} variant="danger">Delete</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} size="sm">Small</Button>
      <Button {...args} size="md">Medium</Button>
      <Button {...args} size="lg">Large</Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, children: "Saving…" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Saving…" })).toBeDisabled();
  },
};

/** `buttonClass()` gives links (or anything else) the button look without a wrapper. */
export const AsLink: Story = {
  render: () => (
    <a href="#start" className={buttonClass({ variant: "secondary" })}>
      Try the live demo
    </a>
  ),
};
