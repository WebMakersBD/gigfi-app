import React from 'react';

interface ProgressBarProps {
  current: number;
  target: number;
}

export const ProgressBar = ({ current, target }: ProgressBarProps) => {
  const percentage = Math.min((current / target) * 100, 100);
  
  return (
    <div className="w-full">
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-sm">
        <span className="text-gray-300">${current.toFixed(2)}</span>
        <span className="text-gray-400">Target: ${target}</span>
      </div>
    </div>
  );
};