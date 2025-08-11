import { v4 as uuidv4 } from "uuid";

import { Order } from "../entities/order";
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
    const order = new Order(
      id,
      clientId,
      artisanId,
      serviceId,
      price,
      clientAddress,
      "PENDING", // status is initially PENDING
      "NOT_PAID", // escrowStatus is initially NOT_PAID
      "", // paymentReference is initially empty
      new Date(), // createdAt is set to now
      undefined, // completedAt is initially undefined
      undefined, // disputeId is initially undefined
      uploadedProducts // uploadedProducts is passed as an argument
    );

    return new OrderAggregate(order);
  }

  // static createPublicOrder(cli) {}

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
}
