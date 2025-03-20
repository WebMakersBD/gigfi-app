import { Alchemy, Network } from 'alchemy-sdk';

// Initialize Alchemy SDK with default mainnet RPC
const config = {
  apiKey: "demo", // Using demo key since we're not using Alchemy's RPC
  network: Network.ETH_MAINNET,
  maxRetries: 5,
  wsEndpoint: "wss://eth-mainnet.g.alchemy.com/v2/demo"
};

const alchemy = new Alchemy(config);

// Event subscription setup
export const subscribeToEvents = () => {
  // Subscribe to pending transactions
  alchemy.ws.on('block', (blockNumber) => {
    console.log('New block mined:', blockNumber);
  });

  // Subscribe to specific contract events using proper event signature
  alchemy.ws.on(
    {
      address: import.meta.env.VITE_GIGFI_TOKEN_ADDRESS,
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // keccak256('Transfer(address,address,uint256)')
      ]
    },
    (log) => {
      // console.log('New transfer event:', log);
    }
  );
};

// Unsubscribe from events
export const unsubscribeFromEvents = () => {
  alchemy.ws.removeAllListeners();
};

export default alchemy;