import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { createThirdwebClient, type ThirdwebClient } from "thirdweb";
import { Ethereum } from "@thirdweb-dev/chains";
import { publicClient } from './contracts';
import { GigCoinABI } from '../contracts/GigCoin';

// Multiple RPC endpoints for redundancy
const RPC_ENDPOINTS = [
  "https://eth.llamarpc.com",
  "https://rpc.ankr.com/eth",
  "https://ethereum.publicnode.com",
  "https://1.rpc.thirdweb.com/$AcrbfQQqxhJDUHbniqFt3MRBtZI_EAj81dgF60uu6eTW8womOX2S0_SWglwbX1IZW5lze_HbtC7VtcxJtdY70g"
];

let thirdwebClient: ThirdwebClient | null = null;
let sdk: ThirdwebSDK | null = null;
let currentRpcIndex = 0;

async function testRpcConnection(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1
      })
    });
    const data = await response.json();
    return data.result === '0x1'; // Mainnet chainId
  } catch {
    return false;
  }
}

async function getWorkingRpcUrl(): Promise<string> {
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    const index = (currentRpcIndex + i) % RPC_ENDPOINTS.length;
    if (await testRpcConnection(RPC_ENDPOINTS[index])) {
      currentRpcIndex = index;
      return RPC_ENDPOINTS[index];
    }
  }
  throw new Error('No working RPC endpoint found');
}

async function initializeThirdweb() {
  if (!thirdwebClient) {
    try {
      // Get a working RPC URL
      const rpcUrl = await getWorkingRpcUrl();

      // Initialize client with explicit chain configuration
      thirdwebClient = createThirdwebClient({
        clientId: process.env.THIRDWEB_CLIENT_ID || "0bb7991cbf006eb376680b87d17e99c8",
        chains: [Ethereum],
        chainRpc: {
          1: rpcUrl
        },
        retryConfig: {
          maxRetries: 3,
          retryDelay: 1000
        }
      });

      // Initialize SDK with explicit chain configuration
      sdk = new ThirdwebSDK(Ethereum, {
        clientId: process.env.THIRDWEB_CLIENT_ID || "0bb7991cbf006eb376680b87d17e99c8",
        secretKey: process.env.THIRDWEB_API_KEY,
        readonlySettings: {
          rpcUrl,
          chainId: 1,
          maxRetries: 3,
          retryDelay: 1000
        }
      });

      // Verify network connection
      const chainId = await publicClient.getChainId();
      if (chainId !== 1) {
        throw new Error('Connected to wrong network');
      }

      console.log('ThirdWeb client and SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ThirdWeb:', error);
      throw error;
    }
  }
  return { client: thirdwebClient, sdk };
}

async function getSDK(): Promise<ThirdwebSDK> {
  if (!sdk) {
    const { sdk: newSdk } = await initializeThirdweb();
    if (!newSdk) throw new Error('Failed to initialize SDK');
    sdk = newSdk;
  }
  return sdk;
}

async function getContract(address: string) {
  try {
    // Validate contract address
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error('Invalid contract address');
    }

    // Ensure SDK is initialized
    if (!sdk) {
      await initializeThirdweb();
    }
    if (!sdk) throw new Error('SDK not initialized');

    // First try to get contract using direct calls
    const [name, symbol, decimals] = await Promise.all([
      publicClient.readContract({
        address: address as `0x${string}`,
        abi: GigCoinABI,
        functionName: 'name'
      }).catch(() => null),
      publicClient.readContract({
        address: address as `0x${string}`,
        abi: GigCoinABI,
        functionName: 'symbol'
      }).catch(() => null),
      publicClient.readContract({
        address: address as `0x${string}`,
        abi: GigCoinABI,
        functionName: 'decimals'
      }).catch(() => null)
    ]);

    // Get ThirdWeb contract instance
    const contract = await sdk.getContract(address);
    if (!contract) {
      throw new Error('Failed to get contract instance');
    }

    // Create a hybrid contract that combines ThirdWeb and direct call capabilities
    return {
      ...contract,
      // Override with our own ERC20 implementation
      erc20: {
        name: async () => name as string,
        symbol: async () => symbol as string,
        decimals: async () => decimals as number,
        balanceOf: async (account: string) => {
          return publicClient.readContract({
            address: address as `0x${string}`,
            abi: GigCoinABI,
            functionName: 'balanceOf',
            args: [account as `0x${string}`]
          });
        },
        allowance: async (owner: string, spender: string) => {
          return publicClient.readContract({
            address: address as `0x${string}`,
            abi: GigCoinABI,
            functionName: 'allowance',
            args: [owner as `0x${string}`, spender as `0x${string}`]
          });
        },
        // Keep ThirdWeb's write functions for transactions
        transfer: contract.erc20.transfer,
        approve: contract.erc20.approve,
        // Add custom functions
        mint: contract.erc20.mint,
        burn: contract.erc20.burn
      }
    };

  } catch (error) {
    console.error('Failed to get contract:', error);
    throw error;
  }
}

async function getTokenBalance(tokenAddress: string, walletAddress: string) {
  try {
    return publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: GigCoinABI,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`]
    });
  } catch (error) {
    console.error('Failed to get token balance:', error);
    return BigInt(0);
  }
}

export {
  thirdwebClient,
  initializeThirdweb,
  getSDK,
  getContract,
  getTokenBalance
};