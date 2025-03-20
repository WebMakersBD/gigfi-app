import React from 'react';

export const TokenDetails = () => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-white mb-6">Token Details</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-gray-400 mb-2">Total Supply</h3>
          <p className="text-4xl font-bold text-white">1B</p>
        </div>

        <div>
          <h3 className="text-gray-400 mb-2">Price</h3>
          <div className="space-y-1">
            <p className="text-white">Presale: $0.01</p>
            <p className="text-white">Launch: $0.05</p>
            <p className="text-white">Predicted: $0.50</p>
          </div>
        </div>

        <div>
          <h3 className="text-gray-400 mb-2">Caps</h3>
          <div className="space-y-1">
            <p className="text-white">Soft Cap: $500k</p>
            <p className="text-white">Hard Cap: $2M</p>
          </div>
        </div>

        <div>
          <h3 className="text-gray-400 mb-2">Allocation</h3>
          <div className="space-y-1">
            <p className="text-white">50% Presale</p>
            <p className="text-white">20% Rewards</p>
            <p className="text-white">20% Treasury</p>
            <p className="text-white">10% Team (2yr lock)</p>
          </div>
        </div>
      </div>
    </div>
  );
};