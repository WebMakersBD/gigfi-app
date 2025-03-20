// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @title GigFiCore
 * @dev Core contract managing GigFi platform functionality
 */
contract GigFiCore is ReentrancyGuard, AccessControl, Pausable, Initializable {
    // State variables
    IERC20 public gigToken;
    IERC20 public usdcToken;
    address public stakingContract;
    
    // Constants
    uint256 public constant MINIMUM_LISTING_PRICE = 1e6; // 1 USDC
    uint256 public constant PLATFORM_FEE = 250; // 2.5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // Roles
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    // Structs
    struct Listing {
        uint256 id;
        string name;
        string description;
        uint256 price;
        uint256 gigPrice;
        address seller;
        address buyer;
        ListingStatus status;
        string metadata;
        uint256 createdAt;
    }
    
    enum ListingStatus { Active, Sold, Completed, Cancelled }
    
    // Mappings
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256) public userBalance;
    
    // Events
    event ListingCreated(
        uint256 indexed id,
        address indexed seller,
        string name,
        uint256 price,
        uint256 gigPrice
    );
    
    event ListingPurchased(
        uint256 indexed id,
        address indexed buyer,
        bool useGigCoin
    );
    
    event ListingCompleted(uint256 indexed id);
    event ListingCancelled(uint256 indexed id);
    event FundsWithdrawn(address indexed user, uint256 amount);
    
    // Modifiers
    modifier onlyListingOwner(uint256 listingId) {
        require(
            listings[listingId].seller == msg.sender,
            "Not listing owner"
        );
        _;
    }
    
    modifier validListing(uint256 listingId) {
        require(listings[listingId].id != 0, "Listing does not exist");
        _;
    }
    
    /**
     * @dev Initialize the contract
     * @param _gigToken GigFi token address
     * @param _usdcToken USDC token address
     * @param _stakingContract Staking contract address
     */
    function initialize(
        address _gigToken,
        address _usdcToken,
        address _stakingContract
    ) external initializer {
        require(_gigToken != address(0), "Invalid GigFi token");
        require(_usdcToken != address(0), "Invalid USDC token");
        require(_stakingContract != address(0), "Invalid staking contract");
        
        gigToken = IERC20(_gigToken);
        usdcToken = IERC20(_usdcToken);
        stakingContract = _stakingContract;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Create a new listing
     * @param name Listing name
     * @param description Listing description
     * @param price Price in USDC
     * @param gigPrice Price in GigCoin
     * @param metadata Additional listing metadata
     */
    function createListing(
        string memory name,
        string memory description,
        uint256 price,
        uint256 gigPrice,
        string memory metadata
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(bytes(name).length > 0, "Name required");
        require(price >= MINIMUM_LISTING_PRICE, "Price too low");
        
        uint256 listingId = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    msg.sender,
                    userListings[msg.sender].length
                )
            )
        );
        
        Listing storage listing = listings[listingId];
        listing.id = listingId;
        listing.name = name;
        listing.description = description;
        listing.price = price;
        listing.gigPrice = gigPrice;
        listing.seller = msg.sender;
        listing.status = ListingStatus.Active;
        listing.metadata = metadata;
        listing.createdAt = block.timestamp;
        
        userListings[msg.sender].push(listingId);
        
        emit ListingCreated(
            listingId,
            msg.sender,
            name,
            price,
            gigPrice
        );
        
        return listingId;
    }
    
    /**
     * @dev Purchase a listing
     * @param listingId Listing ID
     * @param useGigCoin Whether to pay with GigCoin
     */
    function buyListing(uint256 listingId, bool useGigCoin)
        external
        whenNotPaused
        nonReentrant
        validListing(listingId)
    {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Active, "Listing not active");
        require(listing.seller != msg.sender, "Cannot buy own listing");
        
        uint256 price = useGigCoin ? listing.gigPrice : listing.price;
        IERC20 token = useGigCoin ? gigToken : usdcToken;
        
        uint256 fee = (price * PLATFORM_FEE) / FEE_DENOMINATOR;
        uint256 sellerAmount = price - fee;
        
        require(
            token.transferFrom(msg.sender, address(this), price),
            "Transfer failed"
        );
        
        userBalance[listing.seller] += sellerAmount;
        listing.buyer = msg.sender;
        listing.status = ListingStatus.Sold;
        
        emit ListingPurchased(listingId, msg.sender, useGigCoin);
    }
    
    /**
     * @dev Complete a listing
     * @param listingId Listing ID
     */
    function completeListing(uint256 listingId)
        external
        whenNotPaused
        nonReentrant
        validListing(listingId)
        onlyListingOwner(listingId)
    {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Sold, "Invalid status");
        
        listing.status = ListingStatus.Completed;
        emit ListingCompleted(listingId);
    }
    
    /**
     * @dev Cancel a listing
     * @param listingId Listing ID
     */
    function cancelListing(uint256 listingId)
        external
        whenNotPaused
        nonReentrant
        validListing(listingId)
        onlyListingOwner(listingId)
    {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Active, "Cannot cancel");
        
        listing.status = ListingStatus.Cancelled;
        emit ListingCancelled(listingId);
    }
    
    /**
     * @dev Withdraw accumulated funds
     * @param amount Amount to withdraw
     */
    function withdrawFunds(uint256 amount)
        external
        whenNotPaused
        nonReentrant
    {
        require(amount > 0, "Invalid amount");
        require(userBalance[msg.sender] >= amount, "Insufficient balance");
        
        userBalance[msg.sender] -= amount;
        require(
            usdcToken.transfer(msg.sender, amount),
            "Transfer failed"
        );
        
        emit FundsWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Get listing details
     * @param listingId Listing ID
     */
    function getListingDetails(uint256 listingId)
        external
        view
        validListing(listingId)
        returns (Listing memory)
    {
        return listings[listingId];
    }
    
    /**
     * @dev Get user's listings
     * @param user User address
     */
    function getUserListings(address user)
        external
        view
        returns (uint256[] memory)
    {
        return userListings[user];
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Update platform fee
     * @param newFee New fee percentage (basis points)
     */
    function updatePlatformFee(uint256 newFee)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        // Platform fee updated
    }
}