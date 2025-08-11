import { BadRequestError } from "@fixserv-colauncha/shared";

export class Escrow {
  constructor(
    public readonly orderId: string,
    public readonly artisanId: string,
    public readonly clientId: string,
    public amount: number,
    public status: "HELD" | "RELEASED" | "REFUNDED",
    public readonly createdAt: Date,
    public updatedAt?: Date
  ) {
    if (amount <= 0) {
      throw new BadRequestError("Amount must be greater than zero");
    }
    this.status = "HELD"; // Default status when created
    this.createdAt = createdAt || new Date();
  }
}
