require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const validatePrivateKey = (key) => {
  if (!key) return null;
  // Remove 0x prefix if present
  const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
  // Check if key is valid hex and correct length (32 bytes = 64 chars)
  if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
    throw new Error('Invalid private key format. Expected 32 bytes (64 hex characters)');
  }
  return `0x${cleanKey}`;
};

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mainnet: {
      url: "https://1.rpc.thirdweb.com/$AcrbfQQqxhJDUHbniqFt3MRBtZI_EAj81dgF60uu6eTW8womOX2S0_SWglwbX1IZW5lze_HbtC7VtcxJtdY70g",
      accounts: (() => {
        const key = validatePrivateKey(process.env.PRIVATE_KEY);
        return key ? [key] : [];
      })(),
      chainId: 1,
      gasPrice: "auto"
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  paths: {
    sources: "./src/contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};