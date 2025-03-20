import { useState } from 'react';
import { parseUnits } from 'viem';
import { getContract } from '../lib/thirdweb';
import { useWalletStore } from '../lib/store';
import { GIGFI_TOKEN_ADDRESS } from '../lib/constants';

export const useGigCoinPurchase = () => {
  const [isApproving, setIsApproving] = useState(false);
  const [isPurchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateBalance, address, connect } = useWalletStore();

  const purchaseGigCoin = async (amount: string) => {
    if (!address) {
      try {
        await connect();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw new Error('Please connect your wallet first');
      }
    }

    if (!GIGFI_TOKEN_ADDRESS) {
      throw new Error('GigFi token address not configured');
    }

    setError(null);
    
    try {
      // Get contract instance
      const contract = await getContract(GIGFI_TOKEN_ADDRESS);
      if (!contract) {
        throw new Error('Failed to get contract instance');
      }

      // Convert amount to ETH value
      const value = parseUnits(amount, 18);

      // Execute the purchase using buyTokens function
      setPurchasing(true);
      const tx = await contract.call('buyTokens', [], {
        value: value.toString(),
        from: address
      });

      // Wait for transaction confirmation
      await tx.receipt;
      
      // Update balances
      await updateBalance();

    } catch (error) {
      console.error('Purchase failed:', error);
      setError(error instanceof Error ? error.message : 'Purchase failed');
      throw error;
    } finally {
      setIsApproving(false);
      setPurchasing(false);
    }
  };

  return {
    purchaseGigCoin,
    isApproving,
    isPurchasing,
    error
  };
};

export default useGigCoinPurchase;