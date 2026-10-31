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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <Link href="/" className="text-sm text-muted transition-colors hover:text-fg">
        ← Home
      </Link>
      <Suspense fallback={<p className="text-muted">Loading board…</p>}>
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
        <h1 className="text-2xl font-semibold tracking-tight">You&apos;ve been invited to “{data.board.title}”</h1>
        <p className="text-muted">Join as a guest. No sign-up needed.</p>
        <ActionButton action={join} label="Join board" pendingLabel="Joining…" />
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{data.board.title}</h1>
      <Board boardId={id} initialCards={data.cards} me={{ id: userId, ...identityFor(userId) }} />
    </>
  );
}
