import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, DollarSign, ShoppingBag, TrendingUp, Gift, MessageSquare, X } from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/income', icon: DollarSign, label: 'Income' },
    { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
    { path: '/staking', icon: TrendingUp, label: 'Staking' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/rewards', icon: Gift, label: 'Rewards' },
  ];

  return (
    <div className="h-full bg-gray-900 text-white p-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-medium">Menu</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <nav className="space-y-2">
        {menuItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === path
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};