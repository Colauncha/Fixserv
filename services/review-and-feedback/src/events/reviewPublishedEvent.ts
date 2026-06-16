import { BaseEvent } from "@fixserv-colauncha/shared";

export class ReviewPublishedEvent extends BaseEvent {
  eventName = "ReviewPublished";
  version = 1;

  constructor(
    public payload: {
      reviewId: string;
      orderId: string;
      artisanId: string;
      serviceId: string;
      clientId: string;
      artisanRating: number;
      serviceRating: number;
      hasComment: boolean;
      comment?: string;
    },
  ) {
    super(payload);
  }
}
