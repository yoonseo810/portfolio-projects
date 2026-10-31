import { cn } from "@repo/ui/cn";

export function scoreTone(score: number) {
  if (score >= 75) return "border-success/30 bg-success/10 text-success";
  if (score >= 50) return "border-warning/30 bg-warning/10 text-warning";
  return "border-danger/30 bg-danger/10 text-danger";
}

function ringColor(score: number) {
  if (score >= 75) return "var(--success)";
  if (score >= 50) return "var(--warning)";
  return "var(--danger)";
}

export function ScoreBadge({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  if (size === "lg") {
    return (
      <span
        className="relative inline-flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(${ringColor(score)} ${score * 3.6}deg, var(--line) 0deg)`,
        }}
      >
        <span className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-surface font-mono text-3xl font-semibold">
          {score}
          <span className="sr-only"> out of 100</span>
        </span>
      </span>
    );
  }
  return (
    <span className={cn("inline-flex w-11 justify-center rounded-md border py-0.5 font-mono text-sm font-semibold", scoreTone(score))}>
      {score}
      <span className="sr-only"> out of 100</span>
    </span>
  );
}
