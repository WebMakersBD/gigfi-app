// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@thirdweb-dev/contracts/base/Marketplace.sol";
import "@thirdweb-dev/contracts/extension/Permissions.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title GigFiMarketplace
 * @dev Implements secure escrow functionality for peer-to-peer transactions
 */
contract GigFiMarketplace is Marketplace, ReentrancyGuard, Pausable {
    // Constants
    uint256 public constant PLATFORM_FEE = 250; // 2.5%
    uint256 public constant ESCROW_LOCK_TIME = 7 days;
    uint256 public constant DISPUTE_WINDOW = 3 days;
    uint256 public constant MIN_ESCROW_AMOUNT = 0.01 ether;

    // Enums
    enum EscrowStatus {
        Created,
        Funded,
        Completed,
        Refunded,
        Disputed,
        Resolved
    }

    enum DisputeResolution {
        None,
        BuyerWins,
        SellerWins,
        Split
    }

    // Structs
    struct Escrow {
        uint256 id;
        address buyer;
        address seller;
        uint256 amount;
        uint256 platformFee;
        uint256 createdAt;
        uint256 completedAt;
        EscrowStatus status;
        string metadata;
        bool hasDispute;
        DisputeResolution resolution;
    }

    struct Dispute {
        uint256 escrowId;
        address initiator;
        string reason;
        uint256 createdAt;
        bool resolved;
        DisputeResolution resolution;
        string arbitratorNotes;
    }

    // State variables
    mapping(uint256 => Escrow) public escrows;
    mapping(uint256 => Dispute) public disputes;
    mapping(address => uint256[]) public userEscrows;
    uint256 public escrowCount;

    // Events
    event EscrowCreated(
        uint256 indexed id,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

    event EscrowFunded(uint256 indexed id, uint256 amount);
    
    event EscrowCompleted(
        uint256 indexed id,
        uint256 amount,
        uint256 platformFee
    );
    
    event EscrowRefunded(uint256 indexed id, uint256 amount);
    
    event DisputeCreated(
        uint256 indexed escrowId,
        address indexed initiator,
        string reason
    );
    
    event DisputeResolved(
        uint256 indexed escrowId,
        DisputeResolution resolution,
        string arbitratorNotes
    );

    constructor(
        address _defaultAdmin
    ) Marketplace(_defaultAdmin) {
        _setupRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
    }

    /**
     * @dev Create new escrow
     * @param seller Seller address
     * @param metadata Additional escrow metadata
     */
    function createEscrow(
        address seller,
        string memory metadata
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        require(msg.value >= MIN_ESCROW_AMOUNT, "Amount too low");
        require(seller != address(0) && seller != msg.sender, "Invalid seller");

        uint256 platformFee = (msg.value * PLATFORM_FEE) / 10000;
        uint256 escrowAmount = msg.value - platformFee;

        uint256 escrowId = ++escrowCount;

        Escrow storage escrow = escrows[escrowId];
        escrow.id = escrowId;
        escrow.buyer = msg.sender;
        escrow.seller = seller;
        escrow.amount = escrowAmount;
        escrow.platformFee = platformFee;
        escrow.createdAt = block.timestamp;
        escrow.status = EscrowStatus.Funded;
        escrow.metadata = metadata;

        userEscrows[msg.sender].push(escrowId);
        userEscrows[seller].push(escrowId);

        emit EscrowCreated(escrowId, msg.sender, seller, escrowAmount);
        emit EscrowFunded(escrowId, msg.value);

        return escrowId;
    }

    /**
     * @dev Complete escrow and release funds to seller
     * @param escrowId Escrow ID
     */
    function completeEscrow(
        uint256 escrowId
    ) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.buyer == msg.sender, "Not the buyer");
        require(escrow.status == EscrowStatus.Funded, "Invalid status");
        require(!escrow.hasDispute, "Escrow disputed");
        require(
            block.timestamp <= escrow.createdAt + ESCROW_LOCK_TIME,
            "Escrow expired"
        );

        escrow.status = EscrowStatus.Completed;
        escrow.completedAt = block.timestamp;

        // Transfer funds to seller
        (bool success, ) = escrow.seller.call{value: escrow.amount}("");
        require(success, "Transfer to seller failed");

        // Transfer platform fee
        (success, ) = owner().call{value: escrow.platformFee}("");
        require(success, "Platform fee transfer failed");

        emit EscrowCompleted(
            escrowId,
            escrow.amount,
            escrow.platformFee
        );
    }

    /**
     * @dev Create dispute for escrow
     * @param escrowId Escrow ID
     * @param reason Dispute reason
     */
    function createDispute(
        uint256 escrowId,
        string memory reason
    ) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(
            msg.sender == escrow.buyer || msg.sender == escrow.seller,
            "Not a party to escrow"
        );
        require(escrow.status == EscrowStatus.Funded, "Invalid status");
        require(!escrow.hasDispute, "Dispute exists");
        require(
            block.timestamp <= escrow.createdAt + DISPUTE_WINDOW,
            "Dispute window closed"
        );

        escrow.hasDispute = true;
        escrow.status = EscrowStatus.Disputed;

        disputes[escrowId] = Dispute({
            escrowId: escrowId,
            initiator: msg.sender,
            reason: reason,
            createdAt: block.timestamp,
            resolved: false,
            resolution: DisputeResolution.None,
            arbitratorNotes: ""
        });

        emit DisputeCreated(escrowId, msg.sender, reason);
    }

    /**
     * @dev Resolve dispute
     * @param escrowId Escrow ID
     * @param resolution Dispute resolution
     * @param notes Arbitrator notes
     */
    function resolveDispute(
        uint256 escrowId,
        DisputeResolution resolution,
        string memory notes
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        require(resolution != DisputeResolution.None, "Invalid resolution");

        Escrow storage escrow = escrows[escrowId];
        Dispute storage dispute = disputes[escrowId];

        require(escrow.hasDispute, "No dispute exists");
        require(!dispute.resolved, "Already resolved");

        dispute.resolved = true;
        dispute.resolution = resolution;
        dispute.arbitratorNotes = notes;

        escrow.status = EscrowStatus.Resolved;
        escrow.resolution = resolution;

        uint256 buyerAmount;
        uint256 sellerAmount;

        if (resolution == DisputeResolution.BuyerWins) {
            buyerAmount = escrow.amount + escrow.platformFee;
        } else if (resolution == DisputeResolution.SellerWins) {
            sellerAmount = escrow.amount;
            (bool success, ) = owner().call{value: escrow.platformFee}("");
            require(success, "Platform fee transfer failed");
        } else {
            // Split the funds
            buyerAmount = escrow.amount / 2;
            sellerAmount = escrow.amount / 2;
            (bool success, ) = owner().call{value: escrow.platformFee}("");
            require(success, "Platform fee transfer failed");
        }

        if (buyerAmount > 0) {
            (bool success, ) = escrow.buyer.call{value: buyerAmount}("");
            require(success, "Transfer to buyer failed");
        }

        if (sellerAmount > 0) {
            (bool success, ) = escrow.seller.call{value: sellerAmount}("");
            require(success, "Transfer to seller failed");
        }

        emit DisputeResolved(escrowId, resolution, notes);
    }

    /**
     * @dev Get escrow details
     * @param escrowId Escrow ID
     */
    function getEscrowDetails(
        uint256 escrowId
    ) external view returns (Escrow memory) {
        return escrows[escrowId];
    }

    /**
     * @dev Get dispute details
     * @param escrowId Escrow ID
     */
    function getDisputeDetails(
        uint256 escrowId
    ) external view returns (Dispute memory) {
        return disputes[escrowId];
    }

    /**
     * @dev Get user's escrows
     * @param user User address
     */
    function getUserEscrows(
        address user
    ) external view returns (uint256[] memory) {
        return userEscrows[user];
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
     * @dev Receive ETH
     */
    receive() external payable {}
}