export interface ListingType {
  id: number;
  name: string;
  description: string;
  price: number;
  gigCoinPrice?: number;
  image?: string;
  category?: string;
  subcategory?: string;
  distance?: string;
  tags?: string[];
  stock?: number;
  shipping?: string;
  rating?: number;
  type?: 'product' | 'service' | 'survey';
  reward?: number;
  questions?: SurveyQuestion[];
}

export interface SurveyQuestion {
  id: number;
  question: string;
  type: 'multiple' | 'text' | 'rating';
  options?: string[];
}

export interface Category {
  name: string;
  subcategories: string[];
}

export interface FilterState {
  search: string;
  category: string;
  subcategory: string;
  distance: string;
  minPrice?: number;
  maxPrice?: number;
}