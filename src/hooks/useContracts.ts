import { useState } from 'react';
import { contracts } from '../lib/contracts';
import { parseUnits, formatUnits } from 'viem';
import { useWalletStore } from '../lib/store';

export const useContracts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { updateBalance } = useWalletStore();

  const handleTransaction = async <T,>(
    operation: () => Promise<T>,
    successMessage?: string
  ): Promise<T> => {
    setIsLoading(true);
    try {
      const result = await operation();
      await updateBalance();
      if (successMessage) {
        console.log(successMessage);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createListing: async (params: {
      name: string;
      description: string;
      price: number;
      gigPrice: number;
      metadata: string;
    }) => {
      return handleTransaction(
        async () => {
          const hash = await contracts.createListing({
            ...params,
            price: parseUnits(params.price.toString(), 6), // USDC has 6 decimals
            gigPrice: parseUnits(params.gigPrice.toString(), 18), // GigCoin has 18 decimals
            metadata: params.metadata
          });
          return hash;
        },
        'Listing created successfully'
      );
    },

    buyListing: async (listingId: number, useGigCoin: boolean) => {
      return handleTransaction(
        async () => {
          const hash = await contracts.buyListing(BigInt(listingId), useGigCoin);
          return hash;
        },
        'Listing purchased successfully'
      );
    },

    stake: async (amount: string, token: string) => {
      return handleTransaction(
        async () => {
          const decimals = token === 'USDC' ? 6 : 18;
          const hash = await contracts.stake(
            parseUnits(amount, decimals),
            token
          );
          return hash;
        },
        'Tokens staked successfully'
      );
    },

    unstake: async (positionId: number) => {
      return handleTransaction(
        async () => {
          const hash = await contracts.unstake(BigInt(positionId));
          return hash;
        },
        'Tokens unstaked successfully'
      );
    },

    updatePensionContribution: async (percentage: number) => {
      return handleTransaction(
        async () => {
          const hash = await contracts.setPensionContribution(BigInt(percentage));
          return hash;
        },
        'Pension contribution updated successfully'
      );
    },

    buyShares: async (amount: number) => {
      return handleTransaction(
        async () => {
          const hash = await contracts.buyShares(BigInt(amount));
          return hash;
        },
        'NFT shares purchased successfully'
      );
    }
  };
};