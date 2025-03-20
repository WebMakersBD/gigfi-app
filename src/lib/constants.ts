// Contract addresses
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

// GigFi contract addresses
const validateAddress = (address: string | undefined): string => {
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Invalid contract address: ${address}`);
  }
  return address;
};

// Get addresses from environment variables with validation
const GIGFI_TOKEN_ADDRESS = '0x26987D06C856F5689334375Fe58f4BD2e2888cb8';
const GIGFI_CORE_ADDRESS = '0x79aeF8513340F7AFfF300e78f795360571894004';
const GIGFI_STAKING_ADDRESS = '0x0551B45932B03E35E0FD2CF474216D87fD80c519';
const GIGFI_SHARE_NFT_ADDRESS = '0x5b5F84AFd30e5df840E47a11BE4a0D54EbfF86fe';
const GIGFI_EXCHANGE_ADDRESS = '0x302DDcd2aE3Bb9CA0824C0Ec0f50a4a4AB2fe998';

// Chain configuration
const CHAIN_ID = 1; // Mainnet
const CHAIN_NAME = 'Ethereum Mainnet';

// RPC configuration with fallbacks and retry logic
const RPC_CONFIG = {
  urls: [
    "https://eth.llamarpc.com",
    "https://rpc.ankr.com/eth",
    "https://ethereum.publicnode.com",
    "https://1.rpc.thirdweb.com/$AcrbfQQqxhJDUHbniqFt3MRBtZI_EAj81dgF60uu6eTW8womOX2S0_SWglwbX1IZW5lze_HbtC7VtcxJtdY70g"
  ],
  retryCount: 3,
  retryDelay: 1000,
  timeout: 10000,
  batch: {
    batchSize: 1024,
    wait: 100
  },
  headers: {
    'Content-Type': 'application/json'
  }
};

// Contract configuration
const CONTRACT_DECIMALS = {
  USDC: 6,
  GIGFI: 18,
  SHARES: 0
};

// Staking configuration
const STAKING_APY = {
  USDC: 4.0,
  GIGFI: 12.0
};

// NFT Share configuration
const SHARE_PRICE = '1250000000000000000'; // 1.25 ETH in wei
const MAX_SUPPLY = 1000000;
const DIVIDEND_INTERVAL = 7776000; // 90 days in seconds

// Trading configuration
const BUY_SPREAD = 20; // 2%
const SELL_SPREAD = 15; // 1.5%

// Feature flags
const FEATURES = {
  STAKING: true,
  PENSION: true,
  NFT_SHARES: true,
  REWARDS: true
};

// API configuration
const API_CONFIG = {
  TIMEOUT: 20000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000
};

// Cache configuration
const CACHE_CONFIG = {
  STALE_TIME: 300000, // 5 minutes
  CACHE_TIME: 1800000 // 30 minutes
};

// Export all constants in a single statement
export {
  USDC_ADDRESS,
  GIGFI_TOKEN_ADDRESS,
  GIGFI_CORE_ADDRESS,
  GIGFI_STAKING_ADDRESS,
  GIGFI_SHARE_NFT_ADDRESS,
  GIGFI_EXCHANGE_ADDRESS,
  CHAIN_ID,
  CHAIN_NAME,
  RPC_CONFIG,
  CONTRACT_DECIMALS,
  STAKING_APY,
  SHARE_PRICE,
  MAX_SUPPLY,
  DIVIDEND_INTERVAL,
  BUY_SPREAD,
  SELL_SPREAD,
  FEATURES,
  API_CONFIG,
  CACHE_CONFIG
};