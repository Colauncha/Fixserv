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
exports.RatingCalculator = void 0;
class RatingCalculator {
    constructor(reviewClient) {
        this.reviewClient = reviewClient;
    }
    calculateAverageArtisanRating(artisanId) {
        return __awaiter(this, void 0, void 0, function* () {
            const reviews = yield this.reviewClient.getPublishedReviewsByArtisan(artisanId);
            if (reviews.length === 0) {
                return 0; // No reviews, return average rating of 0
            }
            const totalRating = reviews.reduce((sum, review) => sum + review.artisanRating, 0);
            return parseFloat((totalRating / reviews.length).toFixed(1));
        });
    }
}
exports.RatingCalculator = RatingCalculator;
