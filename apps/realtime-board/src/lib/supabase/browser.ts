import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";

export const createClient = () => createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
