import { BaseEvent } from "@fixserv-colauncha/shared";

export class ServiceCreatedEvent extends BaseEvent {
  eventName = "ServiceCreated";
  version = 1;

  constructor(
    public payload: {
      serviceId: string;
      // name: string;
      // createdAt: Date;
    }
  ) {
    super(payload);
  }
}
