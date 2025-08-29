'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AuthComponent } from '@/components/Auth';

/* ===== Gameplay constants ===== */
const BPM = 120;
const DURATION_MS = 20_000;
const BEAT_MS = 60_000 / BPM;
const MIN_MS = 50;
const MAX_MS = 220;
const START_OFFSET_MS = 0;

/* ===== Helpers for rhythm logic ===== */
function buildBeats(t0: number) {
  const beats: number[] = [];
  for (let t = t0; t <= t0 + DURATION_MS + 1; t += BEAT_MS) beats.push(t);
  return beats;
}
function nearestDt(t: number, beats: number[]) {
  let best = Infinity;
  for (const b of beats) {
    const d = Math.abs(t - b);
    if (d < best) best = d;
  }
  return best;
}
function mapPoints(dt: number) {
  const c = Math.max(MIN_MS, Math.min(MAX_MS, dt));
  const norm = (c - MIN_MS) / (MAX_MS - MIN_MS); // 0..1
  return Math.round(100 * norm);
}
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function Play() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [beats, setBeats] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [taps, setTaps] = useState<{ t: number; dt: number; pts: number }[]>([]);
  const [done, setDone] = useState(false);
  const [, setTick] = useState(0); // re-render for progress bar

  // Данные от AuthComponent (Monad Games ID)
  const [mgidAddress, setMgidAddress] = useState<string>('');
  const [mgidUsername, setMgidUsername] = useState<string>('');

  const handleUserChange = (u: any) => {
    if (u) {
      setMgidAddress(u.address || '');
      setMgidUsername(u.username || '');
    } else {
      setMgidAddress('');
      setMgidUsername('');
    }
  };

  /* progress animation */
  useEffect(() => {
    if (!startedAt || done) return;
    let raf = 0;
    const loop = () => {
      setTick((x) => x + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [startedAt, done]);

  const start = async () => {
    if (!audioRef.current) return;
    setScore(0);
    setTaps([]);
    setDone(false);
    await audioRef.current.play();
    const t0 = performance.now() + START_OFFSET_MS;
    setStartedAt(t0);
    setBeats(buildBeats(t0));
    setTimeout(() => {
      audioRef.current?.pause();
      setDone(true);
    }, DURATION_MS + 80);
  };

  /* tap handler */
  useEffect(() => {
    const handler = (e: KeyboardEvent | MouseEvent) => {
      if (done || !startedAt) return;
      if ((e as KeyboardEvent).type === 'keydown') {
        const ke = e as KeyboardEvent;
        if (ke.code !== 'Space') return;
      }
      const t = performance.now();
      if (taps.length && t - taps[taps.length - 1].t < 120) return; // anti-spam
      const dt = nearestDt(t, beats);
      const pts = mapPoints(dt);
      setScore((s) => s + pts);
      setTaps((ts) => [...ts, { t, dt, pts }]);
    };
    window.addEventListener('keydown', handler as any);
    window.addEventListener('mousedown', handler as any);
    return () => {
      window.removeEventListener('keydown', handler as any);
      window.removeEventListener('mousedown', handler as any);
    };
  }, [beats, startedAt, done, taps]);

  const progress = startedAt ? clamp((performance.now() - startedAt) / DURATION_MS, 0, 1) : 0;

  /* local leaderboard submit */
  const submitLocal = async () => {
    if (!mgidAddress) {
      alert('Sign in with Monad Games ID first.');
      return;
    }
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: mgidUsername || 'anonymous',
        address: mgidAddress,
        score,
      }),
    });
    if (res.ok) window.location.href = '/leaders';
  };

  /* on-chain submit — только с MGID-адресом */
  const submitOnchain = async () => {
    if (!mgidAddress) {
      alert('Please sign in with Monad Games ID — MGID wallet is required.');
      return;
    }
    if (!startedAt) {
      alert('Play the song first 😊');
      return;
    }
    try {
      const res = await fetch('/api/submit-onchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: mgidAddress,            // <<< ТОЛЬКО MGID-адрес!
          taps: taps.map((t) => t.t),
          t0: startedAt,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'submit failed');
      alert(`On-chain submitted!\nScore: ${data.score}\nTx: ${data.tx}`);
    } catch (e: any) {
      alert('On-chain error: ' + (e?.message || e));
    }
  };

  return (
    <main className="min-h-screen text-zinc-100 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 relative overflow-hidden p-6">
      {/* Auras */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 60%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 60%)' }}
      />

      {/* Бейдж/кнопка авторизации MGID */}
      <div className="absolute top-4 right-4 z-10">
        <AuthComponent onUserChange={handleUserChange} />
      </div>

      <section className="max-w-4xl mx-auto mt-10 rounded-2xl bg-zinc-900/60 border border-zinc-800 p-6 shadow-2xl backdrop-blur-sm flex flex-col items-center gap-6">
        <Image
          src="/img/worst-singer.png"
          alt="Worst Singer"
          width={192}
          height={192}
          priority
          className="drop-shadow-xl"
        />
        <audio ref={audioRef} src="/audio/monad_theme.mp3" preload="auto" />

        <div className="text-3xl font-bold">Off-Beat Score: {score}</div>

        {!startedAt && (
          <button onClick={start} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow">
            Play (SPACE / Click)
          </button>
        )}

        {/* Timeline */}
        <div className="w/full max-w-3xl h-24 relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[6px] bg-zinc-800 rounded-full" />
          <div className="absolute inset-0">
            {startedAt &&
              beats.map((b, i) => {
                const p = clamp((b - startedAt) / DURATION_MS, 0, 1);
                const x = `${p * 100}%`;
                const glow = Math.abs(p - progress) < 0.03 ? 'shadow-[0_0_12px_rgba(99,102,241,0.8)]' : '';
                return (
                  <div
                    key={i}
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${glow}`}
                    style={{ left: x }}
                  >
                    <div className="w-2 h-2 rounded-full bg-indigo-400 opacity-80" />
                  </div>
                );
              })}
          </div>
          <div className="absolute top-0 bottom-0" style={{ left: `${progress * 100}%` }}>
            <div className="w-[2px] h-full bg-indigo-300/80 shadow-[0_0_10px_rgba(99,102,241,0.9)]" />
          </div>
          <div className="absolute inset-0 pointer-events-none">
            {startedAt &&
              taps.map((tap, i) => {
                const p = clamp((tap.t - startedAt) / DURATION_MS, 0, 1);
                const x = `${p * 100}%`;
                const far = clamp((tap.dt - MIN_MS) / (MAX_MS - MIN_MS), 0, 1);
                const size = 10 + far * 16;
                const bg = `rgba(251, 146, 60, ${0.45 + far * 0.45})`;
                return (
                  <div key={i} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: x }}>
                    <div style={{ width: size, height: size, background: bg }} className="rounded-full ring-2 ring-orange-300/60" />
                    <div className="absolute -top-8 -left-6 text-xs text-orange-300/90">+{tap.pts}</div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Hint when MGID is not linked */}
        {!mgidAddress && (
          <div className="text-sm text-amber-300/90 bg-amber-900/20 border border-amber-600/30 rounded p-3">
            Sign in with <b>Monad Games ID</b>. After login, your MGID wallet will appear here.
          </div>
        )}

        {startedAt && !done && (
          <div className="text-sm opacity-80 text-center">
            Tap anywhere or press <b>SPACE</b> — the worse the timing, the better.
            <br />
            Close to tick = low points • Far from tick = big points
          </div>
        )}

        {done && (
          <div className="text-2xl text-center mb-2 space-y-4">
            <div>
              🎤 <b>WORST SINGER</b> 🎤
              <br />
              Your Off-Beat Score: <b>{score}</b>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => window.location.reload()} className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700">
                Try again
              </button>
              <Link href="/" className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700">
                Main menu
              </Link>
              <button onClick={submitLocal} disabled={!mgidAddress} className={`px-4 py-2 rounded ${mgidAddress ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-emerald-600/40 cursor-not-allowed'}`}>
                Submit to Leaderboard
              </button>
              <button
                onClick={submitOnchain}
                disabled={!mgidAddress}
                className={`px-4 py-2 rounded ${
                  mgidAddress ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-cyan-600/40 cursor-not-allowed'
                }`}
              >
                Submit On-chain
              </button>
              <Link
                href="https://monad-games-id-site.vercel.app/leaderboard"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500"
              >
                Global Leaderboard
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
