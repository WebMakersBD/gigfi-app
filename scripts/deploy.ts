import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy GigFiToken
  const GigFiToken = await ethers.getContractFactory("GigFiToken");
  const token = await GigFiToken.deploy();
  await token.waitForDeployment();
  console.log("GigFiToken deployed to:", await token.getAddress());

  // Deploy GigFiShareNFT
  const GigFiShareNFT = await ethers.getContractFactory("GigFiShareNFT");
  const nft = await GigFiShareNFT.deploy();
  await nft.waitForDeployment();
  console.log("GigFiShareNFT deployed to:", await nft.getAddress());

  // Deploy GigFiStaking
  const GigFiStaking = await ethers.getContractFactory("GigFiStaking");
  const staking = await GigFiStaking.deploy(
    await token.getAddress(),
    process.env.USDC_ADDRESS
  );
  await staking.waitForDeployment();
  console.log("GigFiStaking deployed to:", await staking.getAddress());

  // Deploy GigFiCore
  const GigFiCore = await ethers.getContractFactory("GigFiCore");
  const core = await GigFiCore.deploy(
    await token.getAddress(),
    process.env.USDC_ADDRESS,
    await staking.getAddress()
  );
  await core.waitForDeployment();
  console.log("GigFiCore deployed to:", await core.getAddress());

  // Set up contract relationships
  await token.grantRole(await token.DEFAULT_ADMIN_ROLE(), await core.getAddress());
  await token.grantRole(await token.DEFAULT_ADMIN_ROLE(), await staking.getAddress());
  
  // Save deployed addresses
  const addresses = {
    GIGFI_TOKEN_ADDRESS: await token.getAddress(),
    GIGFI_SHARE_NFT_ADDRESS: await nft.getAddress(),
    GIGFI_STAKING_ADDRESS: await staking.getAddress(),
    GIGFI_CORE_ADDRESS: await core.getAddress()
  };

  console.log("\nDeployment complete! Contract addresses:", addresses);
  
  // Write addresses to a file for easy updating of constants
  const fs = require('fs');
  fs.writeFileSync(
    'deployed-addresses.json',
    JSON.stringify(addresses, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });