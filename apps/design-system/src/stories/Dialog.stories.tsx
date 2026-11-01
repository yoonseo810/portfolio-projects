import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Dialog } from "@repo/ui/dialog";
import { expect, screen, waitFor } from "storybook/test";

function DeleteDemo() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete application
      </Button>
      <p role="status" className="text-sm text-muted">{deleted ? "Deleted." : ""}</p>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete this application?"
        description="Frontend Engineer at Acme will be removed from your dashboard."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                setDeleted(true);
                setOpen(false);
              }}
            >
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  render: () => <DeleteDemo />,
  args: { open: false, onClose: () => {}, title: "" },
  parameters: { docs: { story: { inline: false, height: "320px" } } },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Native `<dialog>`: focus is trapped inside, Escape closes it, and focus returns to the button that opened it. */
export const FocusAndEscape: Story = {
  play: async ({ canvas, userEvent, step }) => {
    const trigger = canvas.getByRole("button", { name: "Delete application" });

    await step("Opens as a labelled modal and moves focus inside", async () => {
      await userEvent.click(trigger);
      const dialog = await screen.findByRole("dialog", { name: "Delete this application?" });
      await expect(dialog).toHaveAccessibleDescription(/removed from your dashboard/);
      await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    });

    await step("Escape closes it and focus goes back to the trigger", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await expect(trigger).toHaveFocus();
    });

    await step("Confirming runs the action", async () => {
      await userEvent.click(trigger);
      await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
      await expect(canvas.getByRole("status")).toHaveTextContent("Deleted.");
      await expect(trigger).toHaveFocus();
    });
  },
};
