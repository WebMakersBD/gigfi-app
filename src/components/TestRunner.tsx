import React, { useState } from 'react';
import { runPurchaseTest } from '../lib/testRunner';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export const TestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    transactionHash?: string;
    gasUsed?: bigint;
    balanceChange?: {
      before: string;
      after: string;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const testResult = await runPurchaseTest('0.1');
      setResult(testResult);
    } catch (error) {
      console.error('Test failed:', error);
      setError(error instanceof Error ? error.message : 'Test execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={handleTest}
        disabled={isRunning}
        className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
      >
        {isRunning ? (
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Running Test...</span>
          </div>
        ) : (
          'Test GigCoin Purchase'
        )}
      </button>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className={`rounded-lg p-4 ${
          result.success ? 'bg-green-500/10' : 'bg-red-500/10'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className={result.success ? 'text-green-500' : 'text-red-500'}>
              {result.success ? 'Test Passed' : 'Test Failed'}
            </span>
          </div>

          {result.transactionHash && (
            <div className="mb-2">
              <p className="text-sm text-gray-400">Transaction Hash:</p>
              <p className="font-mono text-sm text-white break-all">
                {result.transactionHash}
              </p>
            </div>
          )}

          {result.gasUsed && (
            <div className="mb-2">
              <p className="text-sm text-gray-400">Gas Used:</p>
              <p className="font-mono text-sm text-white">
                {result.gasUsed.toString()}
              </p>
            </div>
          )}

          {result.balanceChange && (
            <div>
              <p className="text-sm text-gray-400">Balance Change:</p>
              <div className="font-mono text-sm text-white">
                <p>Before: {result.balanceChange.before}</p>
                <p>After: {result.balanceChange.after}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};