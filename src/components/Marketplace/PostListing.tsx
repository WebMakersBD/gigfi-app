import React, { useState, useRef } from 'react';
import { ChevronDown, Plus, X, Upload, Image as ImageIcon } from 'lucide-react';
import { categories, mockDropshippingProducts } from '../../data/mockListings';
import { ListingType, SurveyQuestion } from '../../types/marketplace';
import { useWalletStore } from '../../lib/store';

interface PostListingProps {
  onPost: (listing: ListingType) => void;
  onClose: () => void;
}

export const PostListing: React.FC<PostListingProps> = ({ onPost, onClose }) => {
  const [listingType, setListingType] = useState<'product' | 'service' | 'dropshipping' | 'survey'>('product');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ListingType | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [reward, setReward] = useState('');
  const [distance, setDistance] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { address } = useWalletStore();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddQuestion = () => {
    setSurveyQuestions([
      ...surveyQuestions,
      {
        id: Date.now(),
        question: '',
        type: 'multiple',
        options: [''],
      },
    ]);
  };

  const handleQuestionChange = (id: number, field: string, value: any) => {
    setSurveyQuestions(
      surveyQuestions.map(q => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let listing: ListingType;
    
    if (listingType === 'dropshipping' && selectedProduct) {
      listing = {
        ...selectedProduct,
        id: Date.now(),
      };
    } else if (listingType === 'survey') {
      listing = {
        id: Date.now(),
        name: title,
        description,
        price: 0,
        image: imagePreview || 'https://images.unsplash.com/photo-1516383740770-fbcc5ccbece0?w=800&auto=format&fit=crop',
        category: 'Online Surveys',
        subcategory: category,
        type: 'survey',
        reward: parseFloat(reward),
        questions: surveyQuestions,
        distance: 'Remote'
      };
    } else {
      listing = {
        id: Date.now(),
        name: title,
        description,
        price: parseFloat(price),
        gigCoinPrice: parseFloat(price) * 10,
        category,
        subcategory,
        type: listingType,
        distance: distance || 'Remote',
        tags: [category, subcategory],
        image: imagePreview
      };
    }

    console.log('Creating listing:', listing);
    onPost(listing);
    onClose();
  };

  const renderImageUpload = () => (
    <div className="mb-6">
      <label className="block text-gray-700 mb-2">Listing Image</label>
      <div className="relative">
        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              onClick={() => {
                setImagePreview('');
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-gray-500">Click to upload image</p>
            <p className="text-gray-400 text-sm">Max size: 5MB</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Post a Listing</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex gap-4">
            {['product', 'service', 'dropshipping', 'survey'].map((type) => (
              <button
                key={type}
                className={`px-4 py-2 rounded-lg ${
                  listingType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setListingType(type as any)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {listingType === 'dropshipping' ? (
            <div className="space-y-4">
              <label className="block">
                <span className="text-gray-700">Select Product</span>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const product = mockDropshippingProducts.find(
                      p => p.id === parseInt(e.target.value)
                    );
                    setSelectedProduct(product || null);
                  }}
                >
                  <option value="">Select a product</option>
                  {mockDropshippingProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.price}
                    </option>
                  ))}
                </select>
              </label>

              {selectedProduct && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h3 className="font-bold">{selectedProduct.name}</h3>
                  <p className="text-gray-600">{selectedProduct.description}</p>
                  <p className="text-lg font-bold mt-2">${selectedProduct.price}</p>
                </div>
              )}
            </div>
          ) : listingType === 'survey' ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Survey Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <textarea
                placeholder="Survey Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                required
              />

              {renderImageUpload()}

              <input
                type="number"
                placeholder="GigCoin Reward"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Questions</h3>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>

                {surveyQuestions.map((question, index) => (
                  <div key={question.id} className="bg-gray-50 p-4 rounded-lg">
                    <input
                      type="text"
                      placeholder="Question"
                      value={question.question}
                      onChange={(e) =>
                        handleQuestionChange(question.id, 'question', e.target.value)
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    
                    <select
                      value={question.type}
                      onChange={(e) =>
                        handleQuestionChange(question.id, 'type', e.target.value)
                      }
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    >
                      <option value="multiple">Multiple Choice</option>
                      <option value="text">Text Answer</option>
                      <option value="rating">Rating</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                required
              />

              {renderImageUpload()}

              <input
                type="number"
                placeholder="Price (USDC)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <input
                type="text"
                placeholder="Distance (e.g., '5 miles' or 'Remote')"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSubcategory('');
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategory
                  </label>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={!category}
                  >
                    <option value="">Select Subcategory</option>
                    {category &&
                      categories
                        .find((cat) => cat.name === category)
                        ?.subcategories.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Post Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};