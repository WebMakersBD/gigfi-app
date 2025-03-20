import React from 'react';
import { Header } from '../components/Header';
import { DashboardCard } from '../components/DashboardCard';
import { ProgressBar } from '../components/ProgressBar';
import { Pick4Game } from '../components/Pick4Game';
import { ContractVerification } from '../components/ContractVerification';
import { Lightbulb, Wallet, ArrowUpRight } from 'lucide-react';
import { useWalletStore } from '../lib/store';

export function Dashboard() {
  const { usdcBalance, isConnected } = useWalletStore();

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Balance Overview */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Balance Overview</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <p className="text-gray-400 mb-1">USDC Balance</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">
                ${isConnected ? usdcBalance : '0.00'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Estimated Value</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">
                ${isConnected ? (parseFloat(usdcBalance) * 1.04).toFixed(2) : '0.00'}
              </p>
              <div className="flex items-center gap-1 text-sm text-green-400">
                <ArrowUpRight className="w-4 h-4" />
                <span>+4% APY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Verification */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
          <ContractVerification />
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <button 
            onClick={() => window.location.href = '/income'}
            className="w-full bg-green-500 text-white py-3 sm:py-4 rounded-lg text-lg sm:text-xl font-medium hover:bg-green-600 transition-colors"
          >
            Store USDC Now – Earn 4% APY!
          </button>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-gray-400 text-sm font-medium mb-4">Investment Progress</h3>
            <ProgressBar current={parseFloat(usdcBalance)} target={1000} />
            <p className="text-center text-gray-400 text-sm mt-2">
              Target: $1,000 USDC
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DashboardCard 
            title="Total Earnings" 
            value={`$${isConnected ? usdcBalance : '0.00'}`}
            showTrend 
          />
          <DashboardCard 
            title="APY Returns" 
            value={`$${isConnected ? (parseFloat(usdcBalance) * 0.04).toFixed(2) : '0.00'}`}
            showTrend 
          />
        </div>

        {/* AI Tip */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h3 className="font-medium text-white">AI Investment Tip</h3>
          </div>
          <p className="text-gray-300">
            {parseFloat(usdcBalance) > 0 
              ? "Consider increasing your USDC holdings to maximize your APY earnings. The more you store, the more you earn!"
              : "Start by storing some USDC to earn a guaranteed 4% APY on your funds. It's a safe way to grow your money!"}
          </p>
        </div>

        {/* Games Section */}
        <Pick4Game />
      </div>
    </div>
  );
}