import { Order, RejectionReason } from "../../domain/entities/order";
import { OrderRepository } from "../../domain/repositories/orderRepository";

import { BadRequestError, RedisEventBus } from "@fixserv-colauncha/shared";

import { OrderAggregate } from "../../domain/aggregates/orderAggregate";
import {
  getClientById,
  getServiceById,
} from "../../infrastructure/reuseableWrapper/getUserProfile";
import { EscrowService } from "./escrowService";
import {
  OrderAcceptedEvent,
  OrderCreatedEvent,
  OrderExpiredEvent,
  OrderRejectedEvent,
  PaymentInitiatedEvent,
  PaymentReleasedEvent,
  WorkStartedEvent,
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
    console.log("service:", service);

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
      title: service.details.title,
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
  // New methods for artisan response
  async acceptOrder(
    orderId: string,
    artisanId: string,
    estimatedCompletionDate?: Date
  ): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new BadRequestError("Order not found");

    // Verify artisan ownership
    if (order.artisanId !== artisanId) {
      throw new BadRequestError(
        "You are not authorized to respond to this order"
      );
    }

    const aggregate = new OrderAggregate(order);
    aggregate.acceptOrder(estimatedCompletionDate);

    await this.orderRepository.update(aggregate.order);

    // Publish event
    const event = new OrderAcceptedEvent({
      orderId: order.id,
      artisanId: order.artisanId,
      clientId: order.clientId,
      acceptedAt: new Date().toISOString(),
      estimatedCompletionDate: estimatedCompletionDate?.toISOString(),
    });
    await this.eventBus.publish("order_events", event);
  }

  async rejectOrder(
    orderId: string,
    artisanId: string,
    reason: RejectionReason,
    note?: string
  ): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new BadRequestError("Order not found");

    // Verify artisan ownership
    if (order.artisanId !== artisanId) {
      throw new BadRequestError(
        "You are not authorized to respond to this order"
      );
    }

    const aggregate = new OrderAggregate(order);
    aggregate.rejectOrder(reason, note);

    await this.orderRepository.update(aggregate.order);

    // Release locked funds back to client since order is rejected
    await WalletClient.refundClient(order.id, order.clientId);

    // Publish event
    const event = new OrderRejectedEvent({
      orderId: order.id,
      artisanId: order.artisanId,
      clientId: order.clientId,
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason,
      rejectionNote: note,
    });
    await this.eventBus.publish("order_events", event);
  }

  async startWork(orderId: string, artisanId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new BadRequestError("Order not found");

    if (order.artisanId !== artisanId) {
      throw new BadRequestError("You are not authorized to work on this order");
    }

    const aggregate = new OrderAggregate(order);
    aggregate.startWork();

    await this.orderRepository.update(aggregate.order);

    // Publish work started event
    const event = new WorkStartedEvent({
      orderId: order.id,
      artisanId: order.artisanId,
      clientId: order.clientId,
      startedAt: new Date().toISOString(),
    });
    await this.eventBus.publish("order_events", event);
  }

  async getArtisanOrders(artisanId: string, status?: string): Promise<Order[]> {
    return await this.orderRepository.findByArtisanId(artisanId, status);
  }

  async getClientOrders(clientId: string, status?: string): Promise<Order[]> {
    return await this.orderRepository.findByClientId(clientId, status);
  }

  async getPendingOrdersForArtisan(artisanId: string): Promise<Order[]> {
    return await this.orderRepository.findPendingOrdersForArtisan(artisanId);
  }

  // Background job to handle expired orders
  async handleExpiredOrders(): Promise<void> {
    const expiredOrders = await this.orderRepository.findExpiredPendingOrders();

    for (const order of expiredOrders) {
      const aggregate = new OrderAggregate(order);
      aggregate.expireOrder();

      await this.orderRepository.update(aggregate.order);

      // Release funds back to client
      await WalletClient.refundClient(order.id, order.clientId);

      // Publish event
      const event = new OrderExpiredEvent({
        orderId: order.id,
        artisanId: order.artisanId,
        clientId: order.clientId,
        expiredAt: new Date().toISOString(),
      });
      await this.eventBus.publish("order_events", event);
    }
  }
  //async testing(serviceId: string, clientId: string, userId: string) {
  //  const service = await getServiceById(serviceId);
  //  const client = await getClientById(clientId);
  //  const wallet = await WalletClient.getTransactionHistory(userId);
  //  return { service, client, wallet };
  //}
  async testing(serviceId: string, clientId: string, userId: string) {
    const results: any = {};
    const errors: any = {};

    // Fetch all services concurrently but handle errors individually
    const promises = [
      getServiceById(serviceId)
        .then((data) => ({ service: data }))
        .catch((err) => ({ serviceError: err.message })),
      getClientById(clientId)
        .then((data) => ({ client: data }))
        .catch((err) => ({ clientError: err.message })),
      WalletClient.getTransactionHistory(userId)
        .then((data) => ({ wallet: data }))
        .catch((err) => ({ walletError: err.message })),
    ];

    const responses = await Promise.allSettled(promises);

    responses.forEach((response, index) => {
      if (response.status === "fulfilled") {
        Object.assign(results, response.value);
      } else {
        const errorKey = ["serviceError", "clientError", "walletError"][index];
        errors[errorKey] = response.reason?.message || "Unknown error";
      }
    });

    // Log partial failures but don't throw unless everything failed
    if (Object.keys(errors).length > 0) {
      console.warn("⚠️ Some service calls failed:", errors);
    }

    // If we have at least some data, return it with error info
    if (Object.keys(results).length > 0) {
      return {
        ...results,
        ...(Object.keys(errors).length > 0 && { errors }),
      };
    }

    // All calls failed
    throw new BadRequestError(
      "Unable to fetch required data. Please try again later."
    );
  }
}
