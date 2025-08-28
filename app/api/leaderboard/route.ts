import { NextResponse } from 'next/server';
import { _entries as entries } from '../submit/route';

export async function GET() {
  return NextResponse.json(entries.slice(0, 50));
}
