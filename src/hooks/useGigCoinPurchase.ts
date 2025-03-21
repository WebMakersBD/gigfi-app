import { useState } from 'react';
import { parseUnits } from 'viem';
import { contracts } from '../lib/contracts';
import { useWalletStore } from '../lib/store';
import { GIGFI_TOKEN_ADDRESS } from '../lib/constants';
import { GigCoinABI } from '../contracts/GigCoin';

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
      // Convert amount to ETH value
      const value = parseUnits(amount, 18);

      // Execute the purchase using sendTransaction
      setPurchasing(true);
      const { receipt } = await contracts.sendTransaction({
        address: GIGFI_TOKEN_ADDRESS,
        abi: GigCoinABI,
        functionName: 'buyTokens',
        value
      });
      
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