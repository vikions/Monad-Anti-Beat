'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import type { LoginMethodOrderOption } from '@privy-io/react-auth';

export default function Providers({ children }: { children: React.ReactNode }) {
  const cross = process.env.NEXT_PUBLIC_MONAD_CROSS_APP_ID!;
  // Специальный метод авторизации для MGID — приводим к типу LoginMethodOrderOption
  const mgidMethod = (`privy:${cross}` as unknown) as LoginMethodOrderOption;

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        // ВАЖНО: сначала показываем вход через Monad Games ID
        loginMethodsAndOrder: {
          primary: [mgidMethod],
          // опционально — запасной способ (обычная почта)
          overflow: ['email'],
        },

        // Автосоздание embedded-кошелька
        embeddedWallets: { createOnLogin: 'users-without-wallets' },

        appearance: {
          theme: 'dark',
          accentColor: '#7c3aed',
          // при желании можно задать логотип модалки:
          // logo: 'https://<твой-публичный-url>/logo.png',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
