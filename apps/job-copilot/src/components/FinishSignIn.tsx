"use client";

import { Alert } from "@repo/ui/alert";
import { buttonClass } from "@repo/ui/button";
import { useActionState, useEffect, useRef, useSyncExternalStore } from "react";
import { signInWithGitHub } from "@/app/auth/actions";
import { BASE_PATH, safeNext } from "@/lib/site";

type Outcome = { code: string; description: string; next: string } | null;

let cached: { key: string; value: Outcome } | null = null;

/** Reads the auth outcome from the query and the fragment (which never reaches the server). */
function readOutcome(): Outcome {
  const key = window.location.search + window.location.hash;
  if (cached?.key === key) return cached.value;
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const get = (k: string) => hash.get(k) ?? query.get(k) ?? "";
  const next = query.get("next");
  const value = { code: get("error_code"), description: get("error_description"), next: safeNext(next) };
  cached = { key, value };
  return value;
}

const subscribe = () => () => {};

export function FinishSignIn() {
  const outcome = useSyncExternalStore(subscribe, readOutcome, () => null);
  const [state, action] = useActionState(signInWithGitHub, {});
  const formRef = useRef<HTMLFormElement>(null);
  const alreadyMember = outcome?.code === "identity_already_exists";

  useEffect(() => {
    // That GitHub account already has an account here: sign in to it rather than linking.
    if (alreadyMember) formRef.current?.requestSubmit();
  }, [alreadyMember]);

  if (!outcome) return null;

  if (alreadyMember) {
    return (
      <form ref={formRef} action={action} className="space-y-4">
        <input type="hidden" name="mode" value="signin" />
        <input type="hidden" name="next" value={outcome.next} />
        <Alert tone="info" title="You already have an account" live>
          That GitHub account is already signed up, so we&apos;re signing you in to it. Work from this guest session stays
          on this device only.
        </Alert>
        {state.error && <Alert tone="danger" title="Sign-in failed" live>{state.error}</Alert>}
        <button type="submit" className={buttonClass({ variant: "secondary" })}>
          Continue with GitHub
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <Alert tone="danger" title="Sign-in didn't finish" live>
        {outcome.description || "The link may have expired or already been used. Please try again."}
      </Alert>
      <a href={`${BASE_PATH}${outcome.next}`} className={buttonClass({ variant: "secondary" })}>
        Go back
      </a>
    </div>
  );
}
