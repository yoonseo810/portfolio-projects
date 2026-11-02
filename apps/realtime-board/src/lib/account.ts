import "server-only";
import type { AccountUser } from "@repo/ui/account-menu";
import { createClient } from "@/lib/supabase/server";

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);

/** Who is visiting, from verified JWT claims. The same cookie is shared by every app on the domain. */
export async function getAccount(): Promise<AccountUser> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return { kind: "none" };
  if (claims.is_anonymous) return { kind: "guest" };
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const email = str(claims.email);
  return {
    kind: "member",
    name: str(meta.full_name) ?? str(meta.name) ?? str(meta.user_name) ?? email?.split("@")[0] ?? "Member",
    email,
    avatarUrl: str(meta.avatar_url),
  };
}
