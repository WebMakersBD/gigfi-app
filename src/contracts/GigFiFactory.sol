// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract GigFiFactory is Ownable, ReentrancyGuard {
    // Contract instances
    address public tokenImplementation;
    address public coreImplementation;
    address public stakingImplementation;
    address public nftImplementation;
    
    // ProxyAdmin for managing upgradeable contracts
    ProxyAdmin public proxyAdmin;
    
    // Deployed contract addresses
    struct DeployedContracts {
        address token;
        address core;
        address staking;
        address nft;
        uint256 deployedAt;
    }
    
    mapping(address => DeployedContracts) public deployments;
    
    event ContractsDeployed(
        address indexed deployer,
        address token,
        address core,
        address staking,
        address nft
    );
    
    constructor(
        address _tokenImpl,
        address _coreImpl,
        address _stakingImpl,
        address _nftImpl
    ) Ownable(msg.sender) {
        require(
            _tokenImpl != address(0) &&
            _coreImpl != address(0) &&
            _stakingImpl != address(0) &&
            _nftImpl != address(0),
            "Invalid implementation addresses"
        );
        
        tokenImplementation = _tokenImpl;
        coreImplementation = _coreImpl;
        stakingImplementation = _stakingImpl;
        nftImplementation = _nftImpl;
        
        proxyAdmin = new ProxyAdmin();
    }
    
    function deployContracts() external nonReentrant returns (DeployedContracts memory) {
        require(deployments[msg.sender].token == address(0), "Already deployed");
        
        // Deploy proxies
        TransparentUpgradeableProxy tokenProxy = new TransparentUpgradeableProxy(
            tokenImplementation,
            address(proxyAdmin),
            abi.encodeWithSignature("initialize()")
        );
        
        TransparentUpgradeableProxy nftProxy = new TransparentUpgradeableProxy(
            nftImplementation,
            address(proxyAdmin),
            abi.encodeWithSignature("initialize()")
        );
        
        TransparentUpgradeableProxy stakingProxy = new TransparentUpgradeableProxy(
            stakingImplementation,
            address(proxyAdmin),
            abi.encodeWithSignature("initialize(address,address)", address(tokenProxy), address(nftProxy))
        );
        
        TransparentUpgradeableProxy coreProxy = new TransparentUpgradeableProxy(
            coreImplementation,
            address(proxyAdmin),
            abi.encodeWithSignature("initialize(address,address,address)", 
                address(tokenProxy),
                address(stakingProxy),
                address(nftProxy)
            )
        );
        
        DeployedContracts memory contracts = DeployedContracts({
            token: address(tokenProxy),
            core: address(coreProxy),
            staking: address(stakingProxy),
            nft: address(nftProxy),
            deployedAt: block.timestamp
        });
        
        deployments[msg.sender] = contracts;
        
        emit ContractsDeployed(
            msg.sender,
            address(tokenProxy),
            address(coreProxy),
            address(stakingProxy),
            address(nftProxy)
        );
        
        return contracts;
    }
    
    function upgradeImplementation(
        address proxy,
        address newImplementation
    ) external onlyOwner {
        proxyAdmin.upgrade(ITransparentUpgradeableProxy(proxy), newImplementation);
    }
    
    function getDeployment(address deployer) external view returns (DeployedContracts memory) {
        return deployments[deployer];
    }
}