"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRouter = void 0;
const express_1 = __importDefault(require("express"));
const shared_1 = require("@fixserv-colauncha/shared");
const reviewController_1 = require("../../controller/reviewController");
const review_and_feedbackRepositoryImpls_1 = require("../../../infrastructure/review-and-feedbackRepositoryImpls");
const reviewService_1 = require("../../../application/services/reviewService");
const ratingCalculator_1 = require("../../../domain/services/ratingCalculator");
const userManagementClient_1 = require("../../../infrastructure/clients/userManagementClient");
const serviceManagementClient_1 = require("../../../infrastructure/clients/serviceManagementClient");
const axiosClient_1 = require("../axiosClient");
const router = express_1.default.Router();
exports.reviewRouter = router;
const reviewRepository = new review_and_feedbackRepositoryImpls_1.reviewAndFeedbackRepositoryImpls();
const ratingCalculator = new ratingCalculator_1.RatingCalculator(reviewRepository);
const authenticate = new shared_1.AuthMiddleware();
const userManagementClient = new userManagementClient_1.UserManagementClient((0, axiosClient_1.createAxiosClient)(process.env.USER_MANAGEMENT_URL));
const serviceManagementClient = new serviceManagementClient_1.ServiceManagementClient((0, axiosClient_1.createAxiosClient)(process.env.SERVICE_MANAGEMENT_URL));
const reviewService = new reviewService_1.ReviewService(reviewRepository, ratingCalculator, userManagementClient, serviceManagementClient);
const reviewController = new reviewController_1.ReviewController(reviewService, ratingCalculator);
router.post("/submitReview", 
// authenticate.protect,
// requireRole("ARTISAN"),
reviewController.submitReview.bind(reviewController));
router.get("/artisan/:artisanId/average", reviewController.getArtisanAverageRating.bind(reviewController));
router.patch("/:reviewId", reviewController.updateReview.bind(reviewController));
