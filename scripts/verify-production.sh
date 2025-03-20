#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env

# Check contract addresses
echo "Verifying contract addresses..."
for addr in $VITE_GIGFI_TOKEN_ADDRESS $VITE_GIGFI_CORE_ADDRESS $VITE_GIGFI_STAKING_ADDRESS $VITE_GIGFI_SHARE_NFT_ADDRESS
do
  if [[ ! $addr =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo "Invalid contract address: $addr"
    exit 1
  fi
done

# Check RPC URLs
echo "Verifying RPC URLs..."
if ! curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' $VITE_MAINNET_RPC_URL > /dev/null; then
  echo "Invalid RPC URL"
  exit 1
fi

# Verify contract source code
echo "Verifying contract source code..."
npm run verify

echo "Verification complete!"