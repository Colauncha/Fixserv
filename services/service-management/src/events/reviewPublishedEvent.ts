// packages/shared/src/events/reviewPublishedEvent.ts
import { BaseEvent } from "@fixserv-colauncha/shared";

export class ReviewPublishedEvent extends BaseEvent {
  eventName = "ReviewPublished";
  version = 1;

  constructor(
    public payload: {
      reviewId: string;
      artisanId: string;
      serviceId: string;
      clientId: string;
      artisanRating: number; // value after moderation
      serviceRating: number; // value after moderation
    }
  ) {
    super(payload);
  }
}
