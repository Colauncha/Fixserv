import { BadRequestError } from "@fixserv-colauncha/shared";

// export type OrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type OrderStatus =
  | "PENDING_ARTISAN_RESPONSE"
  | "ACCEPTED"
  | "REJECTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type EscrowStatus = "NOT_PAID" | "IN_ESCROW" | "RELEASED" | "DISPUTED";

export type RejectionReason =
  | "TOO_BUSY"
  | "INSUFFICIENT_INFORMATION"
  | "OUT_OF_SERVICE_AREA"
  | "PRICE_TOO_LOW"
  | "OTHER";

export interface ArtisanResponse {
  status: "ACCEPTED" | "REJECTED";
  respondedAt: Date;
  rejectionReason?: RejectionReason;
  rejectionNote?: string;
  estimatedCompletionDate?: Date;
}

export class Order {
  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly artisanId: string,
    public readonly serviceId: string,
    public readonly price: number,
    public readonly clientAddress: object,
    public status: OrderStatus = "PENDING_ARTISAN_RESPONSE",
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
    }[] = [],
    public artisanResponse?: ArtisanResponse,
    public artisanResponseDeadline: Date = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ) // 24 hours from creation
  ) {}

  // markInProgress() {
  //   if (this.status !== "PENDING") {
  //     throw new BadRequestError("Order must be pending to start.");
  //   }
  //   this.status = "IN_PROGRESS";
  // }

  markInProgress() {
    if (this.status !== "ACCEPTED") {
      throw new BadRequestError("Order must be accepted by artisan to start.");
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

  // New methods for artisan response
  acceptOrder(estimatedCompletionDate?: Date) {
    if (this.status !== "PENDING_ARTISAN_RESPONSE") {
      throw new BadRequestError(
        "Order can only be accepted when pending artisan response"
      );
    }

    if (this.isResponseDeadlinePassed()) {
      throw new BadRequestError("Response deadline has passed");
    }

    this.status = "ACCEPTED";
    this.artisanResponse = {
      status: "ACCEPTED",
      respondedAt: new Date(),
      estimatedCompletionDate,
    };
  }

  rejectOrder(reason: RejectionReason, note?: string) {
    if (this.status !== "PENDING_ARTISAN_RESPONSE") {
      throw new BadRequestError(
        "Order can only be rejected when pending artisan response"
      );
    }

    if (this.isResponseDeadlinePassed()) {
      throw new BadRequestError("Response deadline has passed");
    }

    this.status = "REJECTED";
    this.artisanResponse = {
      status: "REJECTED",
      respondedAt: new Date(),
      rejectionReason: reason,
      rejectionNote: note,
    };
  }

  expireOrder() {
    if (this.status !== "PENDING_ARTISAN_RESPONSE") {
      throw new BadRequestError("Only pending orders can be expired");
    }

    this.status = "CANCELLED";
  }

  private isResponseDeadlinePassed(): boolean {
    return new Date() > this.artisanResponseDeadline;
  }

  canArtisanRespond(): boolean {
    return (
      this.status === "PENDING_ARTISAN_RESPONSE" &&
      !this.isResponseDeadlinePassed()
    );
  }
}
