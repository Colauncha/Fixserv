import { Request, Response } from "express";
import { CategoryService } from "../../application/services/categoryService";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { AuthService } from "../../application/services/authService";

export class CategoryController {
  constructor(
    private categoryService: CategoryService,
    private authService: AuthService,
  ) {}

  /**
   * GET /api/categories
   * Get all available categories
   */
  async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await this.categoryService.getAllCategories();

      res.status(200).json({
        success: true,
        count: categories.length,
        categories,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch categories",
      });
    }
  }

  /**
   * GET /api/artisans/category/:category
   * Get artisans by specific category
   * Query params: page, limit, location
   */
  async getArtisansByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const location = req.query.location as string | undefined;

      if (!category) {
        throw new BadRequestError("Category parameter is required");
      }

      const result = await this.categoryService.getArtisansByCategory(
        category,
        page,
        limit,
        location,
      );

      res.status(200).json({
        success: true,
        category,
        location: location || null,
        results: result.artisans.length,
        total: result.total,
        currentPage: page,
        totalPages: Math.ceil(result.total / limit),
        artisans: result.artisans.map((artisan) => ({
          id: artisan.id,
          fullName: artisan.fullName,
          businessName: (artisan as any).businessName,
          location: (artisan as any).location,
          rating: (artisan as any).rating,
          categories: artisan.getCategoryNames(),
          skills: (artisan as any).skillSet,
          profilePicture: artisan.profilePicture,
          phoneNumber: artisan.phoneNumber,
        })),
      });
    } catch (error: any) {
      const statusCode = error instanceof BadRequestError ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to fetch artisans",
      });
    }
  }

  /**
   * POST /api/artisans/search
   * Search artisans with multiple filters
   * Body: { categories?: string[], category?: string, location?: string, page?: number, limit?: number }
   */
  async searchArtisans(req: Request, res: Response): Promise<void> {
    try {
      const { category, categories, location, page = 1, limit = 10 } = req.body;

      const result = await this.categoryService.searchArtisans({
        category,
        categories,
        location,
        page: parseInt(page as any),
        limit: parseInt(limit as any),
      });

      res.status(200).json({
        success: true,
        filters: {
          category: category || null,
          categories: categories || null,
          location: location || null,
        },
        results: result.artisans.length,
        total: result.total,
        currentPage: page,
        totalPages: Math.ceil(result.total / limit),
        artisans: result.artisans.map((artisan) => ({
          id: artisan.id,
          fullName: artisan.fullName,
          email: artisan.email,
          businessName: (artisan as any).businessName,
          location: (artisan as any).location,
          rating: (artisan as any).rating,
          categories: artisan.getCategoryNames(),
          skills: (artisan as any).skillSet,
          businessHours: (artisan as any).businessHours,
          profilePicture: artisan.profilePicture,
          phoneNumber: artisan.phoneNumber,
        })),
      });
    } catch (error: any) {
      const statusCode = error instanceof BadRequestError ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to search artisans",
      });
    }
  }

  /**
   * PATCH /api/admin/artisan/:id/categories
   * Update artisan categories (Admin only)
   * Body: { categories: string[] }
   */
  async updateArtisanCategories(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { categories } = req.body;
      const currentUser = req.currentUser;

      // Check if user is admin
      if (!currentUser || currentUser.role !== "ADMIN") {
        throw new BadRequestError("Only admins can update artisan categories");
      }

      if (
        !categories ||
        !Array.isArray(categories) ||
        categories.length === 0
      ) {
        throw new BadRequestError(
          "Categories array is required and cannot be empty",
        );
      }

      // You'll need to add this method to AuthService
      const updatedArtisan = await this.authService.updateArtisanCategories(
        id,
        categories,
      );

      res.status(200).json({
        success: true,
        message: "Artisan categories updated successfully",
        artisan: updatedArtisan,
      });
    } catch (error: any) {
      const statusCode = error instanceof BadRequestError ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to update categories",
      });
    }
  }
}
