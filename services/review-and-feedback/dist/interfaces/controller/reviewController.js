"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const feedback_1 = require("../../domain/entities/feedback");
const rating_1 = require("../../domain/value-objects/rating");
class ReviewController {
    constructor(reviewService, ratingCalculator) {
        this.reviewService = reviewService;
        this.ratingCalculator = ratingCalculator;
    }
    submitReview(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { orderId, artisanId, clientId, serviceId, comment, artisanRating, serviceRating, ratingDimensions, } = req.body;
                const review = yield this.reviewService.submitReview(orderId, artisanId, clientId, serviceId, new feedback_1.Feedback(comment), new rating_1.Rating(artisanRating, ratingDimensions), new rating_1.Rating(serviceRating, ratingDimensions));
                res.status(201).json({ data: review.toDto() });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
            }
        });
    }
    updateReview(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { reviewId } = req.params;
                const { comment, artisanRating, serviceRating } = req.body;
                const review = yield this.reviewService.updateReview(reviewId, {
                    comment,
                    artisanRating,
                    serviceRating,
                });
                res.status(200).json({
                    success: true,
                    data: {
                        id: review.id,
                        status: review.status,
                    },
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
            }
        });
    }
    //async getArtisanReviews(req: Request, res: Response) {
    //  try {
    //    const { artisanId } = req.params;
    //    const { status } = req.query;
    //
    //    let reviews;
    //    if (status === "published") {
    //      reviews = await this.reviewService.findPublishedByArtisan//(artisanId);
    //    } else {
    //      reviews = await this.reviewService.findByArtisan(artisanId);
    //    }
    //
    //    res.status(200).json({
    //      success: true,
    //      data: reviews.map((review) => ({
    //        id: review.id,
    //        clientId: review.clientId,
    //        serviceId: review.serviceId,
    //        rating: review.artisanRating.value,
    //        comment: review.feedback.comment,
    //        status: review.status,
    //        createdAt: review.date,
    //      })),
    //    });
    //  } catch (error) {
    //    res.status(400).json({
    //      success: false,
    //      error: error.message,
    //    });
    //  }
    //}
    //
    //async getServiceReviews(req: Request, res: Response) {
    //  try {
    //    const { serviceId } = req.params;
    //    const { status } = req.query;
    //
    //    let reviews;
    //    if (status === "published") {
    //      reviews = await this.reviewService.findPublishedByService//(serviceId);
    //    } else {
    //      reviews = await this.reviewService.findByService(serviceId);
    //    }
    //
    //    res.status(200).json({
    //      success: true,
    //      data: reviews.map((review) => ({
    //        id: review.id,
    //        clientId: review.clientId,
    //        artisanId: review.artisanId,
    //        rating: review.serviceRating.value,
    //        comment: review.feedback.comment,
    //        status: review.status,
    //        createdAt: review.date,
    //      })),
    //    });
    //  } catch (error) {
    //    res.status(400).json({
    //      success: false,
    //      error: error.message,
    //    });
    //  }
    //}
    //
    getArtisanAverageRating(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { artisanId } = req.params;
                const average = yield this.ratingCalculator.calculateAverageArtisanRating(artisanId);
                res.status(200).json({
                    success: true,
                    data: { artisanId, averageRating: average },
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
            }
        });
    }
}
exports.ReviewController = ReviewController;
