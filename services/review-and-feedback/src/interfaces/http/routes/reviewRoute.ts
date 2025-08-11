import express, { NextFunction, Request, Response } from "express";

import { AuthMiddleware } from "@fixserv-colauncha/shared";
import { requireRole } from "@fixserv-colauncha/shared";
import { ReviewController } from "../../controller/reviewController";
import { reviewAndFeedbackRepositoryImpls } from "../../../infrastructure/review-and-feedbackRepositoryImpls";
import { ReviewService } from "../../../application/services/reviewService";
import { RatingCalculator } from "../../../domain/services/ratingCalculator";
import { UserManagementClient } from "../../../infrastructure/clients/userManagementClient";
import { ServiceManagementClient } from "../../../infrastructure/clients/serviceManagementClient";
import { createAxiosClient } from "../axiosClient";

const router = express.Router();
const reviewRepository = new reviewAndFeedbackRepositoryImpls();
const ratingCalculator = new RatingCalculator(reviewRepository);
const authenticate = new AuthMiddleware();

const userManagementClient = new UserManagementClient(
  createAxiosClient(process.env.USER_MANAGEMENT_URL!)
);

const serviceManagementClient = new ServiceManagementClient(
  createAxiosClient(process.env.SERVICE_MANAGEMENT_URL!)
);

const reviewService = new ReviewService(
  reviewRepository,
  ratingCalculator,
  userManagementClient,
  serviceManagementClient
);
const reviewController = new ReviewController(reviewService, ratingCalculator);

router.post(
  "/submitReview",
  authenticate.protect,
  requireRole("CLIENT"),
  reviewController.submitReview.bind(reviewController)
);

router.get(
  "/reviews",
  authenticate.protect,
  requireRole("ARTISAN", "CLIENT"),
  reviewController.getAllReviews.bind(reviewController)
);

router.get(
  "/reviews/:id",
  authenticate.protect,
  requireRole("CLIENT"),
  reviewController.getReviewById.bind(reviewController)
);

router.get(
  "/artisan/:artisanId",
  reviewController.getArtisanReviews.bind(reviewController)
);

router.get(
  "/service/:serviceId",
  reviewController.getServiceReviews.bind(reviewController)
);

router.get(
  "/artisan/:artisanId/average",
  authenticate.protect,
  requireRole("ARTISAN", "CLIENT"),
  reviewController.getArtisanAverageRating.bind(reviewController)
);

router.get(
  "/service/:serviceId/average",
  authenticate.protect,
  requireRole("ARTISAN", "CLIENT"),
  reviewController.getServiceAverageRating.bind(reviewController)
);

router.patch(
  "/:reviewId",
  authenticate.protect,
  requireRole("CLIENT"),
  reviewController.updateReview.bind(reviewController)
);

router.delete(
  "/:reviewId",
  authenticate.protect,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.currentUser?.role === "ADMIN") {
      next();
    } else {
      requireRole("CLIENT")(req, res, next);
    }
  },
  reviewController.deleteReview.bind(reviewController)
);
export { router as reviewRouter };
