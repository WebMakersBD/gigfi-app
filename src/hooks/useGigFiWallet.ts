import { useState, useCallback } from 'react';
import { useWalletStore } from '../lib/store';

export const useGigFiWallet = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { usdcBalance, storeUSDC, withdrawUSDC } = useWalletStore();

  const refreshBalances = useCallback(async () => {
    try {
      await useWalletStore.getState().updateBalance();
    } catch (err) {
      console.error('Error fetching balances:', err);
    }
  }, []);

  const handleStoreUSDC = async (amount: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await storeUSDC(amount);
      await refreshBalances();
    } catch (err) {
      console.error('Error storing USDC:', err);
      if (err instanceof Error && err.message.includes('User denied')) {
        setError('Transaction was cancelled. Please try again.');
      } else {
        setError('Failed to store USDC. Please try again.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawUSDC = async (amount: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await withdrawUSDC(amount);
      await refreshBalances();
    } catch (err) {
      console.error('Error withdrawing USDC:', err);
      if (err instanceof Error && err.message.includes('User denied')) {
        setError('Transaction was cancelled. Please try again.');
      } else {
        setError('Failed to withdraw USDC. Please try again.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    usdcBalance,
    isLoading,
    error,
    refreshBalances,
    storeUSDC: handleStoreUSDC,
    withdrawUSDC: handleWithdrawUSDC
  };
};