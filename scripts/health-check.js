import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { GigCoinABI } from '../src/contracts/GigCoin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize client
const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.VITE_MAINNET_RPC_URL)
});

async function checkContractHealth(address, name) {
  try {
    // Basic checks
    console.log(`\nChecking ${name}...`);
    
    // 1. Check if address exists
    if (!address) {
      throw new Error('Contract address not found in environment variables');
    }

    // 2. Verify address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error('Invalid contract address format');
    }

    // 3. Check if contract is deployed
    const code = await client.getBytecode({ address });
    if (!code || code === '0x') {
      throw new Error('No contract code found at address');
    }

    // 4. Try to call a view function
    try {
      const result = await client.readContract({
        address,
        abi: GigCoinABI,
        functionName: 'name'
      });
      console.log(`✓ Contract name: ${result}`);
    } catch (error) {
      console.log('⚠ Warning: Could not read contract name');
    }

    console.log('✓ Contract verification passed');
    return true;
  } catch (error) {
    console.error(`✗ Contract verification failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Running contract health check...');

  const contracts = {
    GigFiToken: process.env.VITE_GIGFI_TOKEN_ADDRESS,
    GigFiCore: process.env.VITE_GIGFI_CORE_ADDRESS,
    GigFiStaking: process.env.VITE_GIGFI_STAKING_ADDRESS,
    GigFiShareNFT: process.env.VITE_GIGFI_SHARE_NFT_ADDRESS
  };

  let allHealthy = true;

  for (const [name, address] of Object.entries(contracts)) {
    const isHealthy = await checkContractHealth(address, name);
    if (!isHealthy) {
      allHealthy = false;
    }
  }

  if (!allHealthy) {
    console.log('\n⚠ Some contracts failed verification');
    process.exit(1);
  }

  console.log('\n✓ All contracts verified successfully');
}

main().catch((error) => {
  console.error('Health check failed:', error);
  process.exit(1);
});