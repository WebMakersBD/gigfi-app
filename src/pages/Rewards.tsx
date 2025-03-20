import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Gift, Users, TrendingUp, Link as LinkIcon, Coins, ExternalLink, AlertCircle } from 'lucide-react';
import { useWalletStore } from '../lib/store';
import { useContracts } from '../hooks/useContracts';

export const Rewards = () => {
  const [isClaimingPayout, setIsClaimingPayout] = useState(false);
  const { isConnected, address, connect } = useWalletStore();
  const { isLoading } = useContracts();

  const networkMembers = [
    { name: 'John Doe', role: 'Affiliate', joinDate: '1/31/2024', referrals: 3 },
    { name: 'Jane Smith', role: 'Affiliate', joinDate: '2/14/2024', referrals: 4 },
    { name: 'Mike Johnson', role: 'Affiliate', joinDate: '2/29/2024', referrals: 5 },
    { name: 'Sarah Wilson', role: 'Advocate', joinDate: '2/9/2024', referrals: 0 },
    { name: 'Tom Brown', role: 'Advocate', joinDate: '2/19/2024', referrals: 0 },
  ];

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleCopyReferral = () => {
    const referralLink = `gigfi.eth.limo/ref/${address?.slice(2, 8)}`;
    navigator.clipboard.writeText(referralLink);
  };

  const handleClaimPayout = async () => {
    setIsClaimingPayout(true);
    try {
      // Implement payout claim logic here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay
    } catch (error) {
      console.error('Failed to claim payout:', error);
    } finally {
      setIsClaimingPayout(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-white">Rewards</h1>
          {!isConnected && (
            <button
              onClick={handleConnect}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {!isConnected ? (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <p className="text-yellow-500">
                Connect your wallet to view and manage your rewards
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* GigCoin Balance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="w-6 h-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">GigCoin Balance</h2>
                </div>
                
                <div className="text-5xl font-bold text-white mb-6">25 GIG</div>
                
                <h3 className="text-xl font-bold text-white mb-2">What are GigCoins?</h3>
                <p className="text-gray-300 mb-6">
                  GigCoins are reward tokens earned through platform activity. Use them to access premium features and services.
                </p>
                
                <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                  Redeem GigCoins
                </button>
              </div>

              {/* Referral Link */}
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <LinkIcon className="w-6 h-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">Your Referral Link</h2>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg flex items-center justify-between mb-4">
                  <span className="text-gray-300 text-sm sm:text-base">
                    gigfi.eth.limo/ref/{address?.slice(2, 8)}
                  </span>
                  <button
                    onClick={handleCopyReferral}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                
                <p className="text-gray-300">Share your link to earn rewards when new users join!</p>
              </div>
            </div>

            {/* Affiliate Program */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Affiliate Program</h2>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <Coins className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="text-2xl font-bold text-white">$125.5</div>
                  <div className="text-gray-300">Total Earnings</div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">12</div>
                  <div className="text-gray-300">Network Size</div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <TrendingUp className="w-8 h-8 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">Leader</div>
                  <div className="text-gray-300">Current Rank</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-white">Leader</span>
                  <span className="font-medium text-white">Elite</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div className="h-full w-3/4 bg-blue-500 rounded-full"></div>
                </div>
                <div className="text-center text-sm text-gray-300 mt-2">
                  75% progress to next rank
                </div>
                <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors mt-4">
                  Claim Rank Bonus
                </button>
              </div>

              {/* Network Members */}
              <div className="overflow-x-auto">
                <h3 className="text-xl font-bold text-white mb-4">Your Network</h3>
                <div className="space-y-3">
                  {networkMembers.map((member, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4 flex flex-wrap justify-between items-center gap-4">
                      <div>
                        <div className="font-medium text-white">{member.name}</div>
                        <div className="text-gray-300 text-sm">
                          {member.role} • Joined {member.joinDate}
                        </div>
                      </div>
                      <div className="text-white">{member.referrals} referrals</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Payout */}
              <div className="mt-6 bg-gray-700 rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-gray-300">Available for payout</div>
                    <div className="text-2xl font-bold text-white">$125.5</div>
                  </div>
                  <button
                    onClick={handleClaimPayout}
                    disabled={isClaimingPayout}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {isClaimingPayout ? 'Processing...' : 'Request Payout'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};