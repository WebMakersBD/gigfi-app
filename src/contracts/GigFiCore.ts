import { parseAbi } from 'viem';
import { GIGFI_CORE_ADDRESS } from '../lib/constants';

export const GigFiCoreABI = parseAbi([
  // Core platform functions
  'function createListing(string name, string description, uint256 price, uint256 gigPrice, string metadata) returns (uint256)',
  'function buyListing(uint256 listingId, bool useGigCoin) returns (bool)',
  'function completeListing(uint256 listingId) returns (bool)',
  'function cancelListing(uint256 listingId) returns (bool)',
  'function getListingDetails(uint256 listingId) view returns (uint256 id, string name, string description, uint256 price, uint256 gigPrice, address seller, address buyer, uint8 status, string metadata)',
  
  // Payment functions
  'function depositUSDC(uint256 amount) returns (bool)',
  'function withdrawUSDC(uint256 amount) returns (bool)',
  'function buyGigCoin(uint256 usdcAmount) returns (uint256)',
  'function sellGigCoin(uint256 gigAmount) returns (uint256)',
  
  // Events
  'event ListingCreated(uint256 indexed listingId, address indexed seller)',
  'event ListingPurchased(uint256 indexed listingId, address indexed buyer)',
  'event ListingCompleted(uint256 indexed listingId)',
  'event ListingCancelled(uint256 indexed listingId)',
  'event USDCDeposited(address indexed user, uint256 amount)',
  'event USDCWithdrawn(address indexed user, uint256 amount)',
  'event GigCoinBought(address indexed user, uint256 usdcAmount, uint256 gigAmount)',
  'event GigCoinSold(address indexed user, uint256 gigAmount, uint256 usdcAmount)'
]);

export { GIGFI_CORE_ADDRESS };