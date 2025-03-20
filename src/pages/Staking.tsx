import React, { useState } from 'react';
import { Header } from '../components/Header';
import { TrendingUp, CreditCard, Lightbulb, DollarSign, BarChart3, AlertCircle } from 'lucide-react';
import { useWalletStore } from '../lib/store';
import { CryptoAdvance } from '../components/CryptoAdvance';

type StakingTab = 'regular' | 'pension' | 'nft';

// Mock market data for development
const MOCK_MARKET_DATA = {
  sharePrice: '1.25',
  volume24h: '125,000',
  lastDividend: '0.025'
};

export const Staking = () => {
  const [activeTab, setActiveTab] = useState<StakingTab>('regular');
  const [stakeAmount, setStakeAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [shareAmount, setShareAmount] = useState('');
  
  const {
    isConnected,
    usdcBalance,
    gigBalance,
    stakingPositions,
    pensionBalance,
    pensionContribution,
    nftShares,
    stake,
    unstake,
    updatePensionContribution,
    buyNFTShares,
    connect
  } = useWalletStore();

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      try {
        await connect();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        return;
      }
    }
    
    try {
      await stake(stakeAmount, selectedToken);
      setStakeAmount('');
    } catch (error) {
      console.error('Failed to stake:', error);
    }
  };

  const handleUnstake = async (positionId: number) => {
    try {
      await unstake(positionId);
    } catch (error) {
      console.error('Failed to unstake:', error);
    }
  };

  const handleBuyShares = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareAmount) return;
    
    try {
      await buyNFTShares(Number(shareAmount));
      setShareAmount('');
    } catch (error) {
      console.error('Failed to buy shares:', error);
    }
  };

  const renderRegularStaking = () => (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Stake Your Earnings</h2>
      
      <form onSubmit={handleStake} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-2">Amount</label>
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg text-gray-900"
            placeholder="Enter amount"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Token</label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg text-gray-900"
          >
            <option value="USDC">USDC</option>
            <option value="GigCoin">GigCoin</option>
          </select>
        </div>

        <div className="text-gray-600">Current APY: 4.00%</div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600"
        >
          {isConnected ? 'Stake' : 'Connect Wallet to Stake'}
        </button>
      </form>

      {stakingPositions.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Stakes</h3>
          <div className="space-y-4">
            {stakingPositions.map((position) => (
              <div key={position.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-gray-900">
                      {position.amount} {position.token}
                    </div>
                    <div className="text-sm text-gray-500">
                      Staked on {new Date(position.startDate).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnstake(position.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Unstake
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  APY: {position.apy}% • Rewards: {position.rewards}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CryptoAdvance className="mt-8" />
    </div>
  );

  const renderGigPension = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gig Pension</h2>
        <p className="text-gray-600">Secure your future with DeFi-powered pension savings</p>
      </div>

      <div className="bg-white rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900">Enable Gig Pension</span>
          <button
            onClick={() => updatePensionContribution(pensionContribution > 0 ? 0 : 5)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              pensionContribution > 0 ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                pensionContribution > 0 ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="font-medium text-gray-900">Contribution Percentage</span>
            <span className="text-gray-900">{pensionContribution}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={pensionContribution}
            onChange={(e) => updatePensionContribution(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 text-gray-600">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span>Current Balance</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">${pensionBalance}</div>
          <div className="text-gray-500">Growing at 4% APY</div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-gray-600">
            <CreditCard className="w-4 h-4 text-blue-500" />
            <span>Rewards</span>
          </div>
          <div className="text-gray-700">1 GigCoin Earned</div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-gray-600">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span>AI Insight</span>
          </div>
          <div className="text-gray-600">
            Save 5% more to reach $5,000 in 10 years
          </div>
        </div>

        <button 
          onClick={() => updatePensionContribution(pensionContribution)}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600"
        >
          Update Pension Settings
        </button>
      </div>
    </div>
  );

  const renderNFTStaking = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">GigFi Share NFTs</h2>
        <p className="text-gray-600">Own a piece of GigFi and earn regular dividends</p>
      </div>

      <div className="bg-white rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Market Overview
        </h3>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-gray-600 mb-1">Share Price</div>
            <div className="text-2xl font-bold text-gray-900">${MOCK_MARKET_DATA.sharePrice}</div>
          </div>
          <div>
            <div className="text-gray-600 mb-1">24h Volume</div>
            <div className="text-2xl font-bold text-gray-900">${MOCK_MARKET_DATA.volume24h}</div>
          </div>
          <div>
            <div className="text-gray-600 mb-1">Your Shares</div>
            <div className="text-2xl font-bold text-gray-900">{nftShares}</div>
          </div>
          <div>
            <div className="text-gray-600 mb-1">Last Dividend</div>
            <div className="text-2xl font-bold text-gray-900">${MOCK_MARKET_DATA.lastDividend}</div>
          </div>
        </div>

        <div>
          <h4 className="text-gray-600 mb-4">Trading Spreads</h4>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <span className="text-gray-600">Buy Spread:</span>
              <span className="ml-2 text-gray-900">2%</span>
            </div>
            <div>
              <span className="text-gray-600">Sell Spread:</span>
              <span className="ml-2 text-gray-900">1.5%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          Buy Share NFTs
        </h3>

        <form onSubmit={handleBuyShares} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2">Number of Shares</label>
            <input
              type="number"
              value={shareAmount}
              onChange={(e) => setShareAmount(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg text-gray-900"
              placeholder="Enter amount"
              min="1"
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <h4 className="text-lg font-semibold text-gray-900">Investment Overview</h4>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li>• Receive quarterly dividends based on GigFi's profit</li>
              <li>• Vote on key platform decisions</li>
              <li>• Trade shares on the open market</li>
            </ul>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600"
          >
            {isConnected ? 'Buy Share NFTs' : 'Connect Wallet to Buy'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Staking</h1>

        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <p className="text-yellow-700">
              Connect your wallet to start staking and earning rewards
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg p-2 mb-8 flex space-x-2">
          <button
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'regular' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('regular')}
          >
            Regular Staking
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'pension' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('pension')}
          >
            Gig Pension
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'nft' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('nft')}
          >
            NFT Staking
          </button>
        </div>

        {activeTab === 'regular' && renderRegularStaking()}
        {activeTab === 'pension' && renderGigPension()}
        {activeTab === 'nft' && renderNFTStaking()}
      </div>
    </div>
  );
};