import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, DollarSign, Layers, ShoppingBag, MessageSquare, Gift } from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/dashboard', icon: Wallet, label: 'Dashboard' },
    { path: '/income', icon: DollarSign, label: 'Income' },
    { path: '/staking', icon: Layers, label: 'Staking' },
    { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/rewards', icon: Gift, label: 'Rewards' },
  ];

  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Wallet className="w-6 h-6 text-green-400" />
            <span className="text-xl font-bold text-white">GigFi</span>
          </Link>
          <div className="flex space-x-4">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === path
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};