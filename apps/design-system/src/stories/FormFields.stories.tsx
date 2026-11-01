import type { Meta, StoryObj } from "@storybook/react-vite";
import { SelectField, TextAreaField, TextField } from "@repo/ui/form-field";
import { expect } from "storybook/test";

/**
 * Labelled form controls. Each wires its label, hint and error to the control
 * (`htmlFor`, `aria-describedby`, `aria-invalid`), so forms are accessible by default.
 */
const meta = {
  title: "Forms/Form fields",
  component: TextField,
  args: { label: "Company", placeholder: "Acme Inc." },
  decorators: [(Story) => <div className="max-w-sm">{Story()}</div>],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText("Company");
    await userEvent.type(input, "Shopify");
    await expect(input).toHaveValue("Shopify");
  },
};

export const WithHint: Story = {
  args: { label: "Job posting URL", type: "url", hint: "Optional. We only store the link.", placeholder: "https://" },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Job posting URL")).toHaveAccessibleDescription("Optional. We only store the link.");
  },
};

export const WithError: Story = {
  args: { label: "Email", type: "email", required: true, defaultValue: "michael@", error: "Enter a full email address." },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: /Email/ });
    await expect(input).toBeInvalid();
    await expect(input).toBeRequired();
    await expect(input).toHaveAccessibleDescription("Enter a full email address.");
  },
};

export const Disabled: Story = { args: { label: "Workspace", defaultValue: "portfolio-projects", disabled: true } };

export const TextArea: Story = {
  render: () => <TextAreaField label="Resume" hint="Plain text works best." rows={5} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Resume" })).toHaveAccessibleDescription("Plain text works best.");
  },
};

export const Select: Story = {
  render: () => (
    <SelectField
      label="Application status"
      defaultValue="applied"
      options={[
        { value: "saved", label: "Saved" },
        { value: "applied", label: "Applied" },
        { value: "interviewing", label: "Interviewing" },
        { value: "offer", label: "Offer" },
      ]}
    />
  ),
  play: async ({ canvas, userEvent }) => {
    const select = canvas.getByRole("combobox", { name: "Application status" });
    await userEvent.selectOptions(select, "interviewing");
    await expect(select).toHaveValue("interviewing");
  },
};
