"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewAggregate = void 0;
class ReviewAggregate {
    constructor(review, feedback, artisanRating, serviceRating) {
        this._review = review;
        this._feedback = feedback;
        this._artisanRating = artisanRating;
        this._serviceRating = serviceRating;
    }
    publish() {
        this._review.publish();
    }
    flag(reason) {
        this._review.flag(reason);
        this._feedback.addModerationNote(reason);
    }
    // Getters
    get review() {
        return this._review;
    }
    get feedback() {
        return this._feedback;
    }
    get artisanRating() {
        return this._artisanRating;
    }
    get serviceRating() {
        return this._serviceRating;
    }
}
exports.ReviewAggregate = ReviewAggregate;
