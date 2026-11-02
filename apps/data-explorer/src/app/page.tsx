import { Eyebrow } from "@repo/ui/eyebrow";
import { Suspense } from "react";
import { Explorer } from "@/components/Explorer";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <Eyebrow>Toronto open data · Web Worker · virtualized</Eyebrow>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        <span className="text-gradient">Where and when the subway slows down</span>
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        Every reported TTC subway delay, filterable by date, line, station, cause and hour. Filters live in the URL, so any
        view can be shared. Click a bar to drill in.
      </p>
      <div className="mt-8">
        {/* useSearchParams needs a Suspense boundary; the explorer renders its own loading state inside. */}
        <Suspense>
          <Explorer />
        </Suspense>
      </div>
    </main>
  );
}
