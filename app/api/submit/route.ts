import { NextResponse } from 'next/server';

type Entry = { username: string; address?: string; score: number; ts: number };
const entries: Entry[] = []; 

export async function POST(req: Request) {
  const { username, address, score } = await req.json();
  if (typeof score !== 'number' || score < 0) {
    return NextResponse.json({ ok: false, error: 'bad score' }, { status: 400 });
  }
  entries.push({ username: String(username||'anonymous'), address, score, ts: Date.now() });
  
  entries.sort((a,b)=> b.score - a.score);
  if (entries.length > 100) entries.length = 100;

  return NextResponse.json({ ok: true });
}

export async function GET() { 
  return NextResponse.json(entries);
}


export const _entries = entries;
