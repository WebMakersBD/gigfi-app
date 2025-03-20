import { publicClient } from './contracts';
import { GIGFI_TOKEN_ADDRESS, GIGFI_CORE_ADDRESS, GIGFI_STAKING_ADDRESS, GIGFI_SHARE_NFT_ADDRESS } from './constants';
import { GigCoinABI } from '../contracts/GigCoin';
import { GigFiCoreABI } from '../contracts/GigFiCore';
import { GigFiStakingABI } from '../contracts/GigFiStaking';
import { GigFiShareNFTABI } from '../contracts/GigFiShareNFT';
import { getContract } from './thirdweb';

interface ContractStatus {
  address: string;
  deployed: boolean;
  bytecode: string | null;
  error?: string;
  verified?: boolean;
  implementation?: string;
  metadata?: {
    name: string;
    version: string;
    license: string;
  };
}

export async function verifyContractDeployment(): Promise<{
  success: boolean;
  contracts: Record<string, ContractStatus>;
}> {
  const contracts = {
    GigFiToken: {
      address: GIGFI_TOKEN_ADDRESS,
      abi: GigCoinABI
    },
    GigFiCore: {
      address: GIGFI_CORE_ADDRESS,
      abi: GigFiCoreABI
    },
    GigFiStaking: {
      address: GIGFI_STAKING_ADDRESS,
      abi: GigFiStakingABI
    },
    GigFiShareNFT: {
      address: GIGFI_SHARE_NFT_ADDRESS,
      abi: GigFiShareNFTABI
    }
  };

  const results: Record<string, ContractStatus> = {};
  let allDeployed = true;

  for (const [name, contract] of Object.entries(contracts)) {
    try {
      // Validate address format
      if (!contract.address || !/^0x[a-fA-F0-9]{40}$/.test(contract.address)) {
        throw new Error('Invalid contract address format');
      }

      // Get contract bytecode
      const bytecode = await publicClient.getBytecode({
        address: contract.address as `0x${string}`
      });

      // Check if contract is deployed
      const deployed = bytecode !== null && bytecode !== '0x';

      results[name] = {
        address: contract.address,
        deployed,
        bytecode: bytecode || null,
        verified: false
      };

      if (!deployed) {
        allDeployed = false;
        results[name].error = 'Contract not deployed';
        continue;
      }

      // Verify contract interface
      try {
        // Try to get contract using ThirdWeb first
        const thirdwebContract = await getContract(contract.address);
        
        // Then verify interface using direct calls
        const [name, symbol, decimals] = await Promise.all([
          publicClient.readContract({
            address: contract.address as `0x${string}`,
            abi: contract.abi,
            functionName: 'name'
          }).catch(() => null),
          publicClient.readContract({
            address: contract.address as `0x${string}`,
            abi: contract.abi,
            functionName: 'symbol'
          }).catch(() => null),
          publicClient.readContract({
            address: contract.address as `0x${string}`,
            abi: contract.abi,
            functionName: 'decimals'
          }).catch(() => null)
        ]);

        const hasValidInterface = name && symbol && decimals !== null;
        results[name].verified = hasValidInterface;
        
        if (hasValidInterface) {
          results[name].metadata = {
            name: name as string,
            version: '1.0.0',
            license: 'MIT'
          };
        }

      } catch (error) {
        results[name].error = error instanceof Error ? error.message : 'Contract verification failed';
        allDeployed = false;
      }

    } catch (error) {
      results[name] = {
        address: contract.address,
        deployed: false,
        bytecode: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        verified: false
      };
      allDeployed = false;
    }
  }

  return {
    success: allDeployed,
    contracts: results
  };
}

export async function verifyBeforeTransaction(contractAddress: string): Promise<boolean> {
  try {
    // Basic address validation
    if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      throw new Error('Invalid contract address');
    }

    // Try to get contract using both ThirdWeb and direct calls
    const contract = await getContract(contractAddress);
    
    // Verify contract interface using basic queries
    const [name, symbol, decimals] = await Promise.all([
      publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: GigCoinABI,
        functionName: 'name'
      }).catch(() => null),
      publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: GigCoinABI,
        functionName: 'symbol'
      }).catch(() => null),
      publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: GigCoinABI,
        functionName: 'decimals'
      }).catch(() => null)
    ]);

    return name !== null && symbol !== null && decimals !== null;
  } catch (error) {
    console.error('Contract verification failed:', error);
    throw error;
  }
}