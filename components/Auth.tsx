'use client';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useMemo, useState } from 'react';

function shorten(addr?: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
}


function getMonadWallet(user: unknown): string | undefined {
  const u = user as any;
  const crossId = process.env.NEXT_PUBLIC_MONAD_CROSS_APP_ID;
  const ca = u?.linkedAccounts?.find(
    (a: any) => a?.type === 'cross_app' && a?.providerApp?.id === crossId
  );
  return ca?.embeddedWallets?.[0]?.address;
}


function fallbackName(user: unknown): string {
  const u = user as any;
  
  return (
    u?.email?.address ||
    (typeof u?.email === 'string' ? u.email : undefined) ||
    'anonymous'
  );
}

export default function AuthBadge() {
  const { authenticated, user, login, logout } = usePrivy();
  const [username, setUsername] = useState<string>('anonymous');
  const wallet = useMemo(() => getMonadWallet(user), [user]);

  useEffect(() => {
    if (!authenticated) {
      setUsername('anonymous');
      return;
    }
  
    (async () => {
      if (!wallet) {
        setUsername(fallbackName(user));
        return;
      }
      try {
        const res = await fetch(
          `https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${wallet}`
        );
        const data = await res.json();
        if (data?.hasUsername && data?.user?.username) {
          setUsername(String(data.user.username));
        } else {
          setUsername(fallbackName(user));
        }
      } catch {
        setUsername(fallbackName(user));
      }
    })();
  }, [authenticated, user, wallet]);

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500"
      >
        Sign in with Monad Games ID
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="px-2 py-1 rounded bg-zinc-800/70">@{username}</span>
      {wallet && (
        <span className="px-2 py-1 rounded bg-zinc-800/70">
          {shorten(wallet)}
        </span>
      )}
      <button
        onClick={logout}
        className="px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600"
      >
        Log out
      </button>
    </div>
  );
}
