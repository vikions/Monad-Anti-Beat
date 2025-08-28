'use client';
import { useEffect, useState } from 'react';

type Row = { username: string; address?: string; score: number; ts: number };

export default function Leaders() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    fetch('/api/leaderboard').then(r=>r.json()).then(setRows);
  }, []);
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Leaderboard — Worst Singer</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-zinc-400">
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
              <tr key={i} className="border-t border-zinc-800">
                <td className="py-2 pr-4">{i+1}</td>
                <td className="py-2 pr-4">@{r.username}</td>
                <td className="py-2 pr-4">{r.address ? r.address.slice(0,6)+'…'+r.address.slice(-4) : '—'}</td>
                <td className="py-2 pr-4 font-semibold">{r.score}</td>
                <td className="py-2">{new Date(r.ts).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
