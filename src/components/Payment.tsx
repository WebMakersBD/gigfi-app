import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface PaymentProps {
  onSend: (to: string, amount: string) => Promise<void>;
  isLoading: boolean;
}

export const Payment: React.FC<PaymentProps> = ({ onSend, isLoading }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSend(recipient, amount);
      setRecipient('');
      setAmount('');
    } catch (err) {
      console.error('Payment failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="recipient" className="block text-sm font-medium text-gray-300">
          Recipient Address
        </label>
        <input
          type="text"
          id="recipient"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white"
          placeholder="0x..."
          required
        />
      </div>
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-300">
          Amount (GigCoin)
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white"
          placeholder="0.0"
          min="0"
          step="0.000001"
          required
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
      >
        {isLoading ? (
          'Sending...'
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Send GigCoin
          </>
        )}
      </button>
    </form>
  );
};