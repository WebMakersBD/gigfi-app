// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@thirdweb-dev/contracts/extension/PermissionsEnumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract GigFiRewards is ReentrancyGuard, PermissionsEnumerable {
    // Constants
    uint256 public constant POINTS_DECIMALS = 2;
    uint256 public constant MIN_POINTS = 100; // 1.00 points
    uint256 public constant POINTS_EXPIRY = 365 days;

    // Reward tiers
    enum Tier { Bronze, Silver, Gold, Platinum }

    struct TierConfig {
        uint256 minPoints;
        uint256 multiplier; // Basis points (100 = 1x)
        uint256 maxDailyPoints;
        bool active;
    }

    // Point transaction types
    enum TransactionType {
        Earned,
        Spent,
        Transferred,
        Expired
    }

    // State variables
    IERC20 public gigToken;
    mapping(address => uint256) public userPoints;
    mapping(address => uint256) public lifetimePoints;
    mapping(address => uint256) public lastActivity;
    mapping(Tier => TierConfig) public tiers;
    mapping(address => Tier) public userTiers;

    // Events
    event PointsEarned(address indexed user, uint256 amount, string activity);
    event PointsSpent(address indexed user, uint256 amount, string purpose);
    event TierUpdated(address indexed user, Tier oldTier, Tier newTier);

    constructor(address _defaultAdmin, address _gigToken) {
        _setupRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        gigToken = IERC20(_gigToken);

        // Initialize tiers
        tiers[Tier.Bronze] = TierConfig({
            minPoints: 0,
            multiplier: 100, // 1x
            maxDailyPoints: 1000000, // 10,000 points
            active: true
        });
        
        tiers[Tier.Silver] = TierConfig({
            minPoints: 100000, // 1,000 points
            multiplier: 125, // 1.25x
            maxDailyPoints: 2000000, // 20,000 points
            active: true
        });
        
        tiers[Tier.Gold] = TierConfig({
            minPoints: 500000, // 5,000 points
            multiplier: 150, // 1.5x
            maxDailyPoints: 5000000, // 50,000 points
            active: true
        });
        
        tiers[Tier.Platinum] = TierConfig({
            minPoints: 2000000, // 20,000 points
            multiplier: 200, // 2x
            maxDailyPoints: 10000000, // 100,000 points
            active: true
        });
    }

    function awardPoints(
        address user,
        uint256 amount,
        string memory activity
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(amount >= MIN_POINTS, "Below minimum points");
        
        Tier userTier = userTiers[user];
        TierConfig storage tier = tiers[userTier];
        require(tier.active, "Tier not active");

        // Apply tier multiplier
        uint256 multipliedAmount = (amount * tier.multiplier) / 100;
        
        userPoints[user] += multipliedAmount;
        lifetimePoints[user] += multipliedAmount;
        lastActivity[user] = block.timestamp;

        // Check for tier upgrade
        _checkAndUpdateTier(user);
        
        emit PointsEarned(user, multipliedAmount, activity);
    }

    function spendPoints(
        uint256 amount,
        string memory purpose
    ) external nonReentrant {
        require(userPoints[msg.sender] >= amount, "Insufficient points");
        
        userPoints[msg.sender] -= amount;
        lastActivity[msg.sender] = block.timestamp;
        
        emit PointsSpent(msg.sender, amount, purpose);
    }

    function _checkAndUpdateTier(address user) internal {
        uint256 points = lifetimePoints[user];
        Tier newTier = userTiers[user];

        // Check each tier from highest to lowest
        if (points >= tiers[Tier.Platinum].minPoints) {
            newTier = Tier.Platinum;
        } else if (points >= tiers[Tier.Gold].minPoints) {
            newTier = Tier.Gold;
        } else if (points >= tiers[Tier.Silver].minPoints) {
            newTier = Tier.Silver;
        } else {
            newTier = Tier.Bronze;
        }

        if (newTier != userTiers[user]) {
            Tier oldTier = userTiers[user];
            userTiers[user] = newTier;
            emit TierUpdated(user, oldTier, newTier);
        }
    }

    function getUserStats(
        address user
    ) external view returns (
        uint256 points,
        uint256 lifetime,
        Tier tier,
        uint256 lastActivityTime
    ) {
        return (
            userPoints[user],
            lifetimePoints[user],
            userTiers[user],
            lastActivity[user]
        );
    }
}