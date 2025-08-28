import { NextResponse } from 'next/server';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from '@/lib/monad';
import { monadGamesAbi } from '@/lib/monadGamesAbi';
export const runtime = 'nodejs';

const DURATION_MS = 20000;
const BPM = 120;
const BEAT_MS = 60000 / BPM;
const MIN_MS = 50, MAX_MS = 220;

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

export async function POST(req: Request) {
  try {
    const { player, taps, t0 } = await req.json();

    if (!player || !Array.isArray(taps) || typeof t0 !== 'number') {
      return NextResponse.json({ ok: false, error: 'bad payload' }, { status: 400 });
    }

    
    const beats = buildBeats(t0);
    let score = 0;
    let last = 0;
    for (const t of taps as number[]) {
      if (last && t - last < 120) continue;
      const dt = nearestDt(t, beats);
      score += mapPoints(dt);
      last = t;
    }
    const txCount = 1;

    
    const pkRaw = (process.env.SERVER_PRIVATE_KEY || '').trim();
    if (!pkRaw) {
      return NextResponse.json({ ok: false, error: 'SERVER_PRIVATE_KEY missing' }, { status: 500 });
    }
    const pk = (pkRaw.startsWith('0x') ? pkRaw : `0x${pkRaw}`) as `0x${string}`;
    const account = privateKeyToAccount(pk);

    
    const rpc = process.env.MONAD_RPC_URL;
    if (!rpc) {
      return NextResponse.json({ ok: false, error: 'MONAD_RPC_URL missing' }, { status: 500 });
    }
    const client = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(rpc),
    });

    
    const contract = process.env.MONAD_GAMES_ID_CONTRACT as `0x${string}`;
    if (!contract) {
      return NextResponse.json({ ok: false, error: 'MONAD_GAMES_ID_CONTRACT missing' }, { status: 500 });
    }

    const txHash = await client.writeContract({
      address: contract,
      abi: monadGamesAbi,
      functionName: 'updatePlayerData',
      args: [player as `0x${string}`, BigInt(score), BigInt(txCount)],
      account, 
    });

    return NextResponse.json({ ok: true, tx: txHash, score, txCount });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'server error' }, { status: 500 });
  }
}
