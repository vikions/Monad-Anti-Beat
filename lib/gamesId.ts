// lib/gamesId.ts
export function getUsername(user: any): string {
  return (
    user?.username ||
    user?.displayName ||
    user?.email?.address ||   
    user?.email ||            
    'anonymous'
  );
}

export function getAddress(user: any): string | undefined {
  const acc = user?.linkedAccounts?.find(
    (a: any) => a.type === 'cross_app' || a.type === 'wallet'
  );
  return acc?.address;
}
