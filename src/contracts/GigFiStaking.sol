// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@thirdweb-dev/contracts/base/Staking20Base.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title GigFiStaking
 * @dev Manages staking for both GigFi Pension and Share NFTs
 */
contract GigFiStaking is Staking20Base, ReentrancyGuard, Pausable {
    // Staking types
    enum StakingType { Regular, Pension, NFTShare }

    // Staking periods and APY rates (in basis points, 1% = 100)
    uint256 public constant PERIOD_30_DAYS = 30 days;
    uint256 public constant PERIOD_60_DAYS = 60 days;
    uint256 public constant PERIOD_90_DAYS = 90 days;
    uint256 public constant PERIOD_180_DAYS = 180 days;
    uint256 public constant PENSION_MIN_LOCK = 365 days;
    uint256 public constant EARLY_WITHDRAWAL_PENALTY = 2000; // 20%

    // Minimum staking amounts
    uint256 public constant MIN_STAKE = 100 * 10**18; // 100 tokens
    uint256 public constant MIN_PENSION_STAKE = 1000 * 10**18; // 1000 tokens

    // State variables
    IERC721 public shareNFT;
    mapping(uint256 => uint256) public periodToRate;
    mapping(address => mapping(StakingType => StakingPosition[])) public userStakingPositions;
    mapping(uint256 => bool) public nftStaked; // NFT token ID => staked status

    // Structs
    struct StakingPosition {
        uint256 id;
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 lastClaimTime;
        uint256 rewardRate;
        StakingType stakingType;
        bool active;
    }

    // Events
    event Staked(
        address indexed user,
        uint256 indexed positionId,
        uint256 amount,
        StakingType stakingType,
        uint256 duration
    );

    event Unstaked(
        address indexed user,
        uint256 indexed positionId,
        uint256 amount,
        uint256 penalty
    );

    event RewardsClaimed(
        address indexed user,
        uint256 indexed positionId,
        uint256 amount
    );

    event NFTStaked(
        address indexed user,
        uint256 indexed tokenId,
        uint256 indexed positionId
    );

    event NFTUnstaked(
        address indexed user,
        uint256 indexed tokenId,
        uint256 indexed positionId,
        uint256 rewards
    );

    constructor(
        address _defaultAdmin,
        address _stakingToken,
        address _rewardToken,
        address _shareNFT
    ) Staking20Base(_defaultAdmin, _stakingToken, _rewardToken) {
        require(_shareNFT != address(0), "Invalid NFT address");
        shareNFT = IERC721(_shareNFT);

        // Initialize staking rates
        periodToRate[PERIOD_30_DAYS] = 400;   // 4% APY
        periodToRate[PERIOD_60_DAYS] = 600;   // 6% APY
        periodToRate[PERIOD_90_DAYS] = 800;   // 8% APY
        periodToRate[PERIOD_180_DAYS] = 1200; // 12% APY
    }

    /**
     * @dev Stake tokens with specified duration and type
     * @param amount Amount to stake
     * @param duration Staking duration
     * @param stakingType Type of staking (Regular, Pension, NFTShare)
     */
    function stake(
        uint256 amount,
        uint256 duration,
        StakingType stakingType
    ) external nonReentrant whenNotPaused {
        require(amount >= MIN_STAKE, "Below minimum stake amount");
        
        if (stakingType == StakingType.Pension) {
            require(amount >= MIN_PENSION_STAKE, "Below minimum pension stake");
            require(duration >= PENSION_MIN_LOCK, "Below minimum pension lock");
        } else {
            require(periodToRate[duration] > 0, "Invalid duration");
        }

        uint256 positionId = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    msg.sender,
                    userStakingPositions[msg.sender][stakingType].length
                )
            )
        );

        // Transfer tokens to contract
        require(
            stakingToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // Create staking position
        StakingPosition memory position = StakingPosition({
            id: positionId,
            amount: amount,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            lastClaimTime: block.timestamp,
            rewardRate: stakingType == StakingType.Pension ? 1200 : periodToRate[duration],
            stakingType: stakingType,
            active: true
        });

        userStakingPositions[msg.sender][stakingType].push(position);

        emit Staked(
            msg.sender,
            positionId,
            amount,
            stakingType,
            duration
        );
    }

    /**
     * @dev Stake NFT shares
     * @param tokenId NFT token ID to stake
     */
    function stakeNFT(uint256 tokenId) external nonReentrant whenNotPaused {
        require(!nftStaked[tokenId], "NFT already staked");
        require(
            shareNFT.ownerOf(tokenId) == msg.sender,
            "Not NFT owner"
        );

        // Transfer NFT to contract
        shareNFT.transferFrom(msg.sender, address(this), tokenId);
        nftStaked[tokenId] = true;

        uint256 positionId = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    msg.sender,
                    tokenId
                )
            )
        );

        // Create NFT staking position
        StakingPosition memory position = StakingPosition({
            id: positionId,
            amount: 1, // 1 NFT
            startTime: block.timestamp,
            endTime: 0, // No end time for NFT staking
            lastClaimTime: block.timestamp,
            rewardRate: 1500, // 15% APY for NFT staking
            stakingType: StakingType.NFTShare,
            active: true
        });

        userStakingPositions[msg.sender][StakingType.NFTShare].push(position);

        emit NFTStaked(msg.sender, tokenId, positionId);
    }

    /**
     * @dev Unstake tokens from a position
     * @param positionId Staking position ID
     */
    function unstake(uint256 positionId) external nonReentrant {
        StakingPosition[] storage positions = userStakingPositions[msg.sender][StakingType.Regular];
        StakingPosition storage position = findPosition(positions, positionId);
        require(position.active, "Position not active");

        uint256 penalty = 0;
        if (block.timestamp < position.endTime) {
            penalty = (position.amount * EARLY_WITHDRAWAL_PENALTY) / 10000;
        }

        uint256 rewards = calculateRewards(position);
        uint256 totalAmount = position.amount + rewards - penalty;

        position.active = false;

        require(
            stakingToken.transfer(msg.sender, totalAmount),
            "Transfer failed"
        );

        emit Unstaked(
            msg.sender,
            positionId,
            position.amount,
            penalty
        );

        if (rewards > 0) {
            emit RewardsClaimed(msg.sender, positionId, rewards);
        }
    }

    /**
     * @dev Unstake NFT and claim rewards
     * @param tokenId NFT token ID to unstake
     */
    function unstakeNFT(uint256 tokenId) external nonReentrant {
        require(nftStaked[tokenId], "NFT not staked");
        
        StakingPosition[] storage positions = userStakingPositions[msg.sender][StakingType.NFTShare];
        StakingPosition storage position = findNFTPosition(positions, tokenId);
        require(position.active, "Position not active");

        uint256 rewards = calculateRewards(position);
        position.active = false;
        nftStaked[tokenId] = false;

        // Transfer NFT back
        shareNFT.transferFrom(address(this), msg.sender, tokenId);

        // Transfer rewards
        if (rewards > 0) {
            require(
                stakingToken.transfer(msg.sender, rewards),
                "Reward transfer failed"
            );
        }

        emit NFTUnstaked(msg.sender, tokenId, position.id, rewards);
    }

    /**
     * @dev Calculate rewards for a staking position
     * @param position Staking position
     */
    function calculateRewards(
        StakingPosition memory position
    ) public view returns (uint256) {
        if (!position.active) return 0;

        uint256 timeElapsed = block.timestamp - position.lastClaimTime;
        return (position.amount * position.rewardRate * timeElapsed) / (365 days * 10000);
    }

    /**
     * @dev Find staking position by ID
     * @param positions Array of staking positions
     * @param positionId Position ID to find
     */
    function findPosition(
        StakingPosition[] storage positions,
        uint256 positionId
    ) internal view returns (StakingPosition storage) {
        for (uint256 i = 0; i < positions.length; i++) {
            if (positions[i].id == positionId) {
                return positions[i];
            }
        }
        revert("Position not found");
    }

    /**
     * @dev Find NFT staking position by token ID
     * @param positions Array of staking positions
     * @param tokenId NFT token ID
     */
    function findNFTPosition(
        StakingPosition[] storage positions,
        uint256 tokenId
    ) internal view returns (StakingPosition storage) {
        for (uint256 i = 0; i < positions.length; i++) {
            if (positions[i].active && positions[i].amount == 1) {
                return positions[i];
            }
        }
        revert("Position not found");
    }

    /**
     * @dev Get user's staking positions
     * @param user User address
     * @param stakingType Type of staking
     */
    function getUserStakingPositions(
        address user,
        StakingType stakingType
    ) external view returns (StakingPosition[] memory) {
        return userStakingPositions[user][stakingType];
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
}