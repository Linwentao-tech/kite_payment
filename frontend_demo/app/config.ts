import { http, createConfig } from 'wagmi'
import { base, mainnet } from 'wagmi/chains'
import { defineChain } from 'viem'
import { injected, safe, walletConnect } from 'wagmi/connectors'

const kiteTestnet = defineChain({
  id: 2368,
  name: 'KiteAI Testnet',
  nativeCurrency: {
    name: 'KITE',
    symbol: 'KITE',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc-testnet.gokite.ai/'] },
    public: { http: ['https://rpc-testnet.gokite.ai/'] },
  },
  blockExplorers: {
    default: { name: 'KiteScan', url: 'https://testnet.kitescan.ai/' },
  },
})

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ''

export const config = createConfig({
  chains: [kiteTestnet, mainnet, base],
  connectors: [
    injected(),
    walletConnect({ projectId }),
    safe(),
  ],
  transports: {
    [kiteTestnet.id]: http(),
    [mainnet.id]: http(),
    [base.id]: http(),
  },
})
