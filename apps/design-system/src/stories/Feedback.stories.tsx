import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import { Spinner } from "@repo/ui/spinner";
import { ToastProvider, useToast } from "@repo/ui/toast";
import { expect, screen, waitFor } from "storybook/test";

const meta = { title: "Feedback/Alert, Toast and loading" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Alerts: Story = {
  render: () => (
    <div className="max-w-xl space-y-3">
      <Alert title="Analysis uses your latest resume">Update it on the dashboard to re-score future postings.</Alert>
      <Alert tone="success" title="Resume saved" />
      <Alert tone="warning" title="3 of 10 analyses left today">The demo limit resets every 24 hours.</Alert>
      <Alert tone="danger" title="The analysis failed" action={<Button size="sm" variant="secondary">Retry</Button>}>
        The model didn't respond. Your posting wasn't saved.
      </Alert>
    </div>
  ),
};

/** `live` alerts announce themselves: danger as `role="alert"`, the rest as `role="status"`. */
export const LiveAlert: Story = {
  render: () => <Alert live tone="danger" title="Couldn't save">Check your connection and try again.</Alert>,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent("Couldn't save");
  },
};

function ToastDemo() {
  const toast = useToast();
  return (
    <div className="flex gap-2">
      <Button onClick={() => toast({ title: "Status updated", description: "Moved to Interviewing.", tone: "success" })}>Save</Button>
      <Button variant="danger" onClick={() => toast({ title: "Delete failed", description: "Please try again.", tone: "danger" })}>
        Fail
      </Button>
    </div>
  );
}

/** Toasts render in a polite live region, pause while hovered or focused, and can be dismissed. */
export const Toasts: Story = {
  render: () => (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  ),
  parameters: { docs: { story: { inline: false, height: "260px" } } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    const region = screen.getByRole("status");
    await waitFor(() => expect(region).toHaveTextContent("Status updated"));
    await userEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    await waitFor(() => expect(region).not.toHaveTextContent("Status updated"));
  },
};

export const Loading: Story = {
  render: () => (
    <div className="max-w-md space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Spinner label="Analyzing posting" /> Analyzing, about 10 seconds…
      </div>
      <section aria-busy="true" aria-label="Applications" className="space-y-3 rounded-xl border border-line bg-surface p-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </section>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: "Applications" })).toHaveAttribute("aria-busy", "true");
    await expect(canvas.getByRole("status")).toHaveTextContent("Analyzing posting");
  },
};
