// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@thirdweb-dev/contracts/extension/PermissionsEnumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GigFiLottery is ReentrancyGuard, PermissionsEnumerable {
    // Constants
    uint256 public constant TICKET_PRICE = 1 * 10**18; // 1 GigCoin
    uint256 public constant MIN_PLAYERS = 10;
    uint256 public constant MAX_PLAYERS = 1000;
    uint256 public constant DRAW_INTERVAL = 1 days;

    // State variables
    IERC20 public gigToken;
    uint256 public roundId;
    uint256 public lastDrawTime;
    address[] public players;
    mapping(uint256 => address[]) public winners;
    mapping(uint256 => uint256) public prizePool;

    // Events
    event TicketPurchased(address indexed player, uint256 indexed roundId);
    event WinnersSelected(uint256 indexed roundId, address[] winners);
    event PrizeClaimed(address indexed winner, uint256 amount);

    constructor(address _defaultAdmin, address _gigToken) {
        _setupRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        gigToken = IERC20(_gigToken);
        lastDrawTime = block.timestamp;
        roundId = 1;
    }

    function buyTicket() external nonReentrant {
        require(players.length < MAX_PLAYERS, "Round is full");
        require(
            gigToken.transferFrom(msg.sender, address(this), TICKET_PRICE),
            "Token transfer failed"
        );

        players.push(msg.sender);
        prizePool[roundId] += TICKET_PRICE;
        
        emit TicketPurchased(msg.sender, roundId);

        if (players.length >= MAX_PLAYERS) {
            selectWinners();
        }
    }

    function selectWinners() public {
        require(
            block.timestamp >= lastDrawTime + DRAW_INTERVAL ||
            players.length >= MAX_PLAYERS,
            "Too early for draw"
        );
        require(players.length >= MIN_PLAYERS, "Not enough players");

        // Select winners using block hash as randomness source
        bytes32 randomSeed = keccak256(
            abi.encodePacked(
                blockhash(block.number - 1),
                block.timestamp,
                players.length
            )
        );

        address[] memory roundWinners = new address[](3);
        uint256[] memory winningIndexes = new uint256[](3);

        for (uint256 i = 0; i < 3; i++) {
            uint256 index;
            bool duplicate;
            do {
                duplicate = false;
                index = uint256(
                    keccak256(abi.encodePacked(randomSeed, i))
                ) % players.length;
                
                for (uint256 j = 0; j < i; j++) {
                    if (winningIndexes[j] == index) {
                        duplicate = true;
                        break;
                    }
                }
            } while (duplicate);

            winningIndexes[i] = index;
            roundWinners[i] = players[index];
        }

        winners[roundId] = roundWinners;
        emit WinnersSelected(roundId, roundWinners);

        // Reset for next round
        delete players;
        roundId++;
        lastDrawTime = block.timestamp;
    }

    function claimPrize(uint256 _roundId) external nonReentrant {
        address[] memory roundWinners = winners[_roundId];
        require(roundWinners.length > 0, "No winners for this round");

        bool isWinner = false;
        uint256 winnerIndex;
        for (uint256 i = 0; i < roundWinners.length; i++) {
            if (roundWinners[i] == msg.sender) {
                isWinner = true;
                winnerIndex = i;
                break;
            }
        }
        require(isWinner, "Not a winner");

        uint256 prize;
        if (winnerIndex == 0) {
            prize = (prizePool[_roundId] * 50) / 100; // 50% for first place
        } else if (winnerIndex == 1) {
            prize = (prizePool[_roundId] * 30) / 100; // 30% for second place
        } else {
            prize = (prizePool[_roundId] * 20) / 100; // 20% for third place
        }

        require(
            gigToken.transfer(msg.sender, prize),
            "Prize transfer failed"
        );
        
        emit PrizeClaimed(msg.sender, prize);
    }
}