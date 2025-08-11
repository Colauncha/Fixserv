import { OrderModel } from "./models/orderModel";
import { Order } from "../../domain/entities/order";

import { OrderRepository } from "../../domain/repositories/orderRepository";

export class orderRepositoryImpls implements OrderRepository {
  constructor(private orderModel: typeof OrderModel) {}

  async save(order: Order): Promise<Order> {
    const data = this.toPersistence(order);
    const created = await OrderModel.create(data);
    return this.toDomain(created.toObject());
  }

  async findById(id: string): Promise<Order | null> {
    const doc = await OrderModel.findById(id).lean();

    return doc ? this.toDomain(doc) : null;
  }

  async findByClientId(clientId: string): Promise<Order[]> {
    const docs = await this.orderModel.find({ clientId }).lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByArtisanId(artisanId: string): Promise<Order[]> {
    const docs = await this.orderModel.find({ artisanId }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findPublicOrders(): Promise<Order[]> {
    const docs = await OrderModel.find({ status: { $ne: "CANCELLED" } }).lean();
    return Promise.all(docs.map((doc) => this.toDomain(doc)));
  }

  async update(order: Order): Promise<void> {
    const data = this.toPersistence(order);

    await OrderModel.findByIdAndUpdate(order.id, data, { new: true });
  }

  async delete(id: string): Promise<void> {
    await OrderModel.findByIdAndDelete(id);
  }

  toDomain(raw: any): Order {
    return new Order(
      raw._id,
      raw.clientId,
      raw.artisanId,
      raw.serviceId,
      raw.price,
      raw.clientAddress,
      raw.status,
      raw.escrowStatus,
      raw.paymentReference,
      new Date(raw.createdAt),
      raw.completedAt ? new Date(raw.completedAt) : undefined,
      raw.disputeId,
      raw.uploadedProducts || []
    );
  }
  toPersistence(order: Order): any {
    return {
      _id: order.id,
      clientId: order.clientId,
      artisanId: order.artisanId,
      serviceId: order.serviceId,
      price: order.price,
      clientAddress: order.clientAddress,
      status: order.status,
      escrowStatus: order.escrowStatus,
      paymentReference: order.paymentReference,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      disputeId: order.disputeId ?? null,
      uploadedProducts: order.uploadedProducts.map((product) => ({
        id: product.id,
        imageUrl: product.imageUrl,
        description: product.description,
        objectName: product.objectName,
        uploadedAt: product.uploadedAt,
      })),
    };
  }
}
