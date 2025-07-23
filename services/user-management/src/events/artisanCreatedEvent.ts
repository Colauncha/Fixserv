import { BaseEvent } from "@fixserv-colauncha/shared";

export class ArtisanCreatedEvent extends BaseEvent {
  eventName = "ArtisanCreated";
  version = 1;

  constructor(
    public payload: {
      // artisanId: string;
      name: string;
      skills: string[];
      // createdAt: Date;
    }
  ) {
    super(payload);
  }
}
