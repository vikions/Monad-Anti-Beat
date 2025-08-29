'use client';
import { usePrivy } from '@privy-io/react-auth';

function getMGIDAddress(user: any): string | undefined {
  const CROSS_ID = process.env.NEXT_PUBLIC_MONAD_CROSS_APP_ID; 
  if (!user?.linkedAccounts) return;
  const acc = user.linkedAccounts.find(
    (a: any) => a?.type === 'cross_app' && a?.providerApp?.id === CROSS_ID
  );
  return acc?.address;
}

export default function AuthBadge() {
  const { authenticated, user, login, logout } = usePrivy();

  const username =
    (user as any)?.username ||
    (user as any)?.displayName ||
    (user as any)?.email?.address ||
    (user as any)?.email ||
    'anonymous';

  const mgid = getMGIDAddress(user);

  return (
    <div className="flex items-center gap-2">
      {!authenticated ? (
        <button
          onClick={() => login()} 
          className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500"
        >
          Login with Monad Games ID
        </button>
      ) : (
        <>
          <span className="px-3 py-2 rounded bg-zinc-800">@{username}</span>
          {mgid && (
            <span className="px-3 py-2 rounded bg-zinc-800">
              {mgid.slice(0, 6)}…{mgid.slice(-4)}
            </span>
          )}
          <button
            onClick={() => logout()}
            className="px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600"
          >
            Log out
          </button>
        </>
      )}
    </div>
  );
}
