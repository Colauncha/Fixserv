import { BadRequestError } from "@fixserv-colauncha/shared";

// export type OrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type OrderStatus =
  | "PENDING_ARTISAN_RESPONSE"
  | "ACCEPTED"
  | "REJECTED"
  | "IN_PROGRESS"
  | "WORK_COMPLETED"
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

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
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
    public deviceType: String,
    public deviceBrand: String,
    public deviceModel: String,
    public serviceRequired: String,
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
      Date.now() + 24 * 60 * 60 * 1000,
    ), // 24 hours from creation
    public statusHistory: StatusHistoryEntry[] = [],
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
    this.escrowStatus = "IN_ESCROW";
    this.addStatusHistoryEntry("IN_PROGRESS");
  }

  markAsWorkCompleted() {
    if (this.status !== "IN_PROGRESS") {
      throw new BadRequestError(
        "Order must be in progress to mark work completed.",
      );
    }
    this.status = "WORK_COMPLETED";
    this.addStatusHistoryEntry("WORK_COMPLETED");
  }

  markCompleted() {
    if (this.status !== "WORK_COMPLETED")
      throw new BadRequestError("Order must be in WORK_COMPLETED to complete.");
    this.status = "COMPLETED";
    this.escrowStatus = "RELEASED";
    this.completedAt = new Date();
    this.addStatusHistoryEntry("COMPLETED");
  }

  markCancelled() {
    if (this.status === "COMPLETED")
      throw new BadRequestError("Cannot cancel a completed order.");
    this.status = "CANCELLED";
    this.addStatusHistoryEntry("CANCELLED");
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
        "Order can only be accepted when pending artisan response",
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
    this.escrowStatus = "IN_ESCROW"; // Move to escrow when accepted
    this.addStatusHistoryEntry("ACCEPTED");
  }

  rejectOrder(reason: RejectionReason, note?: string) {
    if (this.status !== "PENDING_ARTISAN_RESPONSE") {
      throw new BadRequestError(
        "Order can only be rejected when pending artisan response",
      );
    }

    if (this.isResponseDeadlinePassed()) {
      throw new BadRequestError("Response deadline has passed");
    }

    this.status = "REJECTED";
    this.escrowStatus = "NOT_PAID";
    this.artisanResponse = {
      status: "REJECTED",
      respondedAt: new Date(),
      rejectionReason: reason,
      rejectionNote: note,
    };
    this.addStatusHistoryEntry("REJECTED", note);
  }

  expireOrder() {
    if (this.status !== "PENDING_ARTISAN_RESPONSE") {
      throw new BadRequestError("Only pending orders can be expired");
    }

    this.status = "CANCELLED";
    this.escrowStatus = "NOT_PAID";
    this.addStatusHistoryEntry(
      "CANCELLED",
      "Order expired — artisan did not respond in time",
    );
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

  addStatusHistoryEntry(status: OrderStatus, note?: string) {
    this.statusHistory.push({ status, timestamp: new Date(), note });
  }

  cancelOrder(cancelledBy: "CLIENT" | "ARTISAN") {
    const cancellableStatuses: OrderStatus[] = [
      "PENDING_ARTISAN_RESPONSE",
      "ACCEPTED",
    ];
    if (!cancellableStatuses.includes(this.status)) {
      throw new BadRequestError(
        `Order cannot be cancelled at status: ${this.status}. Orders can only be cancelled before work has started.`,
      );
    }
    if (cancelledBy === "CLIENT" && this.status === "IN_PROGRESS") {
      throw new BadRequestError(
        "Cannot cancel an order that is already in progress",
      );
    }

    this.status = "CANCELLED";
    // this.escrowStatus = "NOT_PAID";
    this.addStatusHistoryEntry(
      "CANCELLED",
      `Cancelled by ${cancelledBy.toLowerCase()} before work started`,
    );
  }
}
