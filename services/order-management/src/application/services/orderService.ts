import { Order } from "../../domain/entities/order";
import { OrderRepository } from "../../domain/repositories/orderRepository";

import { BadRequestError, RedisEventBus } from "@fixserv-colauncha/shared";

import { OrderAggregate } from "../../domain/aggregates/orderAggregate";
import {
  getClientById,
  getServiceById,
} from "../../infrastructure/reuseableWrapper/getUserProfile";
import { EscrowService } from "./escrowService";
import {
  OrderCreatedEvent,
  PaymentInitiatedEvent,
  PaymentReleasedEvent,
} from "../../events/orderEvents";
import { WalletClient } from "../../infrastructure/reuseableWrapper/walletClient";

export class OrderService {
  private eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  constructor(private orderRepository: OrderRepository) {}
  async createOrder(
    clientId: string,
    artisanId: string,
    serviceId: string,
    price: number,
    clientAddress: object,
    uploadedProductId: string
  ): Promise<Order> {
    const service = await getServiceById(serviceId);
    const client = await getClientById(clientId);

    console.log("Client ID from object:", client.id);

    const matchedProduct = client.uploadedProducts.find(
      (prod: any) => prod.id === uploadedProductId
    );

    if (!matchedProduct) {
      throw new BadRequestError(
        `Uploaded product with ID ${uploadedProductId} not found for this client`
      );
    }

    const orderAggregate = OrderAggregate.createNew(
      client.id,
      service.artisanId,
      service.id,
      service.details.price,
      client.deliveryAddress,
      client.uploadedProducts
    );

    const saveOrder = await this.orderRepository.save(orderAggregate.order);

    // Lock funds in client wallet
    await WalletClient.lockFundsForOrder(
      client.id,
      saveOrder.id,
      saveOrder.price
    );

    //PUBLISH Event
    const event = new OrderCreatedEvent({
      orderId: saveOrder.id,
      clientId: client.id,
      artisanId: service.artisanId,
      serviceId: service.id,
      price: service.details.price,
      clientAddress: client.deliveryAddress,
      createdAt: saveOrder.createdAt.toISOString(),
    });
    await this.eventBus.publish("order_events", event);

    return saveOrder;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new BadRequestError("No Order with that Id found");
    }
    return order;
  }

  async getPublicOrders(): Promise<Order[]> {
    return await this.orderRepository.findPublicOrders();
  }

  async initiatePayment(orderId: string): Promise<string> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new BadRequestError("Order not found");

    const reference = `fixserv-${orderId}-${Date.now()}`;
    order.paymentReference = reference;
    await EscrowService.initiatePayment(order);
    await this.orderRepository.update(order);

    const event = new PaymentInitiatedEvent({
      orderId,
      escrowStatus: "IN_ESCROW",
    });

    await this.eventBus.publish("OrderPaymentInitiated", event);
    return reference;
  }

  async markOrderAsCompleted(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new BadRequestError("Order not found");

    const aggregate = new OrderAggregate(order);
    aggregate.completeOrder();

    await this.orderRepository.update(aggregate.order);
  }

  async releasePayment(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    console.log("order in release payment", order);
    if (!order) throw new BadRequestError("Order not found");

    //const aggregate = new OrderAggregate(order);
    //aggregate.releasePayment();
    await WalletClient.releaseFundsToArtisan(order.id, order.artisanId);

    //previous working fix
    // await EscrowService.releasePayment(order);

    // await this.orderRepository.update(aggregate.order);
    await this.orderRepository.update(order);
    const event = new PaymentReleasedEvent({
      orderId,
      artisanId: order.artisanId,
      amount: order.price,
    });
    await this.eventBus.publish("OrderPaymentReleased", event);
  }

  async markAsDisputed(orderId: string, disputeId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");

    const aggregate = new OrderAggregate(order);
    aggregate.markDisputed(disputeId);

    await this.orderRepository.update(aggregate.order);
  }
}
