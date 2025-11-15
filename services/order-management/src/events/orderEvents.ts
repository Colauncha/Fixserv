//export interface OrderCreatedEvent {
//  event: "orderCreated";
//  data: {
//    orderId: string;
//    clientId: string;
//    artisanId: string;
//    serviceId: string;
//    price: number;
//    clientAddress: object;
//    createdAt: string;
//  };
//}
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
      title: string;
      clientAddress: object;
      createdAt: string;
    }
  ) {
    super(payload);
  }
}

export class PaymentReleasedEvent extends BaseEvent {
  eventName = "OrderPaymentReleased";
  version = 1;
  constructor(
    public payload: {
      orderId: string;
      artisanId: string;
      amount: number;
    }
  ) {
    super(payload);
  }
}

export class PaymentInitiatedEvent extends BaseEvent {
  eventName = "OrderPaymentInitiated";
  version = 1;
  constructor(
    public payload: {
      orderId: string;
      escrowStatus: "IN_ESCROW";
    }
  ) {
    super(payload);
  }
}

export class CreditWalletEvent extends BaseEvent {
  eventName = "CreditWallet";
  version = 1;
  constructor(
    public payload: {
      userId: string;
      amount: number;
      reason: "escrow_release";
      reference: string;
    }
  ) {
    super(payload);
  }
}

// New events following your format
export class OrderAcceptedEvent extends BaseEvent {
  eventName = "OrderAccepted";
  version = 1;

  constructor(
    public payload: {
      orderId: string;
      artisanId: string;
      clientId: string;
      acceptedAt: string;
      estimatedCompletionDate?: string;
    }
  ) {
    super(payload);
  }
}

export class OrderRejectedEvent extends BaseEvent {
  eventName = "OrderRejected";
  version = 1;

  constructor(
    public payload: {
      orderId: string;
      artisanId: string;
      clientId: string;
      rejectedAt: string;
      rejectionReason: string;
      rejectionNote?: string;
    }
  ) {
    super(payload);
  }
}

export class OrderExpiredEvent extends BaseEvent {
  eventName = "OrderExpired";
  version = 1;

  constructor(
    public payload: {
      orderId: string;
      artisanId: string;
      clientId: string;
      expiredAt: string;
    }
  ) {
    super(payload);
  }
}

export class WorkStartedEvent extends BaseEvent {
  eventName = "WorkStarted";
  version = 1;

  constructor(
    public payload: {
      orderId: string;
      artisanId: string;
      clientId: string;
      startedAt: string;
    }
  ) {
    super(payload);
  }
}

export class WorkCompletedEvent extends BaseEvent {
  eventName = "WorkCompleted";
  version = 1;

  constructor(
    public payload: {
      orderId: string;
      artisanId: string;
      clientId: string;
      completedAt: string;
    }
  ) {
    super(payload);
  }
}
