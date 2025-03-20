import { ListingType } from '../types/marketplace';

export const originalListings: ListingType[] = [
  {
    id: 1,
    name: 'From airport to downtown ride share',
    description: 'Reliable ride-share service, max mileage: 15 miles, 1-2 hours',
    price: 30,
    gigCoinPrice: 300,
    distance: '15 miles',
    tags: ['Rideshare', 'Transportation'],
    type: 'service',
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&auto=format&fit=crop'
  },
  {
    id: 2,
    name: 'Express Downtown Delivery Route',
    description: 'Fast and reliable package delivery from downtown to residential areas, less than 1 week, max mileage: 10 miles from airport to downtown',
    price: 25,
    gigCoinPrice: 250,
    distance: '5 miles',
    tags: ['Rideshare & Delivery'],
    type: 'service',
    image: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&auto=format&fit=crop'
  },
  {
    id: 3,
    name: 'Experienced Plumber for Home Renovation',
    description: 'Licensed plumber needed for bathroom remodeling project, 2-4 weeks, includes fixture installation',
    price: 75,
    gigCoinPrice: 750,
    distance: '2 miles',
    tags: ['Skilled Trades', 'Plumbing', 'Renovation', 'Licensed'],
    type: 'service',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop'
  },
  {
    id: 4,
    name: 'Custom Graphic Design Package',
    description: 'Professional logo and branding, 1 week delivery, includes 3 revisions',
    price: 50,
    gigCoinPrice: 500,
    distance: 'Remote',
    tags: ['Digital Services', 'Design', 'Freelance'],
    type: 'service',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop'
  },
  {
    id: 5,
    name: 'Used Laptop for Sale',
    description: 'High-spec laptop, like new, immediate pickup, 16GB RAM, 512GB SSD',
    price: 300,
    gigCoinPrice: 3000,
    distance: '10 miles',
    tags: ['Electronics', 'For Sale', 'Tech'],
    type: 'product',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop'
  },
  {
    id: 8,
    name: 'Product Review Survey - Smart Watch',
    description: 'Complete a 5-minute survey about your experience with the latest smartwatch. Share your thoughts on features, usability, and overall satisfaction.',
    price: 0,
    gigCoinPrice: 50,
    distance: 'Remote',
    tags: ['Survey', 'Product Testing', 'Electronics'],
    type: 'survey',
    reward: 50,
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop',
    questions: [
      {
        id: 1,
        question: 'How satisfied are you with the battery life?',
        type: 'rating',
        options: ['1', '2', '3', '4', '5']
      },
      {
        id: 2,
        question: 'What features do you use most frequently?',
        type: 'multiple',
        options: ['Fitness tracking', 'Notifications', 'Heart rate monitoring', 'Sleep tracking']
      },
      {
        id: 3,
        question: 'What improvements would you suggest?',
        type: 'text'
      }
    ]
  }
];

export const mockDropshippingProducts: ListingType[] = [
  {
    id: 6,
    name: 'Wireless Earbuds',
    description: 'High-quality wireless earbuds with noise cancellation',
    price: 20,
    gigCoinPrice: 200,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop',
    category: 'Electronics',
    subcategory: 'Headphones',
    stock: 100,
    shipping: 'Free',
    rating: 4.5,
    type: 'product'
  },
  {
    id: 7,
    name: 'Premium Cotton T-Shirt',
    description: 'Comfortable cotton t-shirt, available in multiple colors',
    price: 15,
    gigCoinPrice: 150,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop',
    category: 'Clothing',
    subcategory: 'T-Shirts',
    stock: 200,
    shipping: 'Free',
    rating: 4.8,
    type: 'product'
  }
];

export const categories = [
  {
    name: 'Electronics',
    subcategories: ['Headphones', 'Wearables', 'Accessories', 'Smartphones', 'Laptops'],
  },
  {
    name: 'Clothing',
    subcategories: ['T-Shirts', 'Hoodies', 'Pants', 'Shoes', 'Accessories'],
  },
  {
    name: 'Services',
    subcategories: ['Rideshare', 'Delivery', 'Skilled Trades', 'Digital Services'],
  },
  {
    name: 'Online Surveys',
    subcategories: ['Market Research', 'Product Testing', 'User Experience', 'Academic'],
  }
];