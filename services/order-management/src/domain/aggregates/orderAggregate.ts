import { v4 as uuidv4 } from "uuid";

import { Order, RejectionReason } from "../entities/order";
import { BadRequestError } from "@fixserv-colauncha/shared";

export class OrderAggregate {
  constructor(public readonly order: Order) {}

  static createNew(
    clientId: string,
    artisanId: string,
    serviceId: string,
    price: number,
    clientAddress: object,
    uploadedProducts: {
      id: string;
      imageUrl: string;
      description: string;
      objectName: string;
      uploadedAt: Date;
    }[] = []
  ) {
    const id = uuidv4();
    const now = new Date();
    const responseDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const order = new Order(
      id,
      clientId,
      artisanId,
      serviceId,
      price,
      clientAddress,
      // "PENDING", // status is initially PENDING
      "PENDING_ARTISAN_RESPONSE",
      "NOT_PAID", // escrowStatus is initially NOT_PAID
      "", // paymentReference is initially empty
      now, // createdAt is set to now
      undefined, // completedAt is initially undefined
      undefined, // disputeId is initially undefined
      uploadedProducts, // uploadedProducts is passed as an argument
      undefined,
      responseDeadline
    );

    return new OrderAggregate(order);
  }

  markAsPaidInEscrow() {
    this.order.updateEscrowStatus("IN_ESCROW");
  }

  releasePayment() {
    if (this.order.status !== "COMPLETED") {
      throw new BadRequestError(
        "Order must be completed before releasing payment."
      );
    }
    this.order.updateEscrowStatus("RELEASED");
  }

  markDisputed(disputeId: string) {
    this.order.disputeId = disputeId;
    this.order.updateEscrowStatus("DISPUTED");
  }

  completeOrder() {
    this.order.markCompleted();
  }
  setPaymentReference(reference: string) {
    this.order.setPaymentReference(reference);
  }

  // New methods for artisan response
  acceptOrder(estimatedCompletionDate?: Date): void {
    this.order.acceptOrder(estimatedCompletionDate);
  }

  rejectOrder(reason: RejectionReason, note?: string): void {
    this.order.rejectOrder(reason, note);
  }

  startWork(): void {
    this.order.markInProgress();
  }

  markWorkCompleted(): void {
    this.order.markAsWorkCompleted();
  }

  expireOrder(): void {
    this.order.expireOrder();
  }

  canArtisanRespond(): boolean {
    return this.order.canArtisanRespond();
  }
}
