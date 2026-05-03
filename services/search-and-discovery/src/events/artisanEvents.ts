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

export class ArtisanRatedEvent extends BaseEvent {
  eventName = "ArtisanRated";
  version = 1;

  constructor(
    public payload: {
      userId: string;
      newRating: number;
    },
  ) {
    super(payload);
  }
}

export class ArtisanCreatedEvent extends BaseEvent {
  eventName = "ArtisanCreated";
  version = 1;

  constructor(
    public payload: {
      userId: string;
      fullName: string;
      skills: string[];
      businessName: string;
      location: string;
      rating: number;
      categories: string[];
    },
  ) {
    super(payload);
  }
}
