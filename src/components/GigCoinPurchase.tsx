import React, { useState } from 'react';
import useGigCoinPurchase from '../hooks/useGigCoinPurchase';
import { useWalletStore } from '../lib/store';
import { AlertCircle, DollarSign } from 'lucide-react';
import { GasFees } from './GasFees';

export const GigCoinPurchase = () => {
  const [amount, setAmount] = useState('');
  const [maxGasFee, setMaxGasFee] = useState<bigint>(0n);
  const { purchaseGigCoin, isApproving, isPurchasing, error } = useGigCoinPurchase();
  const { isConnected, address, connect, usdcBalance } = useWalletStore();

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      try {
        await connect();
        return;
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        return;
      }
    }

    try {
      await purchaseGigCoin(amount);
      setAmount('');
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  const estimatedGigCoins = parseFloat(amount || '0') * 100; // 1 USDC = 100 GigCoins

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">Buy GigCoin</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handlePurchase} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">
            USDC Amount
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          <p className="mt-1 text-sm text-gray-400">
            Available: {usdcBalance} USDC
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">You'll receive:</span>
            <span className="text-lg font-semibold text-white">
              {estimatedGigCoins.toFixed(2)} GIG
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Rate: 1 USDC = 100 GIG
          </p>
        </div>

        {amount && <GasFees amount={amount} onMaxFeeUpdate={setMaxGasFee} />}

        <button
          type="submit"
          disabled={isApproving || isPurchasing || !amount || parseFloat(amount) <= 0}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {!isConnected ? 'Connect Wallet' :
           isApproving ? 'Approving USDC...' :
           isPurchasing ? 'Purchasing...' :
           'Buy GigCoin'}
        </button>
      </form>
    </div>
  );
};