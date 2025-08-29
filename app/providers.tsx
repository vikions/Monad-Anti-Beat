'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        
        loginMethods: ['email'],
        embeddedWallets: { createOnLogin: 'users-without-wallets' },
        appearance: {
          theme: 'dark',
          accentColor: '#7c3aed',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
