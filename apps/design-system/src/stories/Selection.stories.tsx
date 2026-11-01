import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "@repo/ui/checkbox";
import { Switch } from "@repo/ui/switch";
import { expect, fn } from "storybook/test";

const meta = { title: "Forms/Checkbox and Switch" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Native checkbox: use it for choices submitted with a form. */
export const CheckboxDefault: Story = {
  name: "Checkbox",
  render: () => (
    <div className="space-y-4">
      <Checkbox label="Email me new matches" description="At most one email a week." />
      <Checkbox label="Remember this device" defaultChecked />
      <Checkbox label="Share anonymously (coming soon)" disabled />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const box = canvas.getByRole("checkbox", { name: "Email me new matches" });
    await expect(box).toHaveAccessibleDescription("At most one email a week.");
    await userEvent.click(canvas.getByText("Email me new matches"));
    await expect(box).toBeChecked();
    await userEvent.keyboard(" ");
    await expect(box).not.toBeChecked();
  },
};

/** Switch: for settings that take effect immediately. */
export const SwitchDefault: Story = {
  name: "Switch",
  args: {},
  render: () => <Switch label="Live cursors" defaultChecked onCheckedChange={fn()} />,
  play: async ({ canvas, userEvent }) => {
    const sw = canvas.getByRole("switch", { name: "Live cursors" });
    await expect(sw).toBeChecked();
    sw.focus();
    await userEvent.keyboard("{Enter}");
    await expect(sw).not.toBeChecked();
    await userEvent.keyboard(" ");
    await expect(sw).toBeChecked();
  },
};

export const SwitchDisabled: Story = {
  name: "Switch (disabled)",
  render: () => <Switch label="Sync to calendar" disabled />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("switch", { name: "Sync to calendar" })).toBeDisabled();
  },
};
