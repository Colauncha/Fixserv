import { BaseEvent } from "@fixserv-colauncha/shared";

export class ArtisanRatedEvent extends BaseEvent {
  eventName = "ArtisanRated";
  version = 1;

  constructor(
    public payload: {
      artisanId: string;
      newRating: number;
    }
  ) {
    super(payload);
  }
}
