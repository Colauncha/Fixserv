import { BadRequestError } from "@fixserv-colauncha/shared";
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
    this._date = date || new Date();
    this._status = status || "pending";
  }

  publish() {
    if (this.status !== "pending") {
      throw new BadRequestError("Only pending reviews can be published");
    }
    this._status = "published";
  }

  flag(reason: string) {
    this._status = "flagged";
    this._feedback.addModerationNote(reason);
  }

  markAsProcessing() {
    if (this._status !== "pending") {
      throw new BadRequestError(
        "Only pending reviews can be marked as processing"
      );
    }
    this._status = "processing";
  }

  markAsPublished() {
    if (this._status !== "processing") {
      throw new BadRequestError("Only processing reviews can be published");
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

  serviceQuality() {
    return this._serviceRating.dimensions.quality;
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

  updateContent(
    newComment?: string,
    newArtisanRating?: Rating,
    newServiceRating?: Rating
  ): void {
    if (this._status !== "published") {
      throw new BadRequestError("Only published reviews can be updtaed");
    }

    if (newComment) {
      this._feedback = new Feedback(newComment);
    }
    if (newArtisanRating) {
      this._artisanRating = newArtisanRating;
    }

    if (newServiceRating) {
      this._serviceRating = newServiceRating;
    }
    this._status = "pending";
  }
  canBeDeleted(userRole?: string) {
    // return ["pending", "flagged"].includes(this._status);
    const isDeletableStatus = ["pending", "flagged"].includes(this._status);
    const isAdmin = userRole === "ADMIN";
    return isDeletableStatus || isAdmin; // Admins can delete any review
  }
}
