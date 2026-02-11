import express from "express";
import { CategoryController } from "../../controllers/categoryController";
import { CategoryService } from "../../../application/services/categoryService";
import { UserRepositoryImpl } from "../../../infrastructure/persistence/userRepositoryImpl";
import { AuthMiddleware } from "@fixserv-colauncha/shared";
import { requireRole } from "@fixserv-colauncha/shared";
import { JwtTokenService } from "../../../infrastructure/services/jwtTokenService";
import { EmailService } from "../../../infrastructure/services/emailServiceImpls";
import { AuthService } from "../../../application/services/authService";

const router = express.Router();

// Initialize dependencies
const userRepository = new UserRepositoryImpl();
const categoryService = new CategoryService(userRepository);
const emailService = new EmailService();
const tokenService = new JwtTokenService();
const authService = new AuthService(userRepository, tokenService, emailService);
const categoryController = new CategoryController(categoryService, authService);

const authMiddleware = new AuthMiddleware();

/**
 * Public Routes
 */

// Get all categories
router.get(
  "/categories",
  categoryController.getAllCategories.bind(categoryController),
);

// Get artisans by category
// Example: GET /api/artisans/category/PHONES?page=1&limit=10&location=Lagos
router.get(
  "/artisans/category/:category",
  categoryController.getArtisansByCategory.bind(categoryController),
);

// Search artisans with filters
// Example: POST /api/artisans/search
// Body: { categories: ["PHONES", "TABLETS"], location: "Lagos", page: 1, limit: 10 }
router.post(
  "/artisans/search",
  categoryController.searchArtisans.bind(categoryController),
);

/**
 * Protected Routes (Admin only)
 */

// Update artisan categories
router.patch(
  "/admin/artisan/:id/categories",
  authMiddleware.protect,
  requireRole("ADMIN"),
  categoryController.updateArtisanCategories.bind(categoryController),
);

export { router as categoryRouter };
