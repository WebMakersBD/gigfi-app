import { publicClient } from './contracts';
import { GIGFI_TOKEN_ADDRESS } from './constants';

interface HealthCheck {
  status: 'ok' | 'error';
  timestamp: number;
  details?: string;
}

interface HealthStatus {
  status: 'ok' | 'error';
  checks: {
    blockchain: HealthCheck;
    contracts: HealthCheck;
    api: HealthCheck;
  };
  timestamp: number;
}

// Check blockchain connection
async function checkBlockchain(): Promise<HealthCheck> {
  try {
    const blockNumber = await publicClient.getBlockNumber();
    return {
      status: 'ok',
      timestamp: Date.now(),
      details: `Current block: ${blockNumber}`
    };
  } catch (error) {
    return {
      status: 'error',
      timestamp: Date.now(),
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Check smart contract status
async function checkContracts(): Promise<HealthCheck> {
  try {
    const code = await publicClient.getBytecode({ address: GIGFI_TOKEN_ADDRESS });
    if (!code) {
      throw new Error('Contract not deployed');
    }
    return {
      status: 'ok',
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      status: 'error',
      timestamp: Date.now(),
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Check API endpoints
async function checkApi(): Promise<HealthCheck> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/ping');
    if (!response.ok) {
      throw new Error('API not responding');
    }
    return {
      status: 'ok',
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      status: 'error',
      timestamp: Date.now(),
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Comprehensive health check
export async function healthCheck(): Promise<HealthStatus> {
  const [blockchain, contracts, api] = await Promise.all([
    checkBlockchain(),
    checkContracts(),
    checkApi()
  ]);

  return {
    status: blockchain.status === 'ok' && 
            contracts.status === 'ok' && 
            api.status === 'ok' ? 'ok' : 'error',
    checks: {
      blockchain,
      contracts,
      api
    },
    timestamp: Date.now()
  };
}