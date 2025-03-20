import { run } from "hardhat";
import * as dotenv from "dotenv";
import deployedAddresses from '../deployed-addresses.json';

dotenv.config();

async function main() {
  const {
    GIGFI_TOKEN_ADDRESS,
    GIGFI_SHARE_NFT_ADDRESS,
    GIGFI_STAKING_ADDRESS,
    GIGFI_CORE_ADDRESS
  } = deployedAddresses;

  console.log("Verifying contracts...");

  try {
    // Verify GigFiToken
    await run("verify:verify", {
      address: GIGFI_TOKEN_ADDRESS,
      constructorArguments: []
    });
    console.log("GigFiToken verified");

    // Verify GigFiShareNFT
    await run("verify:verify", {
      address: GIGFI_SHARE_NFT_ADDRESS,
      constructorArguments: []
    });
    console.log("GigFiShareNFT verified");

    // Verify GigFiStaking
    await run("verify:verify", {
      address: GIGFI_STAKING_ADDRESS,
      constructorArguments: [
        GIGFI_TOKEN_ADDRESS,
        process.env.USDC_ADDRESS
      ]
    });
    console.log("GigFiStaking verified");

    // Verify GigFiCore
    await run("verify:verify", {
      address: GIGFI_CORE_ADDRESS,
      constructorArguments: [
        GIGFI_TOKEN_ADDRESS,
        process.env.USDC_ADDRESS,
        GIGFI_STAKING_ADDRESS
      ]
    });
    console.log("GigFiCore verified");

  } catch (error) {
    console.error("Error during verification:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });