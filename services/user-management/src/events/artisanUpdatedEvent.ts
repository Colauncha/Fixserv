import { BaseEvent } from "@fixserv-colauncha/shared";

export class ArtisanUpdatedEvent extends BaseEvent {
  eventName = "ArtisanUpdated";
  version = 1;

  constructor(
    public payload: {
      userId: string;
      fullName: string;
      businessName: string;
      location: string;
      skills: string[];
      categories: string[];
    },
  ) {
    super(payload);
  }
}
