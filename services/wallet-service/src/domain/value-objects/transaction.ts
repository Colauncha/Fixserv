import { TransactionType } from "../enums/transactionType";

export class Transaction {
  constructor(
    public readonly id: string,
    public readonly type: TransactionType,
    public readonly amount: number,
    public readonly description: string,
    public readonly createdAt: Date,
    public readonly status: "PENDING" | "SUCCESS" | "FAILED"
  ) {}
}
