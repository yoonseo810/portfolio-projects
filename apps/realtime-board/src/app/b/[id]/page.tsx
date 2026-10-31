import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { joinBoard } from "@/app/actions";
import { ActionButton } from "@/components/ActionButton";
import { Board } from "@/components/Board";
import { getUserId } from "@/lib/auth";
import { identityFor } from "@/lib/board";
import { getBoard } from "@/lib/data";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function BoardPage({ params }: PageProps<"/b/[id]">) {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6 sm:px-8">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← Home
      </Link>
      <Suspense fallback={<p className="text-zinc-500">Loading board…</p>}>
        <BoardLoader params={params} />
      </Suspense>
    </main>
  );
}

async function BoardLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const userId = await getUserId();
  const data = await getBoard(id);
  if (!data) notFound();

  if (!userId) {
    const join = joinBoard.bind(null, id);
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">You&apos;ve been invited to “{data.board.title}”</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Join as a guest. No sign-up needed.</p>
        <ActionButton action={join} label="Join board" pendingLabel="Joining…" />
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">{data.board.title}</h1>
      <Board boardId={id} initialCards={data.cards} me={{ id: userId, ...identityFor(userId) }} />
    </>
  );
}
