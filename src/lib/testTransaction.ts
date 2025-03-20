import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { parseUnits, formatUnits } from "viem";
import { getContract } from './thirdweb';
import { GIGFI_TOKEN_ADDRESS } from './constants';
import { gasOptimizer } from './gasOptimizer';
import { publicClient } from './contracts';

interface TransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  gasUsed?: bigint;
  balanceChange?: {
    before: string;
    after: string;
  };
  events?: {
    name: string;
    data: any;
  }[];
}

export async function testGigCoinPurchase(
  amount: string,
  paymentMethod: 'ETH' | 'USDC' = 'ETH'
): Promise<TransactionResult> {
  try {
    // Get contract instance
    const contract = await getContract(GIGFI_TOKEN_ADDRESS);
    if (!contract) {
      throw new Error('Failed to get contract instance');
    }

    // Get connected account
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (!accounts?.[0]) {
      throw new Error('No account connected');
    }

    // Get initial balance
    const initialBalance = await contract.erc20.balanceOf(accounts[0]);

    // Prepare transaction parameters
    const value = parseUnits(amount, paymentMethod === 'ETH' ? 18 : 6);

    // Execute transaction using appropriate method
    const tx = await (paymentMethod === 'ETH' 
      ? contract.erc20.mint(value)
      : contract.erc20.mintWithToken(GIGFI_TOKEN_ADDRESS, value));

    // Wait for transaction confirmation
    const receipt = await tx.receipt;

    // Get final balance
    const finalBalance = await contract.erc20.balanceOf(accounts[0]);

    // Parse events
    const events = receipt.logs.map(log => {
      try {
        const event = contract.abi.parseLog(log);
        return {
          name: event.name,
          data: event.args
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    return {
      success: true,
      transactionHash: receipt.transactionHash,
      gasUsed: receipt.gasUsed,
      balanceChange: {
        before: formatUnits(initialBalance, 18),
        after: formatUnits(finalBalance, 18)
      },
      events: events as { name: string; data: any }[]
    };

  } catch (error) {
    console.error('Purchase test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function verifyPurchaseTransaction(
  transactionHash: string
): Promise<{
  valid: boolean;
  details: {
    blockNumber: number;
    timestamp: string;
    from: string;
    to: string;
    value: string;
    gasUsed: string;
    status: 'success' | 'failed';
    events: {
      name: string;
      data: any;
    }[];
  };
}> {
  try {
    const contract = await getContract(GIGFI_TOKEN_ADDRESS);
    
    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: transactionHash as `0x${string}`
    });

    // Get transaction
    const tx = await publicClient.getTransaction({
      hash: transactionHash as `0x${string}`
    });

    // Get block
    const block = await publicClient.getBlock({
      blockHash: receipt.blockHash
    });

    // Parse events using ThirdWeb contract
    const events = receipt.logs.map(log => {
      try {
        const event = contract.abi.parseLog(log);
        return {
          name: event.name,
          data: event.args
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    return {
      valid: true,
      details: {
        blockNumber: Number(receipt.blockNumber),
        timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
        from: tx.from,
        to: tx.to || '',
        value: formatUnits(tx.value, 18),
        gasUsed: formatUnits(receipt.gasUsed, 9),
        status: receipt.status === 'success' ? 'success' : 'failed',
        events: events as { name: string; data: any }[]
      }
    };

  } catch (error) {
    console.error('Transaction verification failed:', error);
    throw error;
  }
}