import { BaseEvent } from "@fixserv-colauncha/shared";

export class ReviewProcessedEvent extends BaseEvent {
  eventName = "ReviewProcessed";
  version = 1;

  constructor(
    public payload: {
      reviewId: string;
      success: boolean;
      error?: string;
      artisanId?: string;
      serviceId?: string;
      newArtisanRating?: number;
      newServiceRating?: number;
      timestamp?: Date;
    }
  ) {
    super(payload);
  }

  // Optional: Add helper methods
  isSuccess(): boolean {
    return this.payload.success;
  }
}
