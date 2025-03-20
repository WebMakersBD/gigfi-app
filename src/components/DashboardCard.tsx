import React from 'react';
import { TrendingUp } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string;
  showTrend?: boolean;
}

export const DashboardCard = ({ title, value, showTrend }: DashboardCardProps) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">{title}</h3>
          <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
        </div>
        {showTrend && (
          <TrendingUp className="w-5 h-5 text-green-400" />
        )}
      </div>
    </div>
  );
};