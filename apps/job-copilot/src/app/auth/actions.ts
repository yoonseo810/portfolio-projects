"use server";

import type { AuthState } from "@repo/ui/account-menu";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { BASE_PATH, SITE_ORIGIN, safeNext } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/** The origin the visitor sees (the portfolio domain), so the auth cookie lands on the shared host. */
async function callbackUrl(next: string) {
  const origin = (await headers()).get("origin") ?? SITE_ORIGIN;
  return `${origin}${BASE_PATH}/auth/callback?next=${encodeURIComponent(next)}`;
}

/**
 * Guests link GitHub to their current anonymous user, so everything they made stays theirs.
 * Everyone else (or a guest whose GitHub account is already a member, via mode=signin) signs in.
 */
export async function signInWithGitHub(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const redirectTo = await callbackUrl(safeNext(formData.get("next")));
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const link = formData.get("mode") !== "signin" && claims?.claims?.is_anonymous === true;
  const { data, error } = link
    ? await supabase.auth.linkIdentity({ provider: "github", options: { redirectTo } })
    : await supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo } });
  if (error || !data.url) {
    console.error("GitHub sign-in failed", error);
    return { error: "GitHub sign-in isn't available right now. Try the email link instead." };
  }
  redirect(data.url);
}

/** Guests add an email to their anonymous user (keeps their work); others get a magic link. */
export async function signInWithEmail(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z.email().safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address." };
  const email = parsed.data;
  const emailRedirectTo = await callbackUrl(safeNext(formData.get("next")));
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (claims?.claims?.is_anonymous) {
    const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo });
    if (!error) return { message: `Check ${email} for a confirmation link. Your guest work comes with you.` };
    // An existing member's email: fall through and sign in to that account instead.
    if (error.code !== "email_exists") return emailError(error);
  }
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } });
  if (error) return emailError(error);
  return { message: `Check ${email} for a sign-in link.` };
}

function emailError(error: { code?: string }): AuthState {
  console.error("Email sign-in failed", error);
  if (error.code === "over_email_send_rate_limit") {
    return { error: "Too many emails were sent recently. Try again in a little while, or use GitHub." };
  }
  return { error: "Couldn't send the email right now. Please try again." };
}

export async function signOut(): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    console.error("signOut failed", error);
    return { error: "Couldn't sign out. Please try again." };
  }
  redirect("/");
}
