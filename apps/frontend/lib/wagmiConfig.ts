import { type Config, createConfig, http, injected } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';

export const config: Config = createConfig({
  chains: [sepolia],
  connectors: [
    metaMask(),
    injected(),
  ],
  transports: {
    [sepolia.id]: http(),
  },
  ssr: true,
});
