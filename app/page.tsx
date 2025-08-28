import Link from "next/link";
import Image from "next/image";
import AuthBadge from "@/components/Auth";

export default function Home() {
  return (
    <main className="min-h-screen text-zinc-100 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 relative overflow-hidden">
      
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full blur-3xl opacity-30"
           style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 60%)" }} />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full blur-3xl opacity-30"
           style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 60%)" }} />

      
      <div className="absolute top-4 right-4 z-10">
        <AuthBadge />
      </div>

      <div className="min-h-screen grid place-items-center p-6">
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-8 shadow-2xl backdrop-blur-sm text-center max-w-xl w-full space-y-6">
          <div className="flex justify-center">
            <Image
              src="/img/worst-singer.png"
              alt="Worst Singer"
              width={224}
              height={224}
              priority
              className="drop-shadow-xl"
            />
          </div>

          <h1 className="text-4xl font-semibold tracking-tight">MONAD ANTI-BEAT</h1>
          <p className="opacity-80">The worse you sing/tap — the better your score.</p>

          <div className="flex items-center justify-center gap-3">
            <Link
              href="/play"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow"
            >
              Play
            </Link>
            <Link
              href="/leaders"
              className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
            >
              Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
