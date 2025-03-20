import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import dotenv from 'dotenv';

dotenv.config();

// Initialize client
const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.VITE_MAINNET_RPC_URL)
});

async function verifyAddress(address) {
  try {
    // Check address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error('Invalid address format');
    }

    // Check if address has code
    const code = await client.getBytecode({ address });
    if (!code || code === '0x') {
      throw new Error('No contract code found at address');
    }

    return {
      success: true,
      hasCode: true,
      bytecode: code
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      hasCode: false
    };
  }
}

async function main() {
  console.log('Verifying contract deployment...\n');

  const contracts = {
    GigFiToken: process.env.VITE_GIGFI_TOKEN_ADDRESS,
    GigFiCore: process.env.VITE_GIGFI_CORE_ADDRESS,
    GigFiStaking: process.env.VITE_GIGFI_STAKING_ADDRESS,
    GigFiShareNFT: process.env.VITE_GIGFI_SHARE_NFT_ADDRESS
  };

  for (const [name, address] of Object.entries(contracts)) {
    console.log(`Verifying ${name}...`);
    const result = await verifyAddress(address);
    
    if (result.success) {
      console.log(`✓ ${name} verified at ${address}`);
      console.log(`  Bytecode length: ${(result.bytecode.length - 2) / 2} bytes\n`);
    } else {
      console.log(`✗ ${name} verification failed:`);
      console.log(`  Address: ${address}`);
      console.log(`  Error: ${result.error}\n`);
    }
  }
}

main().catch(console.error);