"use strict";
// review-and-feedback/src/domain/models/review.ts
//export class Review {
//  constructor(
//    public id: string,
//    public serviceId: string, // From service-management
//    public artisanId: string, // From user-management
//    public clientId: string, // From user-management
//    public rating: RatingValue,
//    public comment: string,
//    public createdAt: Date,
//    public status: ReviewStatus = "pending",
//    public moderatorId?: string
//  ) {}
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const feedback_1 = require("./feedback");
class Review {
    constructor(id, orderId, artisanId, clientId, serviceId, feedback, artisanRating, serviceRating, status, date) {
        this._status = "pending";
        this._processingErrors = [];
        this._id = id;
        this._orderId = orderId;
        this._artisanId = artisanId;
        this._clientId = clientId;
        this._serviceId = serviceId;
        this._feedback = feedback;
        this._artisanRating = artisanRating;
        this._serviceRating = serviceRating;
        this._date = new Date();
        this._status = "pending";
    }
    publish() {
        if (this.status !== "pending") {
            throw new Error("Only pending reviews can be published");
        }
        this._status = "published";
    }
    flag(reason) {
        this._status = "flagged";
        this._feedback.addModerationNote(reason);
    }
    markAsProcessing() {
        if (this._status !== "pending") {
            throw new Error("Only pending reviews can be marked as processing");
        }
        this._status = "processing";
    }
    markAsPublished() {
        if (this._status !== "processing") {
            throw new Error("Only processing reviews can be published");
        }
        this._status = "published";
    }
    markAsFailed(error) {
        this._status = "pending"; // Retryable
        this._processingErrors.push(error);
    }
    get id() {
        return this._id;
    }
    get feedback() {
        return this._feedback;
    }
    get status() {
        return this._status;
    }
    get artisanId() {
        return this._artisanId;
    }
    get orderId() {
        return this._orderId;
    }
    get clientId() {
        return this._clientId;
    }
    get serviceId() {
        return this._serviceId;
    }
    get artisanRating() {
        return this._artisanRating;
    }
    get serviceRating() {
        return this._serviceRating;
    }
    get date() {
        return this._date;
    }
    // Add to your Review entity class
    toDto() {
        return {
            id: this._id,
            orderId: this._orderId,
            artisanId: this._artisanId,
            clientId: this._clientId,
            serviceId: this._serviceId,
            comment: this._feedback.comment,
            moderationNotes: this._feedback.moderationNotes,
            attachments: this._feedback.attachments,
            artisanRating: this._artisanRating.value,
            serviceRating: this._serviceRating.value,
            ratingDimensions: this._artisanRating.dimensions,
            status: this._status,
            date: this._date,
        };
    }
    static create(id, orderId, artisanId, clientId, serviceId, feedback, artisanRating, serviceRating, status, date) {
        return new Review(id, orderId, artisanId, clientId, serviceId, feedback, artisanRating, serviceRating, status || "pending", date || new Date());
    }
    updateFeedback(newComment) {
        // if (this._status !== "published") {
        //   throw new Error("Only published reviews can be updated");
        // }
        this._feedback = new feedback_1.Feedback(newComment);
        this._status = "pending";
    }
    updateRatings(newArtisanRating, newServiceRating) {
        // if (this._status !== "published") {
        //   throw new Error("Only published reviews can be updated");
        // }
        this._artisanRating = newArtisanRating;
        this._serviceRating = newServiceRating;
        this._status = "pending";
    }
}
exports.Review = Review;
