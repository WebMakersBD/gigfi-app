import React from 'react';
import { Wallet } from 'lucide-react';
import { useWalletStore } from '../lib/store';
import { formatEther } from 'viem';

export const WalletConnect = () => {
  const { isConnected, address, balance, connect: connectWallet, disconnect } = useWalletStore();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formattedBalance = React.useMemo(() => {
    if (!balance) return '0';
    return parseFloat(formatEther(BigInt(balance))).toFixed(4);
  }, [balance]);

  const handleConnect = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      try {
        await connectWallet();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };

  return (
    <div className="flex items-center gap-4">
      {isConnected && (
        <div className="text-white text-sm hidden md:block">
          <span className="text-gray-400">Balance:</span> {formattedBalance} ETH
        </div>
      )}
      <button
        onClick={handleConnect}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <Wallet className="w-5 h-5" />
        <span>
          {isConnected ? formatAddress(address!) : 'Connect Wallet'}
        </span>
      </button>
    </div>
  );
};