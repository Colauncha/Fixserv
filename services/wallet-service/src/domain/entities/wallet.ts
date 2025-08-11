import { BadRequestError } from "@fixserv-colauncha/shared";
import { Transaction } from "../value-objects/transaction";

export class Wallet {
  constructor(
    public readonly userId: string,
    public readonly role: "CLIENT" | "ARTISAN",
    public balance: number,
    public transactions: Transaction[]
  ) {}

  credit(amount: number, transaction: Transaction) {
    this.balance += amount;
    this.transactions.push(transaction);
  }

  debit(amount: number, transaction: Transaction) {
    if (this.balance < amount) {
      throw new BadRequestError("Insufficient balance");
    }
    this.balance -= amount;
    this.transactions.push(transaction);
  }
}
