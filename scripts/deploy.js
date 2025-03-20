import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

// Validate private key format
function validatePrivateKey(key) {
  if (!key) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }
  
  // Remove 0x prefix if present
  const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
  
  // Check if key is valid hex and correct length (32 bytes = 64 chars)
  if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
    throw new Error('Invalid private key format. Expected 32 bytes (64 hex characters)');
  }
  
  return `0x${cleanKey}`;
}

async function main() {
  try {
    // Validate environment variables
    if (!process.env.VITE_MAINNET_RPC_URL) {
      throw new Error('VITE_MAINNET_RPC_URL environment variable is required');
    }

    if (!process.env.THIRDWEB_CLIENT_ID) {
      throw new Error('THIRDWEB_CLIENT_ID environment variable is required');
    }

    // Validate and format private key
    const privateKey = validatePrivateKey(process.env.PRIVATE_KEY);

    // Initialize provider and signer
    const provider = new ethers.providers.JsonRpcProvider(process.env.VITE_MAINNET_RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);

    console.log("Deploying contracts with address:", signer.address);

    // Initialize ThirdWeb SDK
    const sdk = await ThirdwebSDK.fromSigner(signer, "mainnet", {
      clientId: process.env.THIRDWEB_CLIENT_ID
    });

    console.log("Deploying contracts...");

    // Deploy GigFi Token
    const tokenContract = await sdk.deployer.deployToken({
      name: "GigFi",
      symbol: "GIG",
      primary_sale_recipient: signer.address,
    });
    console.log("GigFi Token deployed to:", tokenContract.address);

    // Deploy Staking Contract
    const stakingContract = await sdk.deployer.deployContract({
      name: "GigFiStaking",
      contractType: "custom",
      constructor_params: [
        signer.address, // Admin address
        tokenContract.address, // Staking token
        tokenContract.address  // Reward token
      ]
    });
    console.log("Staking Contract deployed to:", stakingContract.address);

    // Deploy Marketplace
    const marketplaceContract = await sdk.deployer.deployContract({
      name: "GigFiMarketplace",
      contractType: "marketplace",
      constructor_params: [
        signer.address // Admin address
      ]
    });
    console.log("Marketplace deployed to:", marketplaceContract.address);

    // Save deployment addresses
    const addresses = {
      VITE_GIGFI_TOKEN_ADDRESS: tokenContract.address,
      VITE_GIGFI_STAKING_ADDRESS: stakingContract.address,
      VITE_GIGFI_MARKETPLACE_ADDRESS: marketplaceContract.address
    };

    // Update .env file while preserving other variables
    const fs = require('fs');
    const envFile = '.env';
    let envContent = '';
    
    try {
      envContent = fs.readFileSync(envFile, 'utf8');
    } catch (error) {
      console.log('Creating new .env file');
    }

    // Update or add new variables
    Object.entries(addresses).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    });

    fs.writeFileSync(envFile, envContent.trim() + '\n');

    console.log("\nDeployment complete! Contract addresses saved to .env");
    console.log("\nContract Addresses:");
    Object.entries(addresses).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });

  } catch (error) {
    console.error("\nDeployment failed:", error.message);
    process.exit(1);
  }
}

main();