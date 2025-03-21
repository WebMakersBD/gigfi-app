import React, { useState } from 'react';
import { Header } from '../components/Header';
import { TokenImport } from '../components/TokenImport';
import { useGigFiWallet } from '../hooks/useGigFiWallet';
import { ArrowDownToLine, ArrowUpFromLine, History, Wallet, ExternalLink, AlertCircle, QrCode, Coins, RefreshCcw, Info } from 'lucide-react';
import { useWalletStore } from '../lib/store';
import { QRCodeSVG } from 'qrcode.react';
import { parseUnits } from 'viem';
import { USDC_ADDRESS } from '../lib/constants';
import { GigCoinPurchase } from '../components/GigCoinPurchase';
import { getContract } from '../lib/thirdweb';

export const Income = () => {
  const [showQR, setShowQR] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const { 
    isConnected, 
    address, 
    transactions, 
    usdcBalance, 
    gigBalance, 
    updateBalance,
    connect,
    addTransaction 
  } = useWalletStore();

  const validateAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendAmount || !recipientAddress) return;

    // Validate recipient address
    if (!validateAddress(recipientAddress)) {
      setTransferError('Invalid recipient address');
      return;
    }

    // Validate amount
    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransferError('Invalid amount');
      return;
    }

    if (amount > parseFloat(usdcBalance)) {
      setTransferError('Insufficient balance');
      return;
    }

    if (!isConnected) {
      try {
        await connect();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setTransferError('Please connect your wallet first');
        return;
      }
    }

    setIsProcessing(true);
    setTransferError(null);

    try {
      // Get USDC contract instance
      const contract = await getContract(USDC_ADDRESS);
      if (!contract) {
        throw new Error('Failed to get USDC contract');
      }

      // Convert amount to proper decimals (USDC has 6 decimals)
      const parsedAmount = parseUnits(sendAmount, 6).toString();

      // Send the transaction
      const tx = await contract.erc20.transfer(recipientAddress, parsedAmount);
      
      // Wait for confirmation
      const receipt = await tx.receipt;

      // Add transaction to history
      addTransaction({
        type: 'Stored',
        amount: `${sendAmount} USDC`,
        from: address!,
        to: recipientAddress,
        description: 'Sent USDC',
        hash: receipt.transactionHash
      });

      // Update balances
      await updateBalance();

      // Reset form
      setSendAmount('');
      setRecipientAddress('');

    } catch (error) {
      console.error('Transfer failed:', error);
      setTransferError(
        error instanceof Error 
          ? error.message.includes('user rejected') 
            ? 'Transaction was cancelled'
            : error.message
          : 'Transfer failed. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Balance Overview</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-gray-400">USDC Balance</p>
                <TokenImport type="token" />
              </div>
              <p className="text-3xl font-bold text-white">
                ${usdcBalance}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-gray-400">GigCoin Balance</p>
                <TokenImport type="token" />
              </div>
              <p className="text-3xl font-bold text-white">
                {gigBalance} GIG
              </p>
              <p className="text-sm text-green-400">≈ ${(parseFloat(gigBalance) * 0.01).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {transferError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-500">{transferError}</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          <GigCoinPurchase />
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpFromLine className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-medium text-white">Send</h3>
            </div>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Recipient Address</label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => {
                    setRecipientAddress(e.target.value);
                    setTransferError(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0x..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Amount (USDC)</label>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => {
                    setSendAmount(e.target.value);
                    setTransferError(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.000001"
                  min="0"
                />
                {parseFloat(sendAmount) > parseFloat(usdcBalance) && (
                  <p className="text-red-500 text-sm mt-1">Insufficient balance</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isProcessing || !sendAmount || !recipientAddress || parseFloat(sendAmount) > parseFloat(usdcBalance)}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!isConnected ? 'Connect Wallet' : 
                 isProcessing ? 'Processing...' : 'Send USDC'}
              </button>
            </form>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowDownToLine className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-medium text-white">Receive</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded-lg break-all">
                <p className="text-sm text-gray-400 mb-1">Your Address</p>
                <p className="text-white font-mono">{address}</p>
              </div>
              <button
                onClick={() => setShowQR(!showQR)}
                className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                <QrCode className="w-5 h-5" />
                {showQR ? 'Hide' : 'Show'} QR Code
              </button>
              {showQR && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCodeSVG value={address || ''} size={200} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <History className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Recent Transactions</h2>
          </div>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No transactions yet</p>
            ) : (
              transactions.map(transaction => (
                <div key={transaction.id} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-400">{transaction.type}</p>
                      <p className="text-lg font-semibold text-white">{transaction.amount}</p>
                      <p className="text-sm text-gray-300">{transaction.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">{transaction.date}</p>
                      <p className="text-sm text-gray-300">
                        {transaction.type === 'Stored' ? `From: ${transaction.from?.slice(0, 6)}...${transaction.from?.slice(-4)}` : `To: ${transaction.to?.slice(0, 6)}...${transaction.to?.slice(-4)}`}
                      </p>
                      <a
                        href={`https://etherscan.io/tx/${transaction.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 justify-end mt-1"
                      >
                        View on Etherscan
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};