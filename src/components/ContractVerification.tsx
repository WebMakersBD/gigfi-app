import React, { useEffect, useState } from 'react';
import { getDeploymentStatus } from '../lib/deploymentStatus';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export const ContractVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState<Awaited<ReturnType<typeof getDeploymentStatus>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verify = async () => {
    setIsVerifying(true);
    setError(null);
    try {
      const result = await getDeploymentStatus();
      setStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    verify();
  }, []);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center p-4">
        <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Verifying contract deployment...</span>
      </div>
    );
  }

  if (!status?.contracts?.GigFiToken) {
    return null;
  }

  const token = status.contracts.GigFiToken;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Contract Verification Status</h3>
        <button
          onClick={verify}
          className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className={`p-4 rounded-lg ${
        token.verified ? 'bg-green-500/10' : 'bg-red-500/10'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {token.verified ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="font-medium text-white">GigFi Token Contract</span>
          </div>
          <span className="text-sm font-mono text-gray-400">
            {token.address.slice(0, 6)}...{token.address.slice(-4)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={token.bytecodeVerified ? 'text-green-500' : 'text-red-500'}>
              {token.bytecodeVerified ? '✓' : '✗'} Bytecode Verification
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={token.interfaceVerified ? 'text-green-500' : 'text-red-500'}>
              {token.interfaceVerified ? '✓' : '✗'} Interface Verification
            </span>
          </div>
        </div>

        {token.details && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <h4 className="text-white font-medium mb-2">Contract Details</h4>
            <div className="space-y-1 text-sm">
              <p className="text-gray-300">Name: {token.details.name}</p>
              <p className="text-gray-300">Symbol: {token.details.symbol}</p>
              <p className="text-gray-300">Decimals: {token.details.decimals}</p>
              <p className="text-gray-300">Total Supply: {token.details.totalSupply}</p>
            </div>
          </div>
        )}

        {token.error && (
          <div className="mt-4 text-red-400">
            Error: {token.error}
          </div>
        )}
      </div>
    </div>
  );
};