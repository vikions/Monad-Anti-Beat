
export const dynamic = 'force-dynamic';

function pick<T>(v: T | undefined | null, d: T): T { return v ?? d; }

export async function GET(req: Request) {
  const urlIn = new URL(req.url);
  const gameId = urlIn.searchParams.get('gameId') ?? '116';
  const page   = urlIn.searchParams.get('page')   ?? '1';
  const sortBy = urlIn.searchParams.get('sortBy') ?? 'scores';

  const upstream = `https://monad-games-id-site.vercel.app/api/leaderboard?gameId=${gameId}&page=${page}&sortBy=${sortBy}`;

  try {
    const r = await fetch(upstream, { cache: 'no-store' });
    const data = await r.json().catch(() => ({}));

    return new Response(JSON.stringify(data), {
      status: r.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'access-control-allow-origin': '*',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'upstream_failed' }), {
      status: 502,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
}
