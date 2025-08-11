import { BaseEvent } from "@fixserv-colauncha/shared";

export class ServiceRatedEvent extends BaseEvent {
  eventName = "ServiceRated";
  version = 1;

  constructor(
    public payload: {
      serviceId: string;
      newRating: number;
    }
  ) {
    super(payload);
  }
}
