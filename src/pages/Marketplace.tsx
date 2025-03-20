import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Search, ChevronDown, Plus, Filter } from 'lucide-react';
import { PostListing } from '../components/Marketplace/PostListing';
import { categories, originalListings, mockDropshippingProducts } from '../data/mockListings';
import { ListingType, FilterState } from '../types/marketplace';
import { useWalletStore } from '../lib/store';

export const Marketplace = () => {
  const [isPostingListing, setIsPostingListing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState<ListingType[]>([
    ...originalListings,
    ...mockDropshippingProducts
  ]);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    subcategory: '',
    distance: '50 miles',
  });

  const { address } = useWalletStore();

  const handlePostListing = (listing: ListingType) => {
    console.log('New listing created:', listing);
    setListings([listing, ...listings]);
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = filters.search
      ? listing.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        listing.description.toLowerCase().includes(filters.search.toLowerCase())
      : true;

    const matchesCategory = filters.category
      ? (listing.category === filters.category || 
         (listing.tags && listing.tags.includes(filters.category)))
      : true;

    return matchesSearch && matchesCategory;
  });

  const renderTags = (tags?: string[]) => {
    if (!tags) return null;
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map(tag => (
          <span
            key={tag}
            className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-4xl font-bold text-white">Marketplace</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-white bg-gray-800 rounded-lg md:hidden"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className={`space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search listings..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-3">
            {/* Categories Filter */}
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Distance Filter */}
            <select
              value={filters.distance}
              onChange={(e) => setFilters({ ...filters, distance: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
            >
              <option value="5 miles">5 miles</option>
              <option value="10 miles">10 miles</option>
              <option value="25 miles">25 miles</option>
              <option value="50 miles">50 miles</option>
              <option value="100 miles">100 miles</option>
            </select>
          </div>
        </div>

        {/* Listings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              {listing.image && (
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <img 
                    src={listing.image} 
                    alt={listing.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              <div className="p-4">
                <h2 className="text-lg font-bold text-white mb-2 line-clamp-1">{listing.name}</h2>
                
                {renderTags(listing.tags)}
                
                <p className="text-gray-300 mb-4 text-sm line-clamp-2">{listing.description}</p>
                
                <div className="text-gray-400 text-sm mb-3">
                  {listing.distance}
                </div>

                <div className="mb-4">
                  <div className="text-xl font-bold text-white">
                    ${listing.price.toFixed(2)} USDC
                  </div>
                  <div className="text-gray-400 text-sm">
                    or {listing.gigCoinPrice?.toFixed(1)} GigCoin
                  </div>
                </div>

                <button
                  className={`w-full py-2.5 rounded-lg font-medium text-white text-sm ${
                    listing.type === 'product' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  } transition-colors`}
                >
                  {listing.type === 'product' ? 'Buy Now' : 'Book Now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Post a Listing Button - Fixed at bottom on mobile */}
        <div className="fixed bottom-4 left-4 right-4 md:static md:mt-8 md:bg-transparent z-10">
          <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
            <button
              onClick={() => setIsPostingListing(true)}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Post Listing</span>
            </button>
          </div>
        </div>

        {isPostingListing && (
          <PostListing
            onPost={handlePostListing}
            onClose={() => setIsPostingListing(false)}
          />
        )}
      </div>
    </div>
  );
};