import type { Meta, StoryObj } from "@storybook/react-vite";
import { AccountMenu, type AuthState } from "@repo/ui/account-menu";
import { PORTAL_APPS } from "@repo/ui/portal";
import { expect, waitFor } from "storybook/test";

const sent = async (_prev: AuthState, fd: FormData): Promise<AuthState> => ({
  message: `Check ${String(fd.get("email"))} for a sign-in link.`,
});
const noop = async (): Promise<AuthState> => ({});

const meta = {
  title: "Navigation/Account menu",
  component: AccountMenu,
  args: {
    apps: PORTAL_APPS,
    current: "/copilot",
    user: { kind: "guest" },
    signInWithGitHub: noop,
    signInWithEmail: sent,
    signOut: noop,
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-[30rem] justify-end">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AccountMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A guest opens the menu, sees the app list with the current app marked, and requests an email link. */
export const Guest: Story = {
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("button", { name: /sign in/i });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("link", { name: /Job-Search Copilot/ })).toHaveAttribute("aria-current", "page");

    await userEvent.type(canvas.getByLabelText(/sign-in link by email/i), "dana@example.com");
    await userEvent.click(canvas.getByRole("button", { name: "Send link" }));
    await waitFor(() => expect(canvas.getByText("Check dana@example.com for a sign-in link.")).toBeVisible());

    await userEvent.keyboard("{Escape}");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveFocus();
  },
};

/** A signed-in member sees who they are and can sign out from any app. */
export const Member: Story = {
  args: {
    user: { kind: "member", name: "Michael Seo", email: "michael@example.com" },
    defaultOpen: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /account and apps/i })).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText("michael@example.com")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Sign out" })).toBeVisible();
  },
};

/** A first-time visitor with no session yet. */
export const SignedOut: Story = {
  args: { user: { kind: "none" }, defaultOpen: true },
};

/** Errors from a server action are announced. */
export const WithError: Story = {
  args: {
    defaultOpen: true,
    signInWithGitHub: async () => ({ error: "GitHub sign-in isn't available right now. Try the email link instead." }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /continue with github/i }));
    await waitFor(() => expect(canvas.getByRole("alert")).toHaveTextContent(/isn't available/));
  },
};
