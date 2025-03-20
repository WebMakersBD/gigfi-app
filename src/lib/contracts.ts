import { createPublicClient, http, createWalletClient, custom, parseUnits, formatUnits } from 'viem';
import { mainnet } from 'viem/chains';
import { GigFiCoreABI, GIGFI_CORE_ADDRESS } from '../contracts/GigFiCore';
import { USDCABI, GigCoinABI } from '../contracts/GigCoin';
import { GigFiShareNFTABI } from '../contracts/GigFiShareNFT';
import { captureError } from './sentry';
import {
  USDC_ADDRESS,
  GIGFI_TOKEN_ADDRESS,
  GIGFI_STAKING_ADDRESS,
  GIGFI_SHARE_NFT_ADDRESS,
  RPC_CONFIG
} from './constants';

// Initialize public client for read operations with improved error handling and retry logic
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(RPC_CONFIG.urls[0], {
    retryCount: RPC_CONFIG.retryCount,
    retryDelay: RPC_CONFIG.retryDelay,
    timeout: RPC_CONFIG.timeout,
    batch: RPC_CONFIG.batch,
    headers: RPC_CONFIG.headers,
    onResponse: (response) => {
      if (!response.ok) {
        console.error('RPC request failed:', response.statusText);
        captureError(new Error(`RPC request failed: ${response.statusText}`));
      }
    },
    onRetry: (attempt, error) => {
      console.warn(`RPC request attempt ${attempt} failed:`, error);
      // Switch to next RPC URL if available
      if (attempt < RPC_CONFIG.urls.length) {
        publicClient.transport = http(RPC_CONFIG.urls[attempt]);
      }
    }
  }),
  batch: {
    multicall: {
      batchSize: 1024,
      wait: 100
    }
  },
  pollingInterval: 4000,
  cacheTime: 5000
});

// Initialize wallet client for write operations with improved error handling
const getWalletClient = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask not installed');
  }

  try {
    const client = createWalletClient({
      chain: mainnet,
      transport: custom(window.ethereum)
    });

    // Verify network connection
    const chainId = await client.getChainId();
    if (chainId !== mainnet.id) {
      throw new Error('Please connect to Ethereum Mainnet');
    }

    const [address] = await client.getAddresses();
    if (!address) {
      throw new Error('No account connected');
    }

    return { client, account: address };
  } catch (error) {
    console.error('Failed to initialize wallet client:', error);
    throw error;
  }
};

// Contract interaction helpers with improved error handling and gas optimization
const contracts = {
  // Token functions
  async approveToken(
    token: 'USDC' | 'GIGFI',
    spender: string,
    amount: bigint,
    gasConfig?: {
      maxFeePerGas: bigint;
      maxPriorityFeePerGas: bigint;
      gasLimit: bigint;
    }
  ) {
    try {
      const { client, account } = await getWalletClient();
      
      if (!spender || !/^0x[a-fA-F0-9]{40}$/.test(spender)) {
        throw new Error('Invalid spender address');
      }

      const tokenAddress = token === 'USDC' ? USDC_ADDRESS : GIGFI_TOKEN_ADDRESS;
      const abi = token === 'USDC' ? USDCABI : GigCoinABI;

      // Check current allowance first
      const allowance = await publicClient.readContract({
        address: tokenAddress,
        abi,
        functionName: 'allowance',
        args: [account, spender]
      });

      // If allowance is sufficient, no need to approve
      if (allowance >= amount) {
        return null;
      }

      const hash = await client.writeContract({
        address: tokenAddress,
        abi,
        functionName: 'approve',
        args: [spender, amount],
        account,
        ...gasConfig
      });
      
      // Wait for transaction confirmation with timeout
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 60_000,
        confirmations: 1
      });

      return hash;
    } catch (error) {
      console.error('Approval error:', error);
      throw error;
    }
  },

  // Read functions with improved error handling and caching
  async getTokenBalance(token: 'USDC' | 'GIGFI' | 'SHARES', address: string) {
    try {
      const tokenAddress = 
        token === 'USDC' ? USDC_ADDRESS :
        token === 'GIGFI' ? GIGFI_TOKEN_ADDRESS :
        GIGFI_SHARE_NFT_ADDRESS;

      const abi = 
        token === 'SHARES' ? GigFiShareNFTABI :
        token === 'USDC' ? USDCABI :
        GigCoinABI;

      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi,
        functionName: 'balanceOf',
        args: [address]
      });

      return formatUnits(balance, token === 'USDC' ? 6 : token === 'SHARES' ? 0 : 18);
    } catch (error) {
      console.error('Balance check error:', error);
      return '0';
    }
  },

  // Health check function
  async checkNetworkConnection() {
    try {
      const [blockNumber, chainId] = await Promise.all([
        publicClient.getBlockNumber(),
        publicClient.getChainId()
      ]);

      return {
        connected: true,
        chainId,
        blockNumber,
        network: chainId === 1 ? 'Ethereum Mainnet' : 'Unknown Network'
      };
    } catch (error) {
      console.error('Network connection check failed:', error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

// Export only once
export { publicClient, contracts };