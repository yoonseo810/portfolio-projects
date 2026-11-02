import { AccountMenu } from "@repo/ui/account-menu";
import { PORTAL_APPS } from "@repo/ui/portal";
import { signInWithEmail, signInWithGitHub, signOut } from "@/app/auth/actions";
import { getAccount } from "@/lib/account";
import { BASE_PATH } from "@/lib/site";

/** Sign-in state and the app switcher. Streams in after the static header (it reads cookies). */
export async function HeaderAccount() {
  const user = await getAccount();
  return (
    <AccountMenu
      apps={PORTAL_APPS}
      current={BASE_PATH}
      basePath={BASE_PATH}
      user={user}
      signInWithGitHub={signInWithGitHub}
      signInWithEmail={signInWithEmail}
      signOut={signOut}
    />
  );
}

/** Same footprint as the menu button, so the header doesn't shift when it streams in. */
export function HeaderAccountFallback() {
  return <span aria-hidden className="inline-block h-8 w-20 rounded-lg border border-line" />;
}
