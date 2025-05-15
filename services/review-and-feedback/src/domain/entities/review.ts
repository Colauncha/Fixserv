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

import { ReviewDto } from "../dtos/reviewDto";
import { Rating } from "../value-objects/rating";
import { Feedback } from "./feedback";

export class Review {
  private _id: string;
  private _orderId: string;
  private _artisanId: string;
  private _clientId: string;
  private _serviceId: string;
  private _feedback: Feedback;
  private _artisanRating: Rating;
  private _serviceRating: Rating;
  private _status: "pending" | "processing" | "published" | "flagged" =
    "pending";
  private _date: Date;
  private _processingErrors: string[] = [];

  constructor(
    id: string,
    orderId: string,
    artisanId: string,
    clientId: string,
    serviceId: string,
    feedback: Feedback,
    artisanRating: Rating,
    serviceRating: Rating,
    status?: "pending" | "processing" | "published" | "flagged",
    date?: Date
  ) {
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

  flag(reason: string) {
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

  markAsFailed(error: string) {
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
  toDto(): ReviewDto {
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
  static create(
    id: string,
    orderId: string,
    artisanId: string,
    clientId: string,
    serviceId: string,
    feedback: Feedback,
    artisanRating: Rating,
    serviceRating: Rating,
    status?: "pending" | "processing" | "published" | "flagged",
    date?: Date
  ): Review {
    return new Review(
      id,
      orderId,
      artisanId,
      clientId,
      serviceId,
      feedback,
      artisanRating,
      serviceRating,
      status || "pending",
      date || new Date()
    );
  }

  updateFeedback(newComment: string) {
    // if (this._status !== "published") {
    //   throw new Error("Only published reviews can be updated");
    // }
    this._feedback = new Feedback(newComment);
    this._status = "pending";
  }

  updateRatings(newArtisanRating: Rating, newServiceRating: Rating) {
    // if (this._status !== "published") {
    //   throw new Error("Only published reviews can be updated");
    // }
    this._artisanRating = newArtisanRating;
    this._serviceRating = newServiceRating;
    this._status = "pending";
  }
}
