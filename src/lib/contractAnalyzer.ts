import { publicClient } from './contracts';
import { parseAbiItem, decodeEventLog, formatUnits } from 'viem';
import { GigCoinABI } from '../contracts/GigCoin';
import { GigFiCoreABI } from '../contracts/GigFiCore';
import { GigFiStakingABI } from '../contracts/GigFiStaking';
import { GigFiShareNFTABI } from '../contracts/GigFiShareNFT';
import { 
  GIGFI_TOKEN_ADDRESS,
  GIGFI_CORE_ADDRESS,
  GIGFI_STAKING_ADDRESS,
  GIGFI_SHARE_NFT_ADDRESS
} from './constants';

interface ContractDeployment {
  address: string;
  name: string;
  network: string;
  chainId: number;
  functionality: string;
  deploymentDate?: string;
  deploymentBlock?: number;
  status: 'active' | 'deprecated';
  implementation?: string;
  verified: boolean;
  dependencies: string[];
  abi: any;
}

const CONTRACTS: ContractDeployment[] = [
  {
    address: GIGFI_TOKEN_ADDRESS,
    name: 'GigFi Token',
    network: 'Ethereum Mainnet',
    chainId: 1,
    functionality: 'ERC20 token for the GigFi ecosystem',
    status: 'active',
    verified: false,
    dependencies: [],
    abi: GigCoinABI
  },
  {
    address: GIGFI_CORE_ADDRESS,
    name: 'GigFi Core',
    network: 'Ethereum Mainnet',
    chainId: 1,
    functionality: 'Core protocol logic and marketplace functionality',
    status: 'active',
    verified: false,
    dependencies: [GIGFI_TOKEN_ADDRESS],
    abi: GigFiCoreABI
  },
  {
    address: GIGFI_STAKING_ADDRESS,
    name: 'GigFi Staking',
    network: 'Ethereum Mainnet',
    chainId: 1,
    functionality: 'Staking and rewards distribution',
    status: 'active',
    verified: false,
    dependencies: [GIGFI_TOKEN_ADDRESS],
    abi: GigFiStakingABI
  },
  {
    address: GIGFI_SHARE_NFT_ADDRESS,
    name: 'GigFi Share NFT',
    network: 'Ethereum Mainnet',
    chainId: 1,
    functionality: 'NFT-based revenue sharing',
    status: 'active',
    verified: false,
    dependencies: [GIGFI_TOKEN_ADDRESS, GIGFI_STAKING_ADDRESS],
    abi: GigFiShareNFTABI
  }
];

interface ContractAnalysis {
  contract: ContractDeployment;
  bytecodeVerified: boolean;
  interfaceVerified: boolean;
  deploymentInfo?: {
    deployer: string;
    timestamp: string;
    blockNumber: number;
    transactionHash: string;
  };
  metrics: {
    totalTransactions?: number;
    uniqueUsers?: number;
    lastActivity?: string;
    gasUsed?: string;
  };
  events: {
    name: string;
    count: number;
    lastOccurrence?: string;
  }[];
  security: {
    adminAddress?: string;
    pausable: boolean;
    upgradeable: boolean;
    issues: string[];
  };
}

export async function analyzeDeployments(): Promise<ContractAnalysis[]> {
  const analyses: ContractAnalysis[] = [];

  for (const contract of CONTRACTS) {
    try {
      // Skip if address is invalid
      if (!contract.address || !/^0x[a-fA-F0-9]{40}$/.test(contract.address)) {
        continue;
      }

      const analysis: ContractAnalysis = {
        contract: { ...contract },
        bytecodeVerified: false,
        interfaceVerified: false,
        metrics: {},
        events: [],
        security: {
          pausable: false,
          upgradeable: false,
          issues: []
        }
      };

      // Verify bytecode
      const bytecode = await publicClient.getBytecode({
        address: contract.address as `0x${string}`
      });

      analysis.bytecodeVerified = bytecode !== null && bytecode !== '0x';

      if (!analysis.bytecodeVerified) {
        analysis.security.issues.push('No bytecode found at address');
        analyses.push(analysis);
        continue;
      }

      // Get deployment info
      const blockNumber = await publicClient.getBlockNumber();
      const deploymentBlock = await findDeploymentBlock(contract.address, blockNumber);

      if (deploymentBlock) {
        const block = await publicClient.getBlock({ blockNumber: BigInt(deploymentBlock) });
        const tx = await findDeploymentTransaction(contract.address, BigInt(deploymentBlock));

        if (tx) {
          analysis.deploymentInfo = {
            deployer: tx.from,
            timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
            blockNumber: deploymentBlock,
            transactionHash: tx.hash
          };
        }
      }

      // Verify interface
      const interfaceChecks = await Promise.allSettled([
        verifyERC20Interface(contract),
        verifyContractInterface(contract)
      ]);

      analysis.interfaceVerified = interfaceChecks.some(check => 
        check.status === 'fulfilled' && check.value
      );

      // Get metrics
      const [eventCounts, userStats] = await Promise.all([
        getEventMetrics(contract, blockNumber),
        getUserMetrics(contract, blockNumber)
      ]);

      analysis.events = eventCounts;
      analysis.metrics = {
        ...userStats,
        lastActivity: await getLastActivity(contract.address)
      };

      // Security checks
      analysis.security = {
        ...analysis.security,
        ...(await getSecurityInfo(contract))
      };

      // Update verification status
      analysis.contract.verified = analysis.bytecodeVerified && analysis.interfaceVerified;

      analyses.push(analysis);
    } catch (error) {
      console.error(`Failed to analyze ${contract.name}:`, error);
    }
  }

  return analyses;
}

async function findDeploymentBlock(address: string, currentBlock: bigint): Promise<number | null> {
  let left = 0;
  let right = Number(currentBlock);
  let deploymentBlock = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const code = await publicClient.getBytecode({
      address: address as `0x${string}`,
      blockNumber: BigInt(mid)
    });

    if (code && code !== '0x') {
      deploymentBlock = mid;
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return deploymentBlock;
}

async function findDeploymentTransaction(address: string, blockNumber: bigint) {
  const block = await publicClient.getBlock({
    blockNumber,
    includeTransactions: true
  });

  return block.transactions.find(tx => 
    'creates' in tx && tx.creates?.toLowerCase() === address.toLowerCase()
  );
}

async function verifyERC20Interface(contract: ContractDeployment): Promise<boolean> {
  try {
    const functions = ['name', 'symbol', 'decimals', 'totalSupply'];
    const results = await Promise.all(
      functions.map(fn =>
        publicClient.readContract({
          address: contract.address as `0x${string}`,
          abi: contract.abi,
          functionName: fn
        }).then(() => true).catch(() => false)
      )
    );
    return results.some(Boolean);
  } catch {
    return false;
  }
}

async function verifyContractInterface(contract: ContractDeployment): Promise<boolean> {
  try {
    // Try to call a view function
    await publicClient.readContract({
      address: contract.address as `0x${string}`,
      abi: contract.abi,
      functionName: 'name'
    });
    return true;
  } catch {
    return false;
  }
}

async function getEventMetrics(contract: ContractDeployment, currentBlock: bigint) {
  const events = [];
  const lookbackBlocks = 10000n;
  const fromBlock = currentBlock - lookbackBlocks;

  // Check Transfer events for tokens
  if (contract.name === 'GigFi Token') {
    const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
    const logs = await publicClient.getLogs({
      address: contract.address as `0x${string}`,
      event: transferEvent,
      fromBlock
    });

    events.push({
      name: 'Transfer',
      count: logs.length,
      lastOccurrence: logs[0] ? new Date(Number(logs[0].blockNumber) * 1000).toISOString() : undefined
    });
  }

  return events;
}

async function getUserMetrics(contract: ContractDeployment, currentBlock: bigint) {
  const metrics: ContractAnalysis['metrics'] = {};

  try {
    const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
    const logs = await publicClient.getLogs({
      address: contract.address as `0x${string}`,
      event: transferEvent,
      fromBlock: currentBlock - 10000n
    });

    const uniqueAddresses = new Set<string>();
    logs.forEach(log => {
      const decoded = decodeEventLog({
        abi: contract.abi,
        data: log.data,
        topics: log.topics
      });
      if ('args' in decoded) {
        uniqueAddresses.add(decoded.args.from as string);
        uniqueAddresses.add(decoded.args.to as string);
      }
    });

    metrics.totalTransactions = logs.length;
    metrics.uniqueUsers = uniqueAddresses.size;
    metrics.gasUsed = formatUnits(
      logs.reduce((sum, log) => sum + log.gasUsed, 0n),
      9
    );
  } catch (error) {
    console.error('Failed to get user metrics:', error);
  }

  return metrics;
}

async function getLastActivity(address: string): Promise<string | undefined> {
  try {
    const block = await publicClient.getBlock({ blockNumber: await publicClient.getBlockNumber() });
    return new Date(Number(block.timestamp) * 1000).toISOString();
  } catch {
    return undefined;
  }
}

async function getSecurityInfo(contract: ContractDeployment) {
  const security = {
    pausable: false,
    upgradeable: false,
    issues: [] as string[]
  };

  try {
    // Check if contract is pausable
    try {
      await publicClient.readContract({
        address: contract.address as `0x${string}`,
        abi: contract.abi,
        functionName: 'paused'
      });
      security.pausable = true;
    } catch {}

    // Check if contract is upgradeable
    const implementationSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
    const implementation = await publicClient.getStorageAt({
      address: contract.address as `0x${string}`,
      slot: implementationSlot as `0x${string}`
    });
    
    security.upgradeable = implementation !== '0x' && implementation !== '0x0000000000000000000000000000000000000000000000000000000000000000';

  } catch (error) {
    console.error('Failed to get security info:', error);
  }

  return security;
}

export async function generateDeploymentReport(): Promise<string> {
  const analyses = await analyzeDeployments();
  
  return `
GigFi Protocol Deployment Analysis
================================

${analyses.map(analysis => `
Contract: ${analysis.contract.name}
----------------------------------------
Address: ${analysis.contract.address}
Network: ${analysis.contract.network} (Chain ID: ${analysis.contract.chainId})
Status: ${analysis.contract.status}
Functionality: ${analysis.contract.functionality}

Deployment Information:
- Date: ${analysis.deploymentInfo?.timestamp || 'Unknown'}
- Block: ${analysis.deploymentInfo?.blockNumber || 'Unknown'}
- Deployer: ${analysis.deploymentInfo?.deployer || 'Unknown'}
- Transaction: ${analysis.deploymentInfo?.transactionHash || 'Unknown'}

Verification Status:
- Bytecode Verified: ${analysis.bytecodeVerified ? '✓' : '✗'}
- Interface Verified: ${analysis.interfaceVerified ? '✓' : '✗'}

Dependencies:
${analysis.contract.dependencies.map(dep => `- ${dep}`).join('\n')}

Metrics:
- Total Transactions: ${analysis.metrics.totalTransactions || 'Unknown'}
- Unique Users: ${analysis.metrics.uniqueUsers || 'Unknown'}
- Last Activity: ${analysis.metrics.lastActivity || 'Unknown'}
- Gas Used: ${analysis.metrics.gasUsed || 'Unknown'} ETH

Security:
- Pausable: ${analysis.security.pausable ? 'Yes' : 'No'}
- Upgradeable: ${analysis.security.upgradeable ? 'Yes' : 'No'}
${analysis.security.issues.length > 0 
  ? `- Issues:\n${analysis.security.issues.map(issue => `  • ${issue}`).join('\n')}`
  : '- No security issues found'}
`).join('\n')}

Summary
-------
Total Contracts: ${analyses.length}
Active Contracts: ${analyses.filter(a => a.contract.status === 'active').length}
Verified Contracts: ${analyses.filter(a => a.contract.verified).length}
Contracts with Issues: ${analyses.filter(a => a.security.issues.length > 0).length}
`;
}