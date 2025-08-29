'use client';
import { useEffect, useState } from 'react';

type Row = { username: string; address?: string; score: number; ts: number };

function normalize(json: any): { rows: Row[]; totalPages?: number } {
  if (!json) return { rows: [] };

  // MGID формат: { data:[{ username, walletAddress, score? / transactionCount? }], pagination:{ totalPages } }
  const raw = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];

  const rows: Row[] = raw.map((r: any) => {
    // пытаемся взять "очки". Если их нет (например сортировка по транзакциям), подставим transactionCount
    const score =
      Number(
        r.score ??
          r.totalScore ??
          r.bestScore ??
          r.highScore ??
          r.points ??
          r.transactionCount ??
          0
      ) || 0;

    const ts =
      r.updatedAt ? Date.parse(r.updatedAt) :
      r.createdAt ? Date.parse(r.createdAt) :
      Date.now();

    return {
      username: r.username || 'anonymous',
      address: r.walletAddress || r.address,
      score,
      ts,
    };
  });

  return {
    rows,
    totalPages: Number(json?.pagination?.totalPages) || undefined,
  };
}

export default function Leaders() {
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState<number | undefined>(undefined);
  const [source, setSource] = useState<'mgid' | 'local' | 'none'>('none');

  const GAME_ID = 116; // твой gameId

  useEffect(() => {
    let aborted = false;

    async function load() {
      // 1) тянем через наш серверный прокси (обходит CORS)
      try {
        const r = await fetch(`/api/mgid-leaderboard?gameId=${GAME_ID}&page=${page}&sortBy=scores`, {
          cache: 'no-store',
        });
        if (!r.ok) throw new Error('mgid not ok');
        const j = await r.json();
        const { rows, totalPages } = normalize(j);
        rows.sort((a, b) => b.score - a.score);
        if (!aborted && rows.length >= 0) {
          setRows(rows);
          setPages(totalPages);
          setSource('mgid');
          return;
        }
      } catch {
        // идём в локальный фоллбэк
      }

      // 2) локальный фоллбэк (твой старый эндпоинт)
      try {
        const r = await fetch('/api/leaderboard', { cache: 'no-store' });
        if (!r.ok) throw new Error('local not ok');
        const j = await r.json();
        const localRows: Row[] = Array.isArray(j) ? j : [];
        localRows.sort((a, b) => b.score - a.score);
        if (!aborted) {
          setRows(localRows);
          setPages(undefined);
          setSource('local');
        }
      } catch {
        if (!aborted) {
          setRows([]);
          setPages(undefined);
          setSource('none');
        }
      }
    }

    load();
    return () => {
      aborted = true;
    };
  }, [page]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="flex items-end justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Leaderboard — Worst Singer</h1>
        <div className="text-xs text-zinc-400">
          Source: {source === 'mgid' ? 'Monad Games ID' : source === 'local' ? 'Local fallback' : '—'}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-left">
          <thead className="text-zinc-400 bg-zinc-900/60">
            <tr>
              <th className="py-2 pr-4">#</th>
              <th className="py-2 pr-4">Username</th>
              <th className="py-2 pr-4">Address</th>
              <th className="py-2 pr-4">Score</th>
              <th className="py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.address ?? r.username}-${i}`} className="border-t border-zinc-800">
                <td className="py-2 pr-4">{(page - 1) * (rows.length || 10) + i + 1}</td>
                <td className="py-2 pr-4">@{r.username || 'anonymous'}</td>
                <td className="py-2 pr-4">
                  {r.address ? `${r.address.slice(0, 6)}…${r.address.slice(-4)}` : '—'}
                </td>
                <td className="py-2 pr-4 font-semibold">{r.score}</td>
                <td className="py-2">{isNaN(r.ts) ? '—' : new Date(r.ts).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-400">
                  No results yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {source === 'mgid' && (pages ?? 0) > 1 && (
        <div className="flex items-center gap-3 mt-4 justify-center">
          <button
            className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            ← Prev
          </button>
          <div className="text-sm text-zinc-400">
            Page {page}{pages ? ` / ${pages}` : ''}
          </div>
          <button
            className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
            disabled={pages ? page >= pages : false}
          >
            Next →
          </button>
        </div>
      )}
    </main>
  );
}
