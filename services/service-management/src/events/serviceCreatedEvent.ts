import { BaseEvent } from "@fixserv-colauncha/shared";

export class ServiceCreatedEvent extends BaseEvent {
  eventName = "ServiceCreated";
  version = 1;

  constructor(
    public payload: {
      serviceId: string;
       title: string;
       artisanId:string,
       serviceName:string
      // createdAt: Date;
    }
  ) {
    super(payload);
  }
}
