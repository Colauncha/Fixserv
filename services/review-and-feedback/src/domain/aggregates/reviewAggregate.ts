import { Feedback } from "../entities/feedback";
import { Review } from "../entities/review";
import { Rating } from "../value-objects/rating";

export class ReviewAggregate {
  private _review: Review;
  private _feedback: Feedback;
  private _artisanRating: Rating;
  private _serviceRating: Rating;

  constructor(
    review: Review,
    feedback: Feedback,
    artisanRating: Rating,
    serviceRating: Rating
  ) {
    this._review = review;
    this._feedback = feedback;
    this._artisanRating = artisanRating;
    this._serviceRating = serviceRating;
  }

  publish() {
    this._review.publish();
  }

  flag(reason: string) {
    this._review.flag(reason);
    this._feedback.addModerationNote(reason);
  }

  // Getters
  get review() {
    return this._review;
  }
  get feedback():Feedback {
    return this._feedback;
  }
  get artisanRating():Rating {
    return this._artisanRating;
  }
  get serviceRating():Rating {
    return this._serviceRating;
  }
}
