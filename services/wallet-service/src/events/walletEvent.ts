import { BaseEvent } from "@fixserv-colauncha/shared";

export class WalletWithdrawalEvent extends BaseEvent {
  eventName = "WalletWithdrawal";
  version = 1;

  constructor(
    public payload: {
      userId: string;
      amount: number;
      accountNumber: string;
    },
  ) {
    super(payload);
  }
}
