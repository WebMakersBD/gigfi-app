import { useState, useEffect } from 'react';
import { publicClient } from '../lib/contracts';
import { GIGFI_CORE_CONTRACT } from '../contracts/GigFiCore';
import { ListingType } from '../types/marketplace';
import { formatUnits } from 'viem';

export const useListings = () => {
  const [listings, setListings] = useState<ListingType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, we would fetch the total number of listings
      // and then fetch each listing's details in batches
      const listingCount = await publicClient.readContract({
        address: GIGFI_CORE_CONTRACT,
        abi: [{
          name: 'getListingCount',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ type: 'uint256' }]
        }],
        functionName: 'getListingCount'
      });

      const fetchedListings: ListingType[] = [];
      for (let i = 1; i <= Number(listingCount); i++) {
        const listing = await publicClient.readContract({
          address: GIGFI_CORE_CONTRACT,
          abi: [{
            name: 'getListingDetails',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ type: 'uint256' }],
            outputs: [{
              type: 'tuple',
              components: [
                { name: 'id', type: 'uint256' },
                { name: 'name', type: 'string' },
                { name: 'description', type: 'string' },
                { name: 'price', type: 'uint256' },
                { name: 'gigPrice', type: 'uint256' },
                { name: 'seller', type: 'address' },
                { name: 'buyer', type: 'address' },
                { name: 'status', type: 'uint8' },
                { name: 'metadata', type: 'string' }
              ]
            }]
          }],
          functionName: 'getListingDetails',
          args: [BigInt(i)]
        });

        const metadata = JSON.parse(listing[8]);
        fetchedListings.push({
          id: Number(listing[0]),
          name: listing[1],
          description: listing[2],
          price: Number(formatUnits(listing[3], 6)), // USDC has 6 decimals
          gigCoinPrice: Number(formatUnits(listing[4], 18)), // GigCoin has 18 decimals
          type: metadata.type,
          distance: metadata.distance,
          tags: metadata.tags,
          image: metadata.image
        });
      }

      setListings(fetchedListings);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  return {
    listings,
    isLoading,
    refreshListings: fetchListings
  };
};