import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const Pick4Game = () => {
  const [numbers, setNumbers] = useState(['', '', '', '']);

  return (
    <div className="bg-gray-800/50 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-center mb-4">Pick 4 Fun</h2>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {numbers.map((_, index) => (
          <button
            key={index}
            className="bg-white rounded-lg p-4 aspect-square flex items-center justify-center"
          >
            <ChevronDown className="w-6 h-6 text-gray-400" />
          </button>
        ))}
      </div>
      <button className="w-full bg-purple-500 text-white py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors">
        Play for 1 GigCoin
      </button>
      <p className="text-yellow-400 text-center text-sm mt-4">
        Playing is optional and risky—small chance to win, play responsibly!
      </p>
      <p className="text-gray-400 text-center text-sm mt-2">
        Lottery Balance: 0 GigCoin
      </p>
    </div>
  );
};