import { parseAbi } from 'viem';

export const GigFiShareNFTABI = parseAbi([
  // ERC721 standard functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)',
  'function approve(address to, uint256 tokenId)',
  'function setApprovalForAll(address operator, bool approved)',
  
  // Custom GigFi Share NFT functions
  'function mintShare(address to, bool restricted) payable returns (uint256)',
  'function sharePrice() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function getShareMetadata(uint256 tokenId) view returns ((uint256,uint256,uint256,bool))',
  'function isShareTransferrable(uint256 tokenId) view returns (bool)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
  'event ShareMinted(address indexed owner, uint256 indexed tokenId, uint256 price)',
  'event DividendDistributed(uint256 amount, uint256 perShareAmount)',
  'event DividendClaimed(address indexed owner, uint256 amount)'
]);

export { GIGFI_SHARE_NFT_ADDRESS } from '../lib/constants';