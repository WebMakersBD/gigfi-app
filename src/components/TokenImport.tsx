import React from 'react';
import { PlusCircle } from 'lucide-react';
import { GIGFI_TOKEN_ADDRESS, GIGFI_SHARE_NFT_ADDRESS } from '../lib/constants';

interface TokenImportProps {
  type: 'token' | 'nft';
}

export const TokenImport: React.FC<TokenImportProps> = ({ type }) => {
  const handleImport = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const tokenAddress = type === 'token' ? GIGFI_TOKEN_ADDRESS : GIGFI_SHARE_NFT_ADDRESS;
      const tokenSymbol = type === 'token' ? 'GIG' : 'GIGS';
      const tokenDecimals = type === 'token' ? 18 : 0;

      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: type === 'token' ? 'ERC20' : 'ERC721',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: 'https://assets.reown.com/reown-profile-pic.png'
          },
        },
      });

      if (wasAdded) {
        console.log('Token was added to MetaMask');
      }
    } catch (error) {
      console.error('Failed to import token:', error);
    }
  };

  return (
    <button
      onClick={handleImport}
      className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
    >
      <PlusCircle className="w-4 h-4" />
      <span>Add to MetaMask</span>
    </button>
  );
};