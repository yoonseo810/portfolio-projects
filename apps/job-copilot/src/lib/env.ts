export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
/** Analyses one visitor can run per rolling 24 hours, to stay inside the free tier. */
export const DAILY_ANALYSIS_LIMIT = Number(process.env.DAILY_ANALYSIS_LIMIT ?? 10);
