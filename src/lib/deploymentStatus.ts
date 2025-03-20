import { publicClient } from './contracts';
import { verifyContractDeployment } from './verify';
import { GIGFI_TOKEN_ADDRESS } from './constants';
import { GigCoinABI } from '../contracts/GigCoin';

interface DeploymentStatus {
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  contracts?: Record<string, {
    address: string;
    deployed: boolean;
    verified: boolean;
    bytecodeVerified: boolean;
    interfaceVerified: boolean;
    implementation?: string;
    error?: string;
    details?: {
      name?: string;
      symbol?: string;
      decimals?: number;
      totalSupply?: string;
    };
  }>;
  error?: string;
}

let cachedStatus: DeploymentStatus | null = null;

export async function getDeploymentStatus(): Promise<DeploymentStatus> {
  if (cachedStatus) {
    return cachedStatus;
  }

  try {
    // Verify contract deployment
    const verification = await verifyContractDeployment();
    
    if (!verification.success) {
      cachedStatus = {
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: 'Contract verification failed'
      };
      return cachedStatus;
    }

    // Perform detailed verification of GigFi Token contract
    const tokenStatus = await verifyGigFiToken();
    
    cachedStatus = {
      status: tokenStatus.success ? 'success' : 'failed',
      timestamp: new Date().toISOString(),
      contracts: {
        GigFiToken: tokenStatus
      }
    };

    return cachedStatus;
  } catch (error) {
    console.error('Failed to get deployment status:', error);
    return {
      status: 'failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function verifyGigFiToken() {
  try {
    // Verify bytecode exists
    const bytecode = await publicClient.getBytecode({
      address: GIGFI_TOKEN_ADDRESS
    });

    const bytecodeVerified = bytecode !== null && bytecode !== '0x';

    // Verify contract interface by calling view functions
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      publicClient.readContract({
        address: GIGFI_TOKEN_ADDRESS,
        abi: GigCoinABI,
        functionName: 'name'
      }).catch(() => null),
      publicClient.readContract({
        address: GIGFI_TOKEN_ADDRESS,
        abi: GigCoinABI,
        functionName: 'symbol'
      }).catch(() => null),
      publicClient.readContract({
        address: GIGFI_TOKEN_ADDRESS,
        abi: GigCoinABI,
        functionName: 'decimals'
      }).catch(() => null),
      publicClient.readContract({
        address: GIGFI_TOKEN_ADDRESS,
        abi: GigCoinABI,
        functionName: 'totalSupply'
      }).catch(() => null)
    ]);

    const interfaceVerified = name !== null && symbol !== null && decimals !== null && totalSupply !== null;

    return {
      address: GIGFI_TOKEN_ADDRESS,
      deployed: bytecodeVerified,
      verified: bytecodeVerified && interfaceVerified,
      bytecodeVerified,
      interfaceVerified,
      details: {
        name: name as string,
        symbol: symbol as string,
        decimals: decimals as number,
        totalSupply: totalSupply?.toString()
      }
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return {
      address: GIGFI_TOKEN_ADDRESS,
      deployed: false,
      verified: false,
      bytecodeVerified: false,
      interfaceVerified: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export function clearDeploymentStatusCache() {
  cachedStatus = null;
}