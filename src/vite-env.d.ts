/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GIGFI_TOKEN_ADDRESS: string
  readonly VITE_GIGFI_CORE_ADDRESS: string
  readonly VITE_GIGFI_STAKING_ADDRESS: string
  readonly VITE_GIGFI_SHARE_NFT_ADDRESS: string
  readonly VITE_MAINNET_RPC_URL: string
  readonly VITE_MAINNET_WS_RPC_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (params?: any) => void) => void;
    removeListener: (event: string, callback: (params?: any) => void) => void;
  };
}