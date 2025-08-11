import { BaseEvent } from "@fixserv-colauncha/shared";

export class ArtisanCreatedEvent extends BaseEvent {
  eventName = "ArtisanCreated";
  version = 1;

  constructor(
    public payload: {
      userId: string;
      fullName: string;
      skills: string[];
      businessName: string;
    }
  ) {
    super(payload);
  }
}
