import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Returns the signed-in user's id, or null. Uses verified JWT claims, not the unverified session. */
export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
}

export async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) redirect("/");
  return id;
}
