import React, { useState } from 'react';
import { CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import { useWalletStore } from '../lib/store';

interface CryptoAdvanceProps {
  className?: string;
}

export const CryptoAdvance: React.FC<CryptoAdvanceProps> = ({ className }) => {
  const [isApplying, setIsApplying] = useState(false);
  const { isConnected, connect, usdcBalance } = useWalletStore();

  const handleApply = async () => {
    if (!isConnected) {
      try {
        await connect();
        return;
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        return;
      }
    }

    setIsApplying(true);
    try {
      // Implement loan application logic here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay
      // Show success message or redirect to application form
    } catch (error) {
      console.error('Failed to apply for advance:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const eligibleAmount = parseFloat(usdcBalance) * 0.8; // 80% of USDC balance

  return (
    <div className={`bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-6 h-6 text-blue-300" />
        <h3 className="text-xl font-semibold text-white">GigCoin Crypto Advance</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-white font-medium">Available Credit</span>
          </div>
          <div className="text-2xl font-bold text-white">
            ${eligibleAmount.toFixed(2)}
          </div>
          <p className="text-blue-200 text-sm">
            Based on your staked USDC balance
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-200">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Quick approval process</span>
          </div>
          <div className="flex items-center gap-2 text-blue-200">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">No credit check required</span>
          </div>
          <div className="flex items-center gap-2 text-blue-200">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Competitive interest rates</span>
          </div>
        </div>

        <button
          onClick={handleApply}
          disabled={isApplying || (isConnected && eligibleAmount <= 0)}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isApplying ? 'Processing...' : isConnected ? 
            eligibleAmount <= 0 ? 'Insufficient Balance' : 'Apply Now' : 
            'Connect Wallet to Apply'}
        </button>

        {isConnected && eligibleAmount <= 0 && (
          <p className="text-sm text-blue-200 text-center">
            Stake USDC to become eligible for a crypto advance
          </p>
        )}
      </div>
    </div>
  );
};