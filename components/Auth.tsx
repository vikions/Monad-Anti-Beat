'use client';

import { usePrivy, User } from '@privy-io/react-auth';

const CROSS_APP_ID = process.env.NEXT_PUBLIC_MONAD_CROSS_APP_ID || '';

function getMGIDAddress(user?: User | null): string | undefined {
  if (!user?.linkedAccounts) return;
  const cross = (user.linkedAccounts as unknown as any[]).find(
    (a) => a?.type === 'cross_app' && a?.providerApp?.id === CROSS_APP_ID
  );
  return cross?.embeddedWallets?.[0]?.address || cross?.address;
}

function short(addr?: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
}

export default function AuthBadge() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  const name =
    (user as unknown as { email?: { address?: string } })?.email?.address || 'anonymous';
  const mgidAddress = getMGIDAddress(user);

  if (!ready) return null;

  return (
    <div className="flex items-center gap-2">
      {!authenticated ? (
        <button
          onClick={() => login()} 
          className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
        >
          Log in (Monad Games ID)
        </button>
      ) : (
        <>
          <span className="px-2 py-1 rounded bg-zinc-800 text-sm">{name}</span>
          <span className="px-2 py-1 rounded bg-zinc-800 text-sm">
            {mgidAddress ? short(mgidAddress) : 'No MGID wallet'}
          </span>
          <button onClick={() => logout()} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700">
            Log out
          </button>
        </>
      )}
    </div>
  );
}
