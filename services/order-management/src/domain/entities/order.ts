import { BadRequestError } from "@fixserv-colauncha/shared";

export type OrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type EscrowStatus = "NOT_PAID" | "IN_ESCROW" | "RELEASED" | "DISPUTED";

export class Order {
  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly artisanId: string,
    public readonly serviceId: string,
    public readonly price: number,
    public readonly clientAddress: object,
    public status: OrderStatus = "PENDING",
    public escrowStatus: EscrowStatus = "NOT_PAID",
    public paymentReference?: string,
    public readonly createdAt: Date = new Date(),
    public completedAt?: Date,
    public disputeId?: string,
    public uploadedProducts: {
      id: string;
      imageUrl: string;
      description: string;
      objectName: string;
      uploadedAt: Date;
    }[] = []
  ) {}

  markInProgress() {
    if (this.status !== "PENDING") {
      throw new BadRequestError("Order must be pending to start.");
    }
    this.status = "IN_PROGRESS";
  }

  markCompleted() {
    if (this.status !== "IN_PROGRESS")
      throw new BadRequestError("Order must be in progress to complete.");
    this.status = "COMPLETED";
    this.completedAt = new Date();
  }

  markCancelled() {
    if (this.status === "COMPLETED")
      throw new BadRequestError("Cannot cancel a completed order.");
    this.status = "CANCELLED";
  }

  updateEscrowStatus(status: EscrowStatus) {
    this.escrowStatus = status;
  }
  setPaymentReference(reference: string) {
    this.paymentReference = reference;
  }
}
