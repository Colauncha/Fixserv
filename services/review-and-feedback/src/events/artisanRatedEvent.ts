import { BaseEvent } from "@fixserv-colauncha/shared";

export class ArtisanRatedEvent extends BaseEvent {
  eventName = "ArtisanRated";
  version = 1;
  // artisanId: any;
  // newRating: any;

  constructor(
    public payload: {
      artisanId: string;
      newRating: number;
      // createdAt: Date;
    }
  ) {
    super(payload);
  }
}
