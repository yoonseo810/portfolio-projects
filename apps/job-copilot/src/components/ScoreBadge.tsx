export function scoreTone(score: number) {
  if (score >= 75) return "bg-teal-100 text-teal-900 dark:bg-teal-900/40 dark:text-teal-200";
  if (score >= 50) return "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200";
  return "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200";
}

export function ScoreBadge({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "px-4 py-2 text-3xl" : "px-2 py-0.5 text-sm";
  return (
    <span className={`inline-block rounded-md font-mono font-semibold ${cls} ${scoreTone(score)}`}>
      {score}
      <span className="sr-only"> out of 100</span>
    </span>
  );
}
