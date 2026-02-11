import { UserAggregate } from "../aggregates/userAggregate";

export interface IUserRepository {
  // save(user: UserAggregate): Promise<void>;
  save(user: UserAggregate): Promise<UserAggregate>;
  findById(id: string): Promise<UserAggregate | null>;
  findByEmail(email: string): Promise<UserAggregate | null>;
  find(
    role?: string,
    page?: number,
    limit?: number,
  ): Promise<{
    users: UserAggregate[];
    total: number;
  }>;
  // ===== NEW CATEGORY METHODS =====

  /**
   * Find artisans by a single category
   * @param category - Category name (e.g., "PHONES", "TABLETS")
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @returns Object with artisans array and total count
   */
  findArtisansByCategory(
    category: string,
    page?: number,
    limit?: number,
  ): Promise<{ artisans: UserAggregate[]; total: number }>;

  /**
   * Find artisans by multiple categories (OR logic)
   * Artisans matching ANY of the provided categories will be returned
   * @param categories - Array of category names
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @returns Object with artisans array and total count
   */
  findArtisansByCategories(
    categories: string[],
    page?: number,
    limit?: number,
  ): Promise<{ artisans: UserAggregate[]; total: number }>;

  /**
   * Get all unique categories from all artisans in the system
   * @returns Array of category names (sorted alphabetically)
   */
  getAllCategories(): Promise<string[]>;

  /**
   * Find artisans by both category and location
   * @param category - Category name
   * @param location - Location string (supports partial matching)
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @returns Object with artisans array and total count
   */
  findArtisansByCategoryAndLocation(
    category: string,
    location: string,
    page?: number,
    limit?: number,
  ): Promise<{ artisans: UserAggregate[]; total: number }>;

  /**
   * Optional: Find artisans by category with caching
   * This is a performance optimization using Redis
   */
  findArtisansByCategoryWithCache?(
    category: string,
    page?: number,
    limit?: number,
  ): Promise<{ artisans: UserAggregate[]; total: number }>;

  /**
   * Optional: Invalidate category cache
   * Call this when artisan categories are updated
   */
  invalidateCategoryCache?(category?: string): Promise<void>;

  addCertificate(artisanId: string, certificate: any): Promise<void>;
  removeCertificate(artisanId: string, certificateId: string): Promise<void>;
  updateCertificateStatus(
    artisanId: string,
    certificateId: string,
    status: "APPROVED" | "REJECTED",
    adminId: string,
    rejectionReason?: string,
  ): Promise<void>;
  getArtisansWithPendingCertificates(
    page?: number,
    limit?: number,
  ): Promise<{ artisans: UserAggregate[]; total: number }>;
  getAllPendingCertificates(): Promise<
    Array<{
      artisanId: string;
      artisanName: string;
      artisanEmail: string;
      certificates: any[];
    }>
  >;
}
