import { Core } from '@walletconnect/core';
import { WalletKit } from '@reown/walletkit';

const core = new Core({
  projectId: 'ab3277082b7e39e9f92687f63d78aacc'
});

const metadata = {
  name: 'GigFi',
  description: 'Transform your gig economy earnings with crypto',
  url: window.location.origin,
  icons: ['https://assets.reown.com/reown-profile-pic.png']
};

let walletKitInstance: WalletKit | null = null;

export const initWalletKit = async (): Promise<WalletKit> => {
  if (walletKitInstance) {
    return walletKitInstance;
  }

  try {
    const kit = new WalletKit({
      core,
      metadata
    });
    
    await kit.initialize();
    walletKitInstance = kit;
    return kit;
  } catch (error) {
    console.error('Failed to initialize WalletKit:', error);
    throw error;
  }
};

export const getWalletKit = (): WalletKit | null => walletKitInstance;

export const disconnectWalletKit = async () => {
  if (walletKitInstance) {
    try {
      await walletKitInstance.disconnect();
      walletKitInstance = null;
    } catch (error) {
      console.error('Error disconnecting WalletKit:', error);
      throw error;
    }
  }
};