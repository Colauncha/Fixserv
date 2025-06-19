import { EscrowDetails } from "../value-objects/escrowDetails";

export enum OrderStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  HELD_IN_ESCROW = "HELD_IN_ESCROW",
  RELEASED = "RELEASED",
  REFUNDED = "REFUNDED",
  DISPUTED = "DISPUTED",
}

export class Order {
  constructor(
    public readonly orderId: string,
    public clientId: string,
    public artisanId: string,
    public serviceId: string,
    public status: OrderStatus,
    public paymentStatus: PaymentStatus,
    public escrowDetails: EscrowDetails,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  updateStatus(newStatus: OrderStatus): void {
    this.status = newStatus;
    this.updatedAt = new Date();
  }

  updatePaymentStatus(newStatus: PaymentStatus): void {
    this.paymentStatus = newStatus;
    this.updatedAt = new Date();
  }
}
