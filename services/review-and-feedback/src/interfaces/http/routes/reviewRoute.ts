import express, { Request, Response } from "express";

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
  // authenticate.protect,
  // requireRole("ARTISAN"),
  reviewController.submitReview.bind(reviewController)
);

router.get(
  "/artisan/:artisanId/average",
  reviewController.getArtisanAverageRating.bind(reviewController)
);

router.patch(
  "/:reviewId",
  reviewController.updateReview.bind(reviewController)
);

export { router as reviewRouter };
