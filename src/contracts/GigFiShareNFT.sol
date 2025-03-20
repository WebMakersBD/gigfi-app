// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title GigFiShareNFT
 * @dev NFT contract for GigFi platform shares
 */
contract GigFiShareNFT is 
    ERC721, 
    ERC721Enumerable, 
    ERC721URIStorage, 
    AccessControl, 
    Pausable, 
    Initializable 
{
    using Strings for uint256;

    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // State variables
    uint256 public constant MAX_SUPPLY = 1000000;
    uint256 public constant SHARE_PRICE = 1250000000000000000; // 1.25 ETH
    uint256 public constant DIVIDEND_INTERVAL = 90 days;
    
    uint256 public totalShares;
    uint256 public currentDividendPool;
    uint256 public lastDividendTimestamp;
    
    // Mappings
    mapping(uint256 => ShareMetadata) public shareMetadata;
    mapping(address => uint256) public unclaimedDividends;
    mapping(uint256 => bool) public shareTransferrable;
    
    // Structs
    struct ShareMetadata {
        uint256 purchasePrice;
        uint256 purchaseDate;
        uint256 lastDividendClaim;
        bool restricted;
    }
    
    // Events
    event ShareMinted(
        address indexed owner,
        uint256 indexed tokenId,
        uint256 price
    );
    
    event DividendDistributed(
        uint256 amount,
        uint256 perShareAmount
    );
    
    event DividendClaimed(
        address indexed owner,
        uint256 amount
    );
    
    event ShareTransferStatusUpdated(
        uint256 indexed tokenId,
        bool transferrable
    );
    
    /**
     * @dev Initialize the contract
     */
    function initialize() external initializer {
        __ERC721_init("GigFi Share", "GIGS");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        
        lastDividendTimestamp = block.timestamp;
    }
    
    // Required overrides
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        require(
            shareTransferrable[tokenId] || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Share transfer restricted"
        );
        return super._update(to, tokenId, auth);
    }
    
    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }
    
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Mint new share NFT
     * @param to Recipient address
     * @param restricted Whether the share is restricted from transfer
     */
    function mintShare(
        address to,
        bool restricted
    ) external payable whenNotPaused onlyRole(MINTER_ROLE) returns (uint256) {
        require(totalShares < MAX_SUPPLY, "Max supply reached");
        require(msg.value >= SHARE_PRICE, "Insufficient payment");
        
        uint256 tokenId = totalShares + 1;
        
        _safeMint(to, tokenId);
        
        shareMetadata[tokenId] = ShareMetadata({
            purchasePrice: msg.value,
            purchaseDate: block.timestamp,
            lastDividendClaim: block.timestamp,
            restricted: restricted
        });
        
        shareTransferrable[tokenId] = !restricted;
        totalShares++;
        
        // Set token URI with metadata
        string memory uri = string(
            abi.encodePacked(
                "data:application/json;base64,",
                _generateMetadata(tokenId)
            )
        );
        _setTokenURI(tokenId, uri);
        
        emit ShareMinted(to, tokenId, msg.value);
        
        return tokenId;
    }
    
    /**
     * @dev Distribute dividends
     */
    function distributeDividends() external payable whenNotPaused {
        require(msg.value > 0, "No dividends to distribute");
        require(
            block.timestamp >= lastDividendTimestamp + DIVIDEND_INTERVAL,
            "Dividend interval not reached"
        );
        
        uint256 perShareAmount = msg.value / totalShares;
        currentDividendPool += msg.value;
        lastDividendTimestamp = block.timestamp;
        
        emit DividendDistributed(msg.value, perShareAmount);
    }
    
    /**
     * @dev Claim dividends for a specific share
     * @param tokenId Share token ID
     */
    function claimDividends(uint256 tokenId) external whenNotPaused {
        require(_exists(tokenId), "Share does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not share owner");
        
        ShareMetadata storage metadata = shareMetadata[tokenId];
        require(
            metadata.lastDividendClaim < lastDividendTimestamp,
            "Dividends already claimed"
        );
        
        uint256 dividendAmount = _calculateDividends(tokenId);
        require(dividendAmount > 0, "No dividends to claim");
        
        metadata.lastDividendClaim = block.timestamp;
        currentDividendPool -= dividendAmount;
        
        (bool success, ) = msg.sender.call{value: dividendAmount}("");
        require(success, "Dividend transfer failed");
        
        emit DividendClaimed(msg.sender, dividendAmount);
    }
    
    /**
     * @dev Update share transfer status
     * @param tokenId Share token ID
     * @param transferrable Whether the share can be transferred
     */
    function updateShareTransferStatus(
        uint256 tokenId,
        bool transferrable
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_exists(tokenId), "Share does not exist");
        shareTransferrable[tokenId] = transferrable;
        emit ShareTransferStatusUpdated(tokenId, transferrable);
    }
    
    /**
     * @dev Calculate unclaimed dividends for a share
     * @param tokenId Share token ID
     */
    function _calculateDividends(uint256 tokenId) internal view returns (uint256) {
        ShareMetadata storage metadata = shareMetadata[tokenId];
        if (metadata.lastDividendClaim >= lastDividendTimestamp) {
            return 0;
        }
        
        return currentDividendPool / totalShares;
    }
    
    /**
     * @dev Generate metadata for a share
     * @param tokenId Share token ID
     */
    function _generateMetadata(uint256 tokenId) internal view returns (string memory) {
        ShareMetadata storage metadata = shareMetadata[tokenId];
        
        string memory json = string(
            abi.encodePacked(
                '{"name": "GigFi Share #',
                tokenId.toString(),
                '", "description": "GigFi Platform Share Certificate", ',
                '"attributes": [{"trait_type": "Purchase Price", "value": "',
                (metadata.purchasePrice / 1e18).toString(),
                ' ETH"}, {"trait_type": "Purchase Date", "value": "',
                metadata.purchaseDate.toString(),
                '"}, {"trait_type": "Restricted", "value": "',
                metadata.restricted ? "true" : "false",
                '"}]}'
            )
        );
        
        return json;
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Withdraw contract balance (admin only)
     */
    function withdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance - currentDividendPool;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    receive() external payable {}
}