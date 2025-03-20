import { create } from 'zustand';
import { createPublicClient, http, parseUnits, formatUnits } from 'viem';
import { mainnet } from 'wagmi/chains';
import { USDCABI, GigCoinABI } from '../contracts/GigCoin';
import { GigFiStakingABI } from '../contracts/GigFiStaking';
import { GigFiShareNFTABI } from '../contracts/GigFiShareNFT';
import { USDC_ADDRESS, GIGFI_TOKEN_ADDRESS, GIGFI_STAKING_ADDRESS, GIGFI_SHARE_NFT_ADDRESS } from './constants';
import { verifyBeforeTransaction } from './verify';
import { getContract } from './thirdweb';

interface StakingPosition {
  id: number;
  amount: string;
  token: string;
  apy: number;
  startDate: string;
  endDate?: string;
  rewards: string;
}

interface Transaction {
  id: number;
  type: 'Stored' | 'Withdrawn' | 'Staked' | 'Unstaked' | 'SharesPurchased';
  amount: string;
  from?: string;
  to?: string;
  date: string;
  description: string;
  hash: string;
}

interface WalletState {
  isConnected: boolean;
  address: string | null;
  username: string | null;
  usdcBalance: string;
  gigBalance: string;
  transactions: Transaction[];
  stakingPositions: StakingPosition[];
  pensionBalance: string;
  pensionContribution: number;
  nftShares: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  updateBalance: () => Promise<void>;
  storeUSDC: (amount: string) => Promise<void>;
  withdrawUSDC: (amount: string) => Promise<void>;
  stake: (amount: string, token: string) => Promise<void>;
  unstake: (positionId: number) => Promise<void>;
  updatePensionContribution: (percentage: number) => Promise<void>;
  buyNFTShares: (amount: number) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  setUsername: (username: string) => void;
}

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
});

export const useWalletStore = create<WalletState>((set, get) => ({
  isConnected: false,
  address: null,
  username: null,
  usdcBalance: '0',
  gigBalance: '0',
  transactions: [],
  stakingPositions: [],
  pensionBalance: '0',
  pensionContribution: 5,
  nftShares: 0,

  connect: async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('Please install MetaMask to use this feature');
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts?.[0]) {
        throw new Error('No account found');
      }

      set({ 
        isConnected: true, 
        address: accounts[0],
        username: `@${accounts[0].slice(2, 8).toLowerCase()}`
      });

      window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
        if (!newAccounts?.[0]) {
          set({ isConnected: false, address: null, username: null });
        } else {
          set({ 
            address: newAccounts[0],
            username: `@${newAccounts[0].slice(2, 8).toLowerCase()}`
          });
          get().updateBalance();
        }
      });

      await get().updateBalance();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      set({ isConnected: false, address: null, username: null });
      throw error;
    }
  },

  disconnect: () => {
    window.ethereum?.removeListener('accountsChanged', () => {});
    set({ 
      isConnected: false, 
      address: null, 
      username: null,
      usdcBalance: '0',
      gigBalance: '0',
      transactions: [],
      stakingPositions: [],
      nftShares: 0
    });
  },

  updateBalance: async () => {
    const { address } = get();
    if (!address) return;

    try {
      // Get USDC balance using direct contract call
      const usdcBalance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDCABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      });

      // Get GigCoin balance using direct contract call
      const gigBalance = await publicClient.readContract({
        address: GIGFI_TOKEN_ADDRESS,
        abi: GigCoinABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      });

      // Get NFT share count using ThirdWeb SDK
      let nftShares = 0n;
      try {
        const contract = await getContract(GIGFI_SHARE_NFT_ADDRESS);
        const balance = await contract.erc721.balanceOf(address);
        nftShares = BigInt(balance.toString());
      } catch (error) {
        console.warn('Failed to get NFT balance, defaulting to 0:', error);
      }

      set({
        usdcBalance: formatUnits(usdcBalance, 6),
        gigBalance: formatUnits(gigBalance, 18),
        nftShares: Number(nftShares)
      });
    } catch (error) {
      console.error('Failed to update balance:', error);
      throw error;
    }
  },

  storeUSDC: async (amount: string) => {
    const { address, addTransaction } = get();
    if (!address) throw new Error('Wallet not connected');

    try {
      // const contract = await getContract(USDC_ADDRESS);
      // const tx = await contract.erc20.transfer(GIGFI_STAKING_ADDRESS, parseUnits(amount, 6));
      const contract = await getContract(USDC_ADDRESS)
      const parsedAmount = parseUnits(amount, 6)

      const tx = await contract.erc20.transfer(
        GIGFI_STAKING_ADDRESS,
        parsedAmount.toString()
      )
      
      addTransaction({
        type: 'Stored',
        amount: `${amount} USDC`,
        from: address,
        to: GIGFI_STAKING_ADDRESS,
        description: 'Stored USDC',
        hash: tx.receipt.transactionHash
      });

      await get().updateBalance();
    } catch (error) {
      console.error('Failed to store USDC:', error);
      throw error;
    }
  },

  withdrawUSDC: async (amount: string) => {
    const { address, addTransaction } = get();
    if (!address) throw new Error('Wallet not connected');

    try {
      const contract = await getContract(GIGFI_STAKING_ADDRESS);
      const tx = await contract.call('withdraw', [parseUnits(amount, 6)]);
      
      addTransaction({
        type: 'Withdrawn',
        amount: `${amount} USDC`,
        from: GIGFI_STAKING_ADDRESS,
        to: address,
        description: 'Withdrew USDC',
        hash: tx.receipt.transactionHash
      });

      await get().updateBalance();
    } catch (error) {
      console.error('Failed to withdraw USDC:', error);
      throw error;
    }
  },

  stake: async (amount: string, token: string) => {
    const { address, addTransaction } = get();
    if (!address) throw new Error('Wallet not connected');

    try {
      const contract = await getContract(GIGFI_STAKING_ADDRESS);
      const decimals = token === 'USDC' ? 6 : 18;
      const tx = await contract.call('stake', [parseUnits(amount, decimals), token === 'USDC' ? USDC_ADDRESS : GIGFI_TOKEN_ADDRESS]);

      addTransaction({
        type: 'Staked',
        amount: `${amount} ${token}`,
        from: address,
        to: GIGFI_STAKING_ADDRESS,
        description: `Staked ${token}`,
        hash: tx.receipt.transactionHash
      });

      await get().updateBalance();
    } catch (error) {
      console.error('Failed to stake:', error);
      throw error;
    }
  },

  unstake: async (positionId: number) => {
    const { address, addTransaction } = get();
    if (!address) throw new Error('Wallet not connected');

    try {
      const contract = await getContract(GIGFI_STAKING_ADDRESS);
      const tx = await contract.call('unstake', [positionId]);

      const position = get().stakingPositions.find(pos => pos.id === positionId);
      if (position) {
        addTransaction({
          type: 'Unstaked',
          amount: `${position.amount} ${position.token}`,
          from: GIGFI_STAKING_ADDRESS,
          to: address,
          description: `Unstaked ${position.token}`,
          hash: tx.receipt.transactionHash
        });
      }

      await get().updateBalance();
    } catch (error) {
      console.error('Failed to unstake:', error);
      throw error;
    }
  },

  updatePensionContribution: async (percentage: number) => {
    try {
      set({ pensionContribution: percentage });
      const currentBalance = parseFloat(get().usdcBalance);
      const pensionAmount = (currentBalance * percentage) / 100;
      set({ pensionBalance: pensionAmount.toFixed(2) });
    } catch (error) {
      console.error('Failed to update pension contribution:', error);
      throw error;
    }
  },

  buyNFTShares: async (amount: number) => {
    const { address, addTransaction } = get();
    if (!address) throw new Error('Wallet not connected');

    try {
      const contract = await getContract(GIGFI_SHARE_NFT_ADDRESS);
      const tx = await contract.erc721.mint({ amount });

      addTransaction({
        type: 'SharesPurchased',
        amount: `${amount} Shares`,
        from: address,
        description: 'Purchased NFT Shares',
        hash: tx.receipt.transactionHash
      });

      await get().updateBalance();
    } catch (error) {
      console.error('Failed to buy NFT shares:', error);
      throw error;
    }
  },

  addTransaction: (transaction) => {
    set((state) => ({
      transactions: [{
        ...transaction,
        id: Date.now(),
        date: new Date().toLocaleDateString()
      }, ...state.transactions]
    }));
  },

  setUsername: (username: string) => {
    set({ username });
  }
}));