import { useState, useEffect } from 'react';
import { connect, disconnect, getAccount, watchAccount } from '@wagmi/core';
import { config } from '../lib/wagmi';

export const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unwatch = watchAccount(config, {
      onChange(account) {
        setIsConnected(!!account?.address);
        setAddress(account?.address || '');
      }
    });

    // Check initial connection
    const account = getAccount(config);
    setIsConnected(!!account?.address);
    setAddress(account?.address || '');

    return () => {
      unwatch();
    };
  }, []);

  const connectWallet = async () => {
    try {
      setError(null);
      const result = await connect(config);
      setIsConnected(!!result.accounts[0]);
      setAddress(result.accounts[0] || '');
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err instanceof Error ? err : new Error('Failed to connect wallet'));
      throw err;
    }
  };

  const disconnectWallet = async () => {
    try {
      await disconnect(config);
      setIsConnected(false);
      setAddress('');
    } catch (err) {
      console.error('Wallet disconnect error:', err);
      throw err;
    }
  };

  return {
    connect: connectWallet,
    disconnect: disconnectWallet,
    isConnected,
    address,
    error
  };
};