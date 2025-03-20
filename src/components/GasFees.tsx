import React, { useState, useEffect } from 'react';
import { Info, AlertCircle, RefreshCw } from 'lucide-react';
import { formatUnits, parseUnits } from 'viem';
import { publicClient } from '../lib/contracts';
import { GIGFI_TOKEN_ADDRESS } from '../lib/constants';

interface GasFeesProps {
  amount: string;
  onMaxFeeUpdate: (maxFee: bigint) => void;
}

interface GasEstimate {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedGas: bigint;
  totalMaxFee: bigint;
  baseFee: bigint;
}

interface NetworkStatus {
  congestion: 'Low' | 'Medium' | 'High';
  color: string;
}

export const GasFees: React.FC<GasFeesProps> = ({ amount, onMaxFeeUpdate }) => {
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [customGasPrice, setCustomGasPrice] = useState<string>('');

  // Update gas estimates every 15 seconds
  useEffect(() => {
    const updateGasEstimates = async () => {
      if (!amount) return;
      
      try {
        setIsLoading(true);
        setError(null);

        // Get latest block and fee data
        const [block, feeData] = await Promise.all([
          publicClient.getBlock({ blockTag: 'latest' }),
          publicClient.estimateFeesPerGas()
        ]);

        if (!block.baseFeePerGas) {
          throw new Error('Could not get base fee from latest block');
        }

        // Estimate gas for the transaction
        const estimatedGas = await publicClient.estimateGas({
          account: '0x0000000000000000000000000000000000000000',
          to: GIGFI_TOKEN_ADDRESS,
          data: '0x', // Placeholder for actual transaction data
          value: parseUnits(amount || '0', 18)
        }).catch(() => 21000n); // Use default gas limit if estimation fails

        const gasEstimate: GasEstimate = {
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
          estimatedGas,
          totalMaxFee: estimatedGas * feeData.maxFeePerGas,
          baseFee: block.baseFeePerGas
        };

        setGasEstimate(gasEstimate);
        onMaxFeeUpdate(gasEstimate.totalMaxFee);

        // Fetch ETH price with retries
        const fetchPrice = async (retries = 3): Promise<number> => {
          try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
            if (!response.ok) throw new Error('Failed to fetch ETH price');
            const data = await response.json();
            return data.ethereum.usd;
          } catch (error) {
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              return fetchPrice(retries - 1);
            }
            throw error;
          }
        };

        const price = await fetchPrice();
        setEthPrice(price);

      } catch (err) {
        console.error('Failed to estimate gas:', err);
        setError('Failed to estimate gas fees. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    updateGasEstimates();
    const interval = setInterval(updateGasEstimates, 15000);
    return () => clearInterval(interval);
  }, [amount, onMaxFeeUpdate]);

  const getNetworkStatus = (): NetworkStatus => {
    if (!gasEstimate?.baseFee) return { congestion: 'Medium', color: 'text-yellow-500' };
    
    const baseFeeGwei = Number(formatUnits(gasEstimate.baseFee, 9));
    
    if (baseFeeGwei < 30) return { congestion: 'Low', color: 'text-green-500' };
    if (baseFeeGwei < 100) return { congestion: 'Medium', color: 'text-yellow-500' };
    return { congestion: 'High', color: 'text-red-500' };
  };

  const networkStatus = getNetworkStatus();

  const handleCustomGasPrice = (value: string) => {
    if (!gasEstimate) return;
    
    setCustomGasPrice(value);
    const customGasWei = parseUnits(value || '0', 9);
    const newTotalFee = gasEstimate.estimatedGas * customGasWei;
    onMaxFeeUpdate(newTotalFee);
  };

  const formatUsdValue = (wei: bigint): string => {
    if (!ethPrice) return '...';
    const ethValue = parseFloat(formatUnits(wei, 18));
    return (ethValue * ethPrice).toFixed(2);
  };

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-medium">Estimated Gas Fees</h3>
          <button
            className="text-gray-400 hover:text-white transition-colors"
            onClick={() => setShowTooltip(!showTooltip)}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
        {isLoading && (
          <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
        )}
      </div>

      {showTooltip && (
        <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-300">
          Gas fees are network transaction costs paid in ETH. They include:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Base Fee: Set by network demand</li>
            <li>Priority Fee: Optional tip to miners</li>
            <li>Gas Limit: Maximum gas units allowed</li>
          </ul>
        </div>
      )}

      {gasEstimate && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Network Status</span>
            <span className={networkStatus.color}>
              {networkStatus.congestion} Congestion
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Base Fee</span>
            <div className="text-right">
              <div className="text-white">${formatUsdValue(gasEstimate.baseFee * 21000n)}</div>
              <div className="text-sm text-gray-400">
                {formatUnits(gasEstimate.baseFee, 9)} Gwei
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Priority Fee</span>
            <div className="text-right">
              <div className="text-white">${formatUsdValue(gasEstimate.maxPriorityFeePerGas * 21000n)}</div>
              <div className="text-sm text-gray-400">
                {formatUnits(gasEstimate.maxPriorityFeePerGas, 9)} Gwei
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Estimated Gas Units</span>
            <span className="text-white">
              {formatUnits(gasEstimate.estimatedGas, 0)}
            </span>
          </div>

          <div className="border-t border-gray-700 pt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Custom Gas Price</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  value={customGasPrice}
                  onChange={(e) => handleCustomGasPrice(e.target.value)}
                  className="w-24 px-2 py-1 bg-gray-700 rounded text-white text-right"
                  placeholder={formatUsdValue(gasEstimate.maxFeePerGas * 21000n)}
                  min={formatUsdValue(gasEstimate.baseFee * 21000n)}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Max Total Fee</span>
              <div className="text-right">
                <div className="text-white font-medium">
                  ${formatUsdValue(gasEstimate.totalMaxFee)}
                </div>
                <div className="text-sm text-gray-400">
                  {formatUnits(gasEstimate.totalMaxFee, 18)} ETH
                </div>
              </div>
            </div>
          </div>

          {parseFloat(amount) > 0 && (
            <div className="text-sm text-yellow-500">
              {(Number(formatUsdValue(gasEstimate.totalMaxFee)) / parseFloat(amount)) > 0.1 && 
                '⚠️ Gas fees exceed 10% of transaction value'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};