import type { Metadata } from "next";
import { FinishSignIn } from "@/components/FinishSignIn";

export const metadata: Metadata = { title: "Finishing sign-in" };

export default function FinishPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-20 sm:px-6">
      <FinishSignIn />
    </main>
  );
}
