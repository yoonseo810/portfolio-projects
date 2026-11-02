import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { BASE_PATH, safeNext } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/**
 * Where GitHub and email links land. Trades the one-time code for a session cookie on the shared domain.
 * redirect() in a Route Handler does not add basePath, so the paths below include it.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("next"));
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  if (code || (tokenHash && type)) {
    const supabase = await createClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type! });
    if (!error) redirect(`${BASE_PATH}${next}`);
    console.error("Auth callback failed", error);
  }

  // Errors can arrive in the query or the URL fragment. The browser keeps the fragment across
  // this redirect, so the finish page can read both.
  const finish = new URLSearchParams({ next });
  for (const key of ["error_code", "error_description"]) {
    const value = params.get(key);
    if (value) finish.set(key, value);
  }
  if (code && !finish.has("error_code")) finish.set("error_code", "exchange_failed");
  redirect(`${BASE_PATH}/auth/finish?${finish}`);
}
