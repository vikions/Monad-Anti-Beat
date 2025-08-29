'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AuthBadge from '@/components/Auth';
import { usePrivy } from '@privy-io/react-auth';

const BPM = 120;
const DURATION_MS = 20000;
const BEAT_MS = 60000 / BPM;
const MIN_MS = 50, MAX_MS = 220;
const START_OFFSET_MS = 0;

function buildBeats(t0: number) {
  const beats: number[] = [];
  for (let t = t0; t <= t0 + DURATION_MS + 1; t += BEAT_MS) beats.push(t);
  return beats;
}
function nearestDt(t: number, beats: number[]) {
  let best = Infinity;
  for (const b of beats) { const d = Math.abs(t - b); if (d < best) best = d; }
  return best;
}
function mapPoints(dt: number) {
  const c = Math.max(MIN_MS, Math.min(MAX_MS, dt));
  const norm = (c - MIN_MS) / (MAX_MS - MIN_MS);
  return Math.round(100 * norm);
}
function clamp(v:number,min:number,max:number){return Math.max(min,Math.min(max,v));}

function getUsername(user: any): string {
  return user?.username || user?.displayName || user?.email?.address || user?.email || 'anonymous';
}

/**
 * Достаём именно MGID-кошелёк (cross_app)
 */
function getMGIDAddress(user: any): string | undefined {
  const CROSS_ID = process.env.NEXT_PUBLIC_MONAD_CROSS_APP_ID;
  if (!user?.linkedAccounts) return undefined;
  const acc = user.linkedAccounts.find(
    (a: any) => a.type === 'cross_app' && a.providerApp?.id === CROSS_ID
  );
  return acc?.address || acc?.embeddedWallets?.[0]?.address;
}

export default function Play() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [beats, setBeats] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [taps, setTaps] = useState<{t:number, dt:number, pts:number}[]>([]);
  const [done, setDone] = useState(false);
  const [, setTick] = useState(0);

  const { authenticated, user, login } = usePrivy();
  const username = getUsername(user as any);
  const mgidAddress = getMGIDAddress(user as any);

  useEffect(() => {
    if (!startedAt || done) return;
    let raf = 0;
    const loop = () => { setTick(x => x + 1); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [startedAt, done]);

  const start = async () => {
    if (!audioRef.current) return;
    setScore(0); setTaps([]); setDone(false);
    await audioRef.current.play();
    const t0 = performance.now() + START_OFFSET_MS;
    setStartedAt(t0);
    setBeats(buildBeats(t0));
    setTimeout(() => { audioRef.current?.pause(); setDone(true); }, DURATION_MS + 80);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent | MouseEvent) => {
      if (done || !startedAt) return;
      if ((e as KeyboardEvent).type === 'keydown') {
        const ke = e as KeyboardEvent;
        if (ke.code !== 'Space') return;
      }
      const t = performance.now();
      if (taps.length && t - taps[taps.length - 1].t < 120) return;
      const dt = nearestDt(t, beats);
      const pts = mapPoints(dt);
      setScore(s => s + pts);
      setTaps(ts => [...ts, { t, dt, pts }]);
    };
    window.addEventListener('keydown', handler as any);
    window.addEventListener('mousedown', handler as any);
    return () => {
      window.removeEventListener('keydown', handler as any);
      window.removeEventListener('mousedown', handler as any);
    };
  }, [beats, startedAt, done, taps]);

  const progress = startedAt ? clamp((performance.now() - startedAt) / DURATION_MS, 0, 1) : 0;

  const submit = async () => {
    if (!authenticated) { await login(); }
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ username, address: mgidAddress, score })
    });
    if (res.ok) window.location.href = '/leaders';
  };

  const submitOnchain = async () => {
    if (!authenticated) { await login(); }
    if (!mgidAddress) { alert('Sign in with Monad Games ID to get your Games ID wallet.'); return; }
    if (!startedAt) { alert('Play the song first 😊'); return; }

    try {
      const res = await fetch('/api/submit-onchain', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          player: mgidAddress,
          taps: taps.map(t=>t.t),
          t0: startedAt,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'submit failed');
      alert(`On-chain submitted!\nScore: ${data.score}\nTx: ${data.tx}`);
    } catch (e:any) {
      alert('On-chain error: ' + (e?.message || e));
    }
  };

  return (
    <main className="min-h-screen text-zinc-100 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 relative overflow-hidden p-6">
      <div className="absolute top-4 right-4 z-10">
        <AuthBadge />
      </div>

      <section className="max-w-4xl mx-auto mt-10 rounded-2xl bg-zinc-900/60 border border-zinc-800 p-6 shadow-2xl backdrop-blur-sm flex flex-col items-center gap-6">
        <Image src="/img/worst-singer.png" alt="Worst Singer" width={192} height={192} priority />
        <audio ref={audioRef} src="/audio/monad_theme.mp3" preload="auto" />

        <div className="text-3xl font-bold">Off-Beat Score: {score}</div>

        {!startedAt && (
          <button onClick={start} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow">
            Play (SPACE / Click)
          </button>
        )}

        {startedAt && !done && (
          <div className="text-sm opacity-80 text-center">
            Tap anywhere or press <b>SPACE</b>
          </div>
        )}

        {done && (
          <div className="text-2xl text-center mb-2 space-y-4">
            <div>🎤 <b>WORST SINGER</b> 🎤<br />Your Off-Beat Score: <b>{score}</b></div>

            {/* Debug info */}
            <div className="text-sm text-amber-300/90">
              Logged in as: <b>{username}</b><br/>
              MGID wallet: <b>{mgidAddress || 'not found'}</b>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button onClick={()=>window.location.reload()} className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700">Try again</button>
              <Link href="/" className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700">Main menu</Link>
              <button onClick={submit} className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500">Submit to Leaderboard</button>
              <button
                onClick={submitOnchain}
                disabled={!mgidAddress}
                className={`px-4 py-2 rounded ${mgidAddress ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-cyan-600/40 cursor-not-allowed'}`}
              >
                Submit On-chain
              </button>
              <Link href="https://monad-games-id-site.vercel.app/leaderboard" target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500">
                Global Leaderboard
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
