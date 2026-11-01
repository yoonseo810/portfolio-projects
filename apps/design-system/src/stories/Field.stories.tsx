import type { Meta, StoryObj } from "@storybook/react-vite";
import { fieldClass } from "@repo/ui/field";
import { expect } from "storybook/test";

/**
 * `fieldClass()` styles native inputs, textareas and selects, so forms keep
 * native behavior (autofill, validation, mobile keyboards) with the shared look.
 */
const meta = {
  title: "Components/Field",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextInput: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-1.5">
      <label htmlFor="company" className="text-sm font-medium">Company</label>
      <input id="company" placeholder="Acme Inc." className={fieldClass()} />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText("Company");
    await userEvent.type(input, "Shopify");
    await expect(input).toHaveValue("Shopify");
  },
};

export const Textarea: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-1.5">
      <label htmlFor="posting" className="text-sm font-medium">Job posting</label>
      <textarea id="posting" rows={5} className={fieldClass("font-mono leading-relaxed")} />
    </div>
  ),
};

export const Select: Story = {
  render: () => (
    <div className="flex max-w-xs flex-col gap-1.5">
      <label htmlFor="status" className="text-sm font-medium">Application status</label>
      <select id="status" defaultValue="applied" className={fieldClass()}>
        <option value="saved">Saved</option>
        <option value="applied">Applied</option>
        <option value="interviewing">Interviewing</option>
      </select>
    </div>
  ),
};

/** Set `aria-invalid` and point `aria-describedby` at the message: the border turns red and screen readers read the error. */
export const Invalid: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-1.5">
      <label htmlFor="resume" className="text-sm font-medium">Resume</label>
      <input id="resume" aria-invalid="true" aria-describedby="resume-error" defaultValue="Too short" className={fieldClass()} />
      <p id="resume-error" className="text-sm text-danger">Resume looks too short.</p>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Resume")).toHaveAccessibleDescription("Resume looks too short.");
  },
};
