import { parseUnits, formatUnits } from 'viem';
import { getContract } from './thirdweb';
import { GIGFI_TOKEN_ADDRESS } from './constants';
import { analyzeContractDeployment } from './deploymentAnalyzer';
import { publicClient } from './contracts';
import { GigCoinABI } from '../contracts/GigCoin';

export async function runPurchaseTest(amount: string = '0.1') {
  console.log('Starting GigCoin purchase test...\n');

  try {
    // First verify contract deployment
    console.log('Verifying contract deployment...');
    const deployment = await analyzeContractDeployment();
    
    if (!deployment.success) {
      throw new Error('Contract deployment verification failed');
    }
    console.log('Contract deployment verified ✓\n');

    // Get contract instance and verify interface
    console.log('Verifying contract interface...');
    
    // Check basic ERC20 functions using direct contract calls
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      publicClient.readContract({
        address: GIGFI_TOKEN_ADDRESS,
        abi: GigCoinABI,
        functionName: 'name'
      }),
      publicClient.readContract({
        address: GIGFI_TOKEN_ADDRESS,
        abi: GigCoinABI,
        functionName: 'symbol'
      }),
      publicClient.readContract({
        address: GIGFI_TOKEN_ADDRESS,
        abi: GigCoinABI,
        functionName: 'decimals'
      }),
      publicClient.readContract({
        address: GIGFI_TOKEN_ADDRESS,
        abi: GigCoinABI,
        functionName: 'totalSupply'
      })
    ]);

    console.log('Contract interface verified ✓');
    console.log(`Name: ${name}`);
    console.log(`Symbol: ${symbol}`);
    console.log(`Decimals: ${decimals}`);
    console.log(`Total Supply: ${formatUnits(totalSupply, decimals)}\n`);

    // Get connected account
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (!accounts?.[0]) {
      throw new Error('No account connected');
    }

    // Get initial balance
    const initialBalance = await publicClient.readContract({
      address: GIGFI_TOKEN_ADDRESS,
      abi: GigCoinABI,
      functionName: 'balanceOf',
      args: [accounts[0]]
    });

    console.log('Initial balance:', formatUnits(initialBalance, decimals));

    // Test purchase using direct contract call
    console.log(`\nTesting purchase (${amount} ETH)...`);
    const value = parseUnits(amount, 18); // ETH has 18 decimals

    const contract = await getContract(GIGFI_TOKEN_ADDRESS);
    const tx = await contract.call('buyTokens', [], {
      value: value.toString(),
      from: accounts[0]
    });

    // Wait for confirmation
    const receipt = await tx.receipt;
    console.log('Transaction confirmed ✓');
    console.log('Gas used:', receipt.gasUsed.toString());

    // Get final balance
    const finalBalance = await publicClient.readContract({
      address: GIGFI_TOKEN_ADDRESS,
      abi: GigCoinABI,
      functionName: 'balanceOf',
      args: [accounts[0]]
    });

    console.log('\nBalance after purchase:', formatUnits(finalBalance, decimals));
    console.log('Balance change:', formatUnits(finalBalance - initialBalance, decimals));

    return {
      success: true,
      transactionHash: receipt.transactionHash,
      gasUsed: receipt.gasUsed,
      balanceChange: {
        before: formatUnits(initialBalance, decimals),
        after: formatUnits(finalBalance, decimals)
      }
    };

  } catch (error) {
    console.error('\nTest failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}