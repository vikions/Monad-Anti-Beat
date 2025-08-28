// lib/monad.ts
export const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [process.env.MONAD_RPC_URL!] } },
  blockExplorers: {
    default: { name: 'MonVision', url: 'https://testnet.monadexplorer.com' },
  },
} as const;
