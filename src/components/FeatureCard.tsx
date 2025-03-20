import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description?: string;
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
  subtitle?: string;
}

export const FeatureCard = ({ title, description, color, isExpanded, onToggle, subtitle }: FeatureCardProps) => {
  return (
    <div 
      className={`mb-4 rounded-lg border ${color} p-4 cursor-pointer transition-all duration-200`} 
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-xl font-semibold text-white ${isExpanded ? 'underline' : ''}`}>{title}</h3>
          {isExpanded && subtitle && (
            <p className="mt-2 text-sm font-medium text-gray-300">{subtitle}</p>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-6 h-6 text-white" />
        ) : (
          <ChevronDown className="w-6 h-6 text-white" />
        )}
      </div>
      {isExpanded && description && (
        <p className="mt-2 text-gray-300">{description}</p>
      )}
    </div>
  );
};