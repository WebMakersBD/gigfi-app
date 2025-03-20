import { createConfig, http } from '@wagmi/core';
import { mainnet } from '@wagmi/core/chains';
import { injected } from '@wagmi/connectors';

export const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected()
  ],
  transports: {
    [mainnet.id]: http()
  }
});

// USDC contract address on mainnet
export const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

// Mock GigCoin contract address (would be deployed contract address in production)
export const GIGCOIN_ADDRESS = '0x1234567890123456789012345678901234567890';