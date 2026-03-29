import { BaseEvent } from "@fixserv-colauncha/shared";

export class WalletWithdrawalEvent extends BaseEvent {
  eventName = "WalletWithdrawal";
  version = 1;

  constructor(
    public payload: {
      userId: string;
      amount: number;
      accountNumber: string;
      reference: string;
      status: "SUCCESS" | "FAILED";
    },
  ) {
    super(payload);
  }
}

export class WalletTopUpEvent extends BaseEvent {
  eventName = "WalletTopUp";
  version = 1;

  constructor(
    public payload: {
      userId: string;
      email: string;
      amount: number;
      reference: string;
    },
  ) {
    super(payload);
  }
}

export class WalletTopUpFailedEvent extends BaseEvent {
  eventName = "WalletTopUpFailed";
  version = 1;

  constructor(
    public payload: {
      userId: string;
      email: string;
      amount: number;
      reference: string;
      reason: string;
    },
  ) {
    super(payload);
  }
}
