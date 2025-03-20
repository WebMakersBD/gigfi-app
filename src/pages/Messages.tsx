import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Search, Bell, Settings, Plus, Users, Home, ArrowLeft, MoreVertical, MessageCircle, Share2, ThumbsUp } from 'lucide-react';
import { ProfileSetup } from '../components/ProfileSetup';
import { useWalletStore } from '../lib/store';

interface Message {
  id: number;
  avatar: string;
  title: string;
  preview: string;
  date: string;
  unread?: boolean;
}

interface Room {
  id: number;
  icon: string;
  name: string;
  role: string;
  items?: string;
}

interface Person {
  id: number;
  avatar: string;
  name: string;
  location: string;
  timestamp: string;
  content: string;
  following?: boolean;
}

export const Messages = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'rooms' | 'people'>('messages');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { username } = useWalletStore();
  
  const messages: Message[] = []; // Empty array for production
  const rooms: Room[] = []; // Empty array for production
  const people: Person[] = []; // Empty array for production

  const filteredItems = () => {
    const query = searchQuery.toLowerCase();
    switch (activeTab) {
      case 'messages':
        return messages.filter(message =>
          message.title.toLowerCase().includes(query) ||
          message.preview.toLowerCase().includes(query)
        );
      case 'rooms':
        return rooms.filter(room =>
          room.name.toLowerCase().includes(query)
        );
      case 'people':
        return people.filter(person =>
          person.name.toLowerCase().includes(query) ||
          person.content.toLowerCase().includes(query)
        );
      default:
        return [];
    }
  };

  const renderAvatar = (src: string) => {
    if (src.startsWith('http')) {
      return (
        <img
          src={src}
          alt="avatar"
          className="w-12 h-12 rounded-full object-cover"
        />
      );
    }
    return (
      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium">
        {src}
      </div>
    );
  };

  const renderEmptyState = () => {
    switch (activeTab) {
      case 'messages':
        return (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <MessageCircle className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">
              No messages yet
            </h3>
            <p className="text-gray-400 text-center mb-6">
              Connect with other users to start messaging
            </p>
            <button 
              onClick={() => setActiveTab('people')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Find People
            </button>
          </div>
        );
      case 'rooms':
        return (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Users className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">
              No rooms yet
            </h3>
            <p className="text-gray-400 text-center mb-6">
              Create or join a room to start collaborating
            </p>
            <button 
              onClick={() => setShowProfileSetup(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Room
            </button>
          </div>
        );
      case 'people':
        return (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Users className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">
              Find your community
            </h3>
            <p className="text-gray-400 text-center mb-6">
              Connect with other GigFi users
            </p>
            {!username ? (
              <button
                onClick={() => setShowProfileSetup(true)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Set Up Profile
              </button>
            ) : (
              <button
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Browse People
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (selectedPerson) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedPerson(null)}
                className="text-gray-400 hover:text-white md:hidden"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                {renderAvatar(selectedPerson.avatar)}
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedPerson.name}</h2>
                  <p className="text-sm text-gray-400">{selectedPerson.location}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-gray-400 hover:text-white">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="text-gray-400 hover:text-white">
                <ThumbsUp className="w-5 h-5" />
              </button>
              <button className="text-gray-400 hover:text-white">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">{selectedPerson.timestamp}</span>
                </div>
                <p className="text-white">{selectedPerson.content}</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    const items = filteredItems();
    
    if (items.length === 0) {
      return renderEmptyState();
    }

    switch (activeTab) {
      case 'messages':
        return (
          <div className="space-y-2 p-4">
            {items.map((message: Message) => (
              <div
                key={message.id}
                className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                  message.unread
                    ? 'bg-gray-800'
                    : 'bg-gray-800/50 hover:bg-gray-800'
                }`}
              >
                {renderAvatar(message.avatar)}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-medium ${
                      message.unread ? 'text-white' : 'text-gray-300'
                    }`}>
                      {message.title}
                    </h3>
                    <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                      {message.date}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {message.preview}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'rooms':
        return (
          <div className="space-y-4 p-4">
            <div className="flex justify-between items-center sticky top-0 bg-gray-900 py-2">
              <h2 className="text-xl font-bold text-white">Spaces</h2>
              <button 
                onClick={() => setShowProfileSetup(true)}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Room</span>
              </button>
            </div>
            {items.map((room: Room) => (
              <div
                key={room.id}
                className="bg-gray-800/50 hover:bg-gray-800 rounded-lg p-4 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
                    {room.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{room.name}</h3>
                    <p className="text-sm text-gray-400">
                      {room.role} {room.items && `• ${room.items}`}
                    </p>
                  </div>
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'people':
        return (
          <div className="space-y-4 p-4">
            {items.map((person: Person) => (
              <div
                key={person.id}
                className="bg-gray-800/50 hover:bg-gray-800 rounded-lg p-4 transition-colors"
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-4">
                    {renderAvatar(person.avatar)}
                    <div>
                      <h3 className="text-white font-medium">{person.name}</h3>
                      <p className="text-sm text-gray-400">{person.location}</p>
                    </div>
                  </div>
                  <button 
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      person.following
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {person.following ? 'Following' : 'Follow'}
                  </button>
                </div>
                <p className="text-gray-300">{person.content}</p>
                <div className="flex gap-4 mt-4">
                  <button 
                    onClick={() => setSelectedPerson(person)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Message</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            {!username && (
              <button
                onClick={() => setShowProfileSetup(true)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Set up profile
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-all duration-200"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full ring-2 ring-gray-900"></span>
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-700">
                    <h3 className="text-white font-medium">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="px-4 py-3 hover:bg-gray-700 transition-colors">
                      <p className="text-sm text-white">No new notifications</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowProfileSetup(true)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-all duration-200"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          {(['messages', 'rooms', 'people'] as const).map((tab) => (
            <button
              key={tab}
              className={`flex-1 px-4 sm:px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => {
                setActiveTab(tab);
                setSelectedPerson(null);
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className={`${selectedPerson ? 'hidden md:block' : ''} md:col-span-1`}>
            {renderContent()}
          </div>
          {selectedPerson && (
            <div className="md:col-span-1 lg:col-span-2 bg-gray-800 rounded-lg overflow-hidden">
              {renderContent()}
            </div>
          )}
        </div>
      </div>

      {/* Profile Setup Modal */}
      {showProfileSetup && (
        <ProfileSetup onClose={() => setShowProfileSetup(false)} />
      )}
    </div>
  );
};