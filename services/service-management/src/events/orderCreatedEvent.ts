import { BaseEvent } from "@fixserv-colauncha/shared";

export class OrderCreatedEvent extends BaseEvent {
  eventName = "OrderCreated";
  version = 1;

  constructor(
    public payload: {
      orderId: string;
      clientId: string;
      artisanId: string;
      serviceId: string;
      price: number;
      clientAddress: object;
      createdAt: string;
    }
  ) {
    super(payload);
  }
}
