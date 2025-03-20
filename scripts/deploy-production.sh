#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env

# Check required environment variables
if [ -z "$VITE_MAINNET_RPC_URL" ] || [ -z "$PRIVATE_KEY" ]; then
  echo "Error: Missing required environment variables"
  exit 1
fi

# Compile contracts
echo "Compiling contracts..."
npm run compile

# Deploy contracts
echo "Deploying contracts..."
npm run deploy

# Build frontend
echo "Building frontend..."
npm run build

# Run tests
echo "Running tests..."
npm run test

# Type check
echo "Running type check..."
npm run typecheck

# Lint
echo "Running linter..."
npm run lint

echo "Deployment complete!"