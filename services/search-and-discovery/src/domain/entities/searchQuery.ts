export interface SearchQuery {
  userId?: string;
  searchTerm: string;
  filters?: {
    category?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
  };
  timestamp: Date;
}
