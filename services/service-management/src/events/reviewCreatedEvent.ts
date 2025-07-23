import { BaseEvent } from "@fixserv-colauncha/shared";

export class ReviewCreatedEvent extends BaseEvent {
  eventName = "ReviewCreated";
  version = 1;

  constructor(
    public payload: {
      reviewId: string;
      artisanId: string;
      serviceId: string;
      clientId: string;
      artisanRating: number;
      serviceRating: number;
      status: "pending" | "processing" | "published" | "flagged";
    }
  ) {
    super(payload);
  }
}
