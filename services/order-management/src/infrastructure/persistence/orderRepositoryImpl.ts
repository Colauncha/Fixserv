import { OrderModel } from "./models/orderModel";
import { Order, OrderStatus, PaymentStatus } from "../../domain/entities/order";
import { EscrowDetails } from "../../domain/value-objects/escrowDetails";
import { DisputeDetails } from "../../domain/value-objects/disputeDetails";
import { OrderRepository } from "../../domain/repositories/orderRepository";

interface OrderDocument {
  orderId: string;
  clientId: string;
  artisanId: string;
  serviceId: string;
  status: string;
  paymentStatus: string;
  escrowDetails: {
    escrowId: string;
    amount: number;
    status: any;
    disputeDetails?: {
      disputeId: string;
      reason: string;
      openedAt: Date;
      resolvedAt?: Date;
      resolution?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export class orderRepositoryImpls implements OrderRepository {
  constructor(private orderModel: typeof OrderModel) {}

  async findById(orderId: string): Promise<Order | null> {
    const doc = await this.orderModel.findOne({ orderId }).exec();
    if (!doc) return null;

    return this.toDomain(doc);
  }

  async save(order: Order): Promise<void> {
    const doc = this.toDocument(order);
    await this.orderModel
      .findOneAndUpdate({ orderId: order.orderId }, doc, { upsert: true })
      .exec();
  }

  async findByClientId(clientId: string): Promise<Order[]> {
    const docs = await this.orderModel.find({ clientId }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByArtisanId(artisanId: string): Promise<Order[]> {
    const docs = await this.orderModel.find({ artisanId }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    await this.orderModel
      .updateOne({ orderId }, { $set: { status, updatedAt: new Date() } })
      .exec();
  }

  async updatePaymentStatus(
    orderId: string,
    status: PaymentStatus
  ): Promise<void> {
    await this.orderModel
      .updateOne(
        { orderId },
        { $set: { paymentStatus: status, updatedAt: new Date() } }
      )
      .exec();
  }

  private toDomain(doc: OrderDocument): Order {
    const escrowDetails = new EscrowDetails(
      doc.escrowDetails.escrowId,
      doc.escrowDetails.amount,
      doc.escrowDetails.status,
      doc.escrowDetails.disputeDetails
        ? new DisputeDetails(
            doc.escrowDetails.disputeDetails.disputeId,
            doc.escrowDetails.disputeDetails.reason,
            doc.escrowDetails.disputeDetails.openedAt,
            doc.escrowDetails.disputeDetails.resolvedAt,
            doc.escrowDetails.disputeDetails.resolution
          )
        : undefined
    );

    return new Order(
      doc.orderId,
      doc.clientId,
      doc.artisanId,
      doc.serviceId,
      doc.status as OrderStatus,
      doc.paymentStatus as PaymentStatus,
      escrowDetails,
      doc.createdAt,
      doc.updatedAt
    );
  }
  private toDocument(order: Order): OrderDocument {
    return {
      orderId: order.orderId,
      clientId: order.clientId,
      artisanId: order.artisanId,
      serviceId: order.serviceId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      escrowDetails: {
        escrowId: order.escrowDetails.escrowId,
        amount: order.escrowDetails.amount,
        status: order.escrowDetails.status,
        disputeDetails: order.escrowDetails.disputeDetails
          ? {
              disputeId: order.escrowDetails.disputeDetails.disputeId,
              reason: order.escrowDetails.disputeDetails.reason,
              openedAt: order.escrowDetails.disputeDetails.openedAt,
              resolvedAt: order.escrowDetails.disputeDetails.resolvedAt,
              resolution: order.escrowDetails.disputeDetails.resolution,
            }
          : undefined,
      },
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
