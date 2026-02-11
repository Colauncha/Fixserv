import { IUserRepository } from "../../domain/repositories/userRepository";
import { UserAggregate } from "../../domain/aggregates/userAggregate";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { redis, connectRedis } from "@fixserv-colauncha/shared";

export interface ICategoryService {
  getArtisansByCategory(
    category: string,
    page?: number,
    limit?: number,
    location?: string,
  ): Promise<{ artisans: UserAggregate[]; total: number }>;

  getArtisansByMultipleCategories(
    categories: string[],
    page?: number,
    limit?: number,
  ): Promise<{ artisans: UserAggregate[]; total: number }>;

  getAllCategories(): Promise<string[]>;

  searchArtisans(
    searchParams: ArtisanSearchParams,
  ): Promise<{ artisans: UserAggregate[]; total: number }>;
}

export interface ArtisanSearchParams {
  category?: string;
  categories?: string[];
  location?: string;
  minRating?: number;
  skills?: string[];
  page?: number;
  limit?: number;
}

export class CategoryService implements ICategoryService {
  constructor(private userRepository: IUserRepository) {}

  async getArtisansByCategory(
    category: string,
    page = 1,
    limit = 10,
    location?: string,
  ): Promise<{ artisans: UserAggregate[]; total: number }> {
    if (!category || category.trim().length === 0) {
      throw new BadRequestError("Category is required");
    }

    // If location is provided, use the location-aware query
    let result: { artisans: UserAggregate[]; total: number } | UserAggregate[];

    if (location && location.trim().length > 0) {
      result = await this.userRepository.findArtisansByCategoryAndLocation(
        category,
        location,
        page,
        limit,
      );
    } else {
      // Otherwise, just search by category
      result = await this.userRepository.findArtisansByCategory(
        category,
        page,
        limit,
      );
    }

    // Normalize result to { artisans, total }
    if (Array.isArray(result)) {
      return { artisans: result, total: result.length };
    }

    return result;
  }

  async getArtisansByMultipleCategories(
    categories: string[],
    page = 1,
    limit = 10,
  ): Promise<{ artisans: UserAggregate[]; total: number }> {
    if (!categories || categories.length === 0) {
      throw new BadRequestError("At least one category is required");
    }

    const result = await this.userRepository.findArtisansByCategories(
      categories,
      page,
      limit,
    );

    if (Array.isArray(result)) {
      return { artisans: result, total: result.length };
    }

    return result;
  }

  async getAllCategories(): Promise<string[]> {
    const cacheKey = "categories:all";
    await connectRedis();

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log("Cache HIT for all categories");
        return JSON.parse(cached);
      }

      console.log("Cache MISS for all categories");
      const categories = await this.userRepository.getAllCategories();

      // Cache for 30 minutes
      await redis.set(cacheKey, JSON.stringify(categories), {
        EX: 60 * 30,
      });

      return categories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return this.userRepository.getAllCategories();
    }
  }

  async searchArtisans(
    searchParams: ArtisanSearchParams,
  ): Promise<{ artisans: UserAggregate[]; total: number }> {
    const {
      category,
      categories,
      location,
      page = 1,
      limit = 10,
    } = searchParams;

    // Single category with optional location
    if (category) {
      return this.getArtisansByCategory(category, page, limit, location);
    }

    // Multiple categories
    if (categories && categories.length > 0) {
      return this.getArtisansByMultipleCategories(categories, page, limit);
    }

    throw new BadRequestError("Either category or categories must be provided");
  }

  async invalidateCategoryCache(category?: string): Promise<void> {
    await connectRedis();

    if (category) {
      // Invalidate specific category cache (you'll need to track keys)
      const pattern = `artisans:category:${category}:*`;
      console.log(`Invalidating cache for category: ${category}`);
      // Note: Redis pattern deletion requires SCAN in production
    } else {
      // Invalidate all categories cache
      await redis.del("categories:all");
      console.log("Invalidated all categories cache");
    }
  }
}
