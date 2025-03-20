// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@thirdweb-dev/contracts/base/ERC20Base.sol";
import "@thirdweb-dev/contracts/extension/Permissions.sol";

contract GigFiToken is ERC20Base, Permissions {
    // Constants
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant PURCHASE_PRICE = 0.01 ether; // 1 GigFi = 0.01 ETH

    // Events
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 ethPaid);
    event TokensSold(address indexed seller, uint256 amount, uint256 ethReceived);

    constructor(
        address _defaultAdmin
    ) ERC20Base(_defaultAdmin, "GigFi", "GIG") {
        _setupRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _mint(_defaultAdmin, INITIAL_SUPPLY);
    }

    // Buy tokens with ETH
    function buyTokens() external payable {
        require(msg.value > 0, "Must send ETH to buy tokens");
        uint256 tokenAmount = (msg.value * 10**18) / PURCHASE_PRICE;
        require(balanceOf(owner()) >= tokenAmount, "Insufficient tokens in contract");
        
        _transfer(owner(), msg.sender, tokenAmount);
        emit TokensPurchased(msg.sender, tokenAmount, msg.value);
    }

    // Sell tokens back to the contract
    function sellTokens(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        uint256 ethAmount = (amount * PURCHASE_PRICE) / 10**18;
        require(address(this).balance >= ethAmount, "Insufficient ETH in contract");
        
        _transfer(msg.sender, owner(), amount);
        payable(msg.sender).transfer(ethAmount);
        emit TokensSold(msg.sender, amount, ethAmount);
    }

    // Receive ETH
    receive() external payable {}
}