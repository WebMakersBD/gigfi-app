import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CountdownTimer } from '../components/CountdownTimer';
import { TokenDetails } from '../components/TokenDetails';
import { FAQ } from '../components/FAQ';
import { Header } from '../components/Header';
import { useWalletStore } from '../lib/store';

export const Home = () => {
  const navigate = useNavigate();
  const { isConnected, connect } = useWalletStore();

  const handlePresaleClick = async () => {
    if (!isConnected) {
      try {
        await connect();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        return;
      }
    }
    navigate('/income');
  };

  const handleAirdropClick = async () => {
    if (!isConnected) {
      try {
        await connect();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        return;
      }
    }
    // Navigate to rewards page for airdrop claim
    navigate('/rewards');
  };

  const handlePlayClick = async () => {
    if (!isConnected) {
      try {
        await connect();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        return;
      }
    }
    // Navigate to dashboard where Pick 4 game is located
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-green-400 mb-4">
            Ditch the Gig Struggle—Earn Crypto Now!
          </h2>
          <p className="text-xl text-gray-300">
            From coffee runs to cash—GigFi transforms your hustle!
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            GigCoin Presale Live—$0.01/Token!
          </h2>
          <button 
            onClick={handlePresaleClick}
            className="w-full bg-green-500 text-white py-3 rounded-lg text-xl font-medium hover:bg-green-600 transition-colors mb-6"
          >
            {isConnected ? 'Join Presale Now' : 'Connect Wallet to Join Presale'}
          </button>
          <CountdownTimer />
          <p className="text-green-400 text-center text-lg">Zero risk, 4% APY!</p>
        </div>

        <div className="grid gap-6 mb-8">
          <button 
            onClick={handleAirdropClick}
            className="w-full bg-orange-500 text-white py-3 rounded-lg text-xl font-medium hover:bg-orange-600 transition-colors"
          >
            {isConnected ? 'Claim 20 Free GigCoin!' : 'Connect Wallet to Claim Airdrop'}
          </button>
          <button 
            onClick={handlePlayClick}
            className="w-full bg-purple-500 text-white py-3 rounded-lg text-xl font-medium hover:bg-purple-600 transition-colors"
          >
            {isConnected ? 'Play Pick 4 – Win 50 GigCoin!' : 'Connect Wallet to Play'}
          </button>
          <p className="text-yellow-400 text-center">Optional fun, play responsibly!</p>
        </div>

        <TokenDetails />
        <FAQ />
      </div>
    </div>
  );
};