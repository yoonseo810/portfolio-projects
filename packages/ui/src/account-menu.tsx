"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Avatar } from "./avatar";
import { Button } from "./button";
import { cn } from "./cn";

export type PortalApp = { label: string; href: string; description?: string };

/** Who is looking: nobody yet, a guest (anonymous session), or a signed-in member. */
export type AccountUser =
  | { kind: "none" }
  | { kind: "guest" }
  | { kind: "member"; name: string; email?: string; avatarUrl?: string };

export type AuthState = { error?: string; message?: string };
export type AuthAction = (prev: AuthState, formData: FormData) => Promise<AuthState>;

/**
 * Header menu shared by every app under the portfolio domain: switch apps, and sign in once
 * to keep your work across all of them. A disclosure (button + panel), not an ARIA menu, because
 * the panel holds forms. Escape and clicks outside close it and return focus to the button.
 */
export function AccountMenu({
  apps,
  current,
  user,
  basePath = "",
  signInWithGitHub,
  signInWithEmail,
  signOut,
  defaultOpen = false,
}: {
  apps: PortalApp[];
  /** href of the app this menu is rendered in, marked with aria-current. */
  current?: string;
  user: AccountUser;
  /** The app's base path, stripped from the current URL to build the post-sign-in return path. */
  basePath?: string;
  signInWithGitHub: AuthAction;
  signInWithEmail: AuthAction;
  signOut: AuthAction;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [next, setNext] = useState("/");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const headingId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const member = user.kind === "member" ? user : null;

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          close();
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (!open) {
            // Come back to the page the visitor is on. Read on click, so server and client render match.
            const { pathname, search } = window.location;
            const inApp = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
            setNext((inApp || "/") + search);
          }
          setOpen(!open);
        }}
        className={cn(
          "inline-flex h-8 items-center gap-2 rounded-lg text-sm font-medium transition-colors hover:bg-surface-2",
          member ? "pl-0.5 pr-2" : "border border-line-strong px-3",
        )}
      >
        {member ? (
          <>
            <Avatar name={member.name} src={member.avatarUrl} size="sm" />
            <span className="sr-only">Account and apps</span>
          </>
        ) : (
          <>
            Sign in<span className="sr-only"> and switch apps</span>
          </>
        )}
        <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn("text-muted transition-transform", open && "rotate-180")}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <section
        id={panelId}
        hidden={!open}
        aria-labelledby={headingId}
        className="absolute right-0 top-full z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-4 text-sm shadow-[0_24px_60px_-20px_rgb(0_0_0/0.5)]"
      >
        <h2 id={headingId} className="sr-only">
          Account and apps
        </h2>
        {member ? (
          <MemberPanel member={member} signOut={signOut} />
        ) : (
          <SignInPanel guest={user.kind === "guest"} next={next} signInWithGitHub={signInWithGitHub} signInWithEmail={signInWithEmail} />
        )}

        <nav aria-label="Apps" className="mt-4 border-t border-line pt-3">
          <ul className="space-y-0.5">
            {apps.map((app) => (
              <li key={app.href}>
                <a
                  href={app.href}
                  aria-current={app.href === current ? "page" : undefined}
                  className="block rounded-lg px-2.5 py-2 transition-colors hover:bg-surface-2 aria-[current=page]:bg-surface-2"
                >
                  <span className="font-medium text-fg">{app.label}</span>
                  {app.description && <span className="block text-xs text-muted">{app.description}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </div>
  );
}

function MemberPanel({ member, signOut }: { member: Extract<AccountUser, { kind: "member" }>; signOut: AuthAction }) {
  const [state, action, pending] = useActionState(signOut, {});
  return (
    <div className="flex items-center gap-3">
      <Avatar name={member.name} src={member.avatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-fg">{member.name}</p>
        {member.email && <p className="truncate text-xs text-muted">{member.email}</p>}
        {state.error && (
          <p role="alert" className="mt-1 text-xs text-danger">
            {state.error}
          </p>
        )}
      </div>
      <form action={action}>
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? "Signing out…" : "Sign out"}
        </Button>
      </form>
    </div>
  );
}

function SignInPanel({
  guest,
  next,
  signInWithGitHub,
  signInWithEmail,
}: {
  guest: boolean;
  next: string;
  signInWithGitHub: AuthAction;
  signInWithEmail: AuthAction;
}) {
  const [gh, ghAction, ghPending] = useActionState(signInWithGitHub, {});
  const [mail, mailAction, mailPending] = useActionState(signInWithEmail, {});
  const emailId = useId();
  const error = gh.error ?? mail.error;

  return (
    <div>
      <p className="font-semibold text-fg">{guest ? "Keep your guest work" : "Sign in"}</p>
      <p className="mt-1 text-muted">
        {guest
          ? "You're browsing as a guest. Sign in to keep what you've made and use it in every app here."
          : "Optional. One sign-in works across every app here."}
      </p>

      <form action={ghAction} className="mt-3">
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="secondary" className="w-full" disabled={ghPending}>
          <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
          </svg>
          {ghPending ? "Redirecting…" : "Continue with GitHub"}
        </Button>
      </form>

      <form action={mailAction} className="mt-3">
        <input type="hidden" name="next" value={next} />
        <label htmlFor={emailId} className="mb-1.5 block text-xs font-medium text-muted">
          Or get a sign-in link by email
        </label>
        <div className="flex gap-2">
          <input
            id={emailId}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="h-8 min-w-0 flex-1 rounded-lg border border-line-strong bg-bg px-2.5 text-sm text-fg placeholder:text-muted focus-visible:border-accent"
          />
          <Button type="submit" size="sm" disabled={mailPending}>
            {mailPending ? "Sending…" : "Send link"}
          </Button>
        </div>
      </form>

      <div aria-live="polite" className="mt-2 min-h-0 text-xs">
        {mail.message && <p className="text-success">{mail.message}</p>}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
