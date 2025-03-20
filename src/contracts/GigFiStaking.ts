import { parseAbi } from 'viem';

export const GigFiStakingABI = parseAbi([
  // Staking functions
  'function stake(uint256 amount, address token) returns (uint256)',
  'function unstake(uint256 positionId) returns (bool)',
  'function getStakingPosition(uint256 positionId) view returns (uint256 amount, address token, uint256 apy, uint256 startTime, uint256 endTime, uint256 rewards)',
  'function getStakingPositions(address account) view returns (uint256[] amounts, address[] tokens, uint256[] apys, uint256[] startTimes, uint256[] endTimes, uint256[] rewards)',
  'function claimRewards(uint256 positionId) returns (uint256)',
  
  // Pension functions
  'function setPensionContribution(uint256 percentage) returns (bool)',
  'function getPensionBalance(address account) view returns (uint256)',
  'function withdrawPension(uint256 amount) returns (bool)',
  
  // NFT Share functions
  'function buyShares(uint256 amount) returns (bool)',
  'function getShareBalance(address account) view returns (uint256)',
  'function getSharePrice() view returns (uint256)',
  'function claimDividends() returns (uint256)',
  
  // Events
  'event Staked(address indexed user, uint256 indexed positionId, uint256 amount, address token)',
  'event Unstaked(address indexed user, uint256 indexed positionId, uint256 amount, address token)',
  'event RewardsClaimed(address indexed user, uint256 indexed positionId, uint256 amount)',
  'event PensionContributionUpdated(address indexed user, uint256 percentage)',
  'event SharesPurchased(address indexed user, uint256 amount, uint256 price)',
  'event DividendsClaimed(address indexed user, uint256 amount)'
]);

// Contract addresses (replace with actual deployed contract addresses)
export const STAKING_CONTRACT = '0x1234567890123456789012345678901234567890';