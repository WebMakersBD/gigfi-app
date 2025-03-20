import React, { useState } from 'react';
import { Menu, Wallet, X, ChevronDown, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { WalletConnect } from './WalletConnect';
import { useWalletStore } from '../lib/store';

const Header = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const { username, setUsername, isConnected } = useWalletStore();

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername.trim()) {
      setUsername(newUsername.startsWith('@') ? newUsername : `@${newUsername}`);
      setIsEditingUsername(false);
      setNewUsername('');
    }
  };

  return (
    <>
      <header className="bg-gray-900 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isSidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            <Link to="/" className="flex items-center gap-3">
              <Wallet className="w-8 h-8 text-green-400" />
              {isConnected && username && (
                <div className="flex items-center gap-2">
                  {isEditingUsername ? (
                    <form onSubmit={handleUsernameSubmit} className="flex items-center">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder={username}
                        className="bg-gray-800 text-white px-2 py-1 rounded-lg text-sm w-32"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="ml-2 text-gray-400 hover:text-white"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="text-lg font-bold text-white">{username}</span>
                      <button
                        onClick={() => {
                          setIsEditingUsername(true);
                          setNewUsername(username);
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </Link>
          </div>

          <WalletConnect />
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />
      
      <div 
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 z-50 transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>
    </>
  );
};

export { Header };