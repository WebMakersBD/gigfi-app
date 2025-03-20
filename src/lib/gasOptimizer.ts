import { formatUnits, parseUnits } from 'viem';
import { publicClient } from './contracts';
import { thirdwebClient } from './thirdweb';

interface GasStrategy {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  gasLimit: bigint;
}

export class GasOptimizer {
  private static instance: GasOptimizer;
  private lastUpdate: number = 0;
  private cachedStrategy: GasStrategy | null = null;
  private readonly UPDATE_INTERVAL = 15000; // 15 seconds
  private readonly GAS_LIMIT_BUFFER = 1.2; // 20% buffer

  private constructor() {}

  public static getInstance(): GasOptimizer {
    if (!GasOptimizer.instance) {
      GasOptimizer.instance = new GasOptimizer();
    }
    return GasOptimizer.instance;
  }

  public async getOptimalGasStrategy(
    estimatedGas: bigint,
    maxGasPriceGwei: number = 300
  ): Promise<GasStrategy> {
    try {
      // Check cache
      if (
        this.cachedStrategy &&
        Date.now() - this.lastUpdate < this.UPDATE_INTERVAL
      ) {
        return {
          ...this.cachedStrategy,
          gasLimit: this.addBuffer(estimatedGas)
        };
      }

      // Get latest block and fee data
      const [block, feeData] = await Promise.all([
        publicClient.getBlock({ blockTag: 'latest' }),
        publicClient.estimateFeesPerGas()
      ]);

      if (!block.baseFeePerGas) {
        throw new Error('Could not get base fee from latest block');
      }

      // Calculate optimal fees
      const maxFeePerGas = this.calculateOptimalMaxFee(
        block.baseFeePerGas,
        feeData.maxPriorityFeePerGas,
        parseUnits(maxGasPriceGwei.toString(), 9)
      );

      const strategy: GasStrategy = {
        maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        gasLimit: this.addBuffer(estimatedGas)
      };

      // Update cache
      this.cachedStrategy = strategy;
      this.lastUpdate = Date.now();

      return strategy;

    } catch (error) {
      console.error('Failed to get optimal gas strategy:', error);
      
      // Fallback to safe defaults
      return {
        maxFeePerGas: parseUnits('50', 9), // 50 Gwei
        maxPriorityFeePerGas: parseUnits('1.5', 9), // 1.5 Gwei
        gasLimit: this.addBuffer(estimatedGas)
      };
    }
  }

  private calculateOptimalMaxFee(
    baseFee: bigint,
    priorityFee: bigint,
    maxGasPrice: bigint
  ): bigint {
    // Calculate suggested max fee: (base fee * 2) + priority fee
    const suggestedMaxFee = (baseFee * 2n) + priorityFee;
    
    // Ensure it doesn't exceed max gas price
    return suggestedMaxFee > maxGasPrice ? maxGasPrice : suggestedMaxFee;
  }

  private addBuffer(gasLimit: bigint): bigint {
    return (gasLimit * BigInt(Math.floor(this.GAS_LIMIT_BUFFER * 100))) / 100n;
  }

  public async simulateTransaction(
    to: string,
    data: string,
    value: bigint = 0n
  ): Promise<bigint> {
    try {
      // Use ThirdWeb's gas estimator for more accurate results
      const gasEstimate = await thirdwebClient.estimate({
        to,
        data,
        value: value.toString(),
        gasLimit: '1000000' // High initial limit for accurate estimation
      });

      return BigInt(gasEstimate.gasLimit);
    } catch (error) {
      console.error('Transaction simulation failed:', error);
      // Fallback to standard estimation
      return await publicClient.estimateGas({
        to: to as `0x${string}`,
        data: data as `0x${string}`,
        value
      });
    }
  }

  public getNetworkStatus(baseFee: bigint): 'Low' | 'Medium' | 'High' {
    const baseFeeGwei = Number(formatUnits(baseFee, 9));
    if (baseFeeGwei < 30) return 'Low';
    if (baseFeeGwei < 100) return 'Medium';
    return 'High';
  }
}

export const gasOptimizer = GasOptimizer.getInstance();