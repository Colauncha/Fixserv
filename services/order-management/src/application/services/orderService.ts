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
  WorkCompletedEvent,
  WorkStartedEvent,
} from "../../events/orderEvents";
import { WalletClient } from "../../infrastructure/reuseableWrapper/walletClient";
import { redis } from "@fixserv-colauncha/shared";
import { IServiceRepository } from "../../modules_from_other_services/domain/repository/serviceRepository";
import { ServiceModel } from "../../modules_from_other_services/infrastructure/persistence/model/serviceModel";
import { v4 as uuidv4 } from "uuid";

export class OrderService {
  private eventBus = RedisEventBus.instance(process.env.REDIS_URL);

  constructor(
    private serviceRepository: IServiceRepository,
    private orderRepository: OrderRepository,
  ) {}
  async createOrder(
    clientId: string,
    artisanId: string,
    serviceId: string,
    price: number,
    clientAddress: object,
    uploadedProductId: string,
    deviceType: string,
    deviceBrand: string,
    deviceModel: string,
    serviceRequired: string,
  ): Promise<Order> {
    const service = await getServiceById(serviceId);
    const client = await getClientById(clientId);

    console.log("Client ID from object:", client.id);
    console.log("service:", service);

    const matchedProduct = client.uploadedProducts.find(
      (prod: any) => prod.id === uploadedProductId,
    );

    if (!matchedProduct) {
      throw new BadRequestError(
        `Uploaded product with ID ${uploadedProductId} not found for this client`,
      );
    }

    const orderAggregate = OrderAggregate.createNew(
      client.id,
      service.artisanId,
      service.id,
      service.details.price,
      client.deliveryAddress,
      // client.uploadedProducts.id
      [matchedProduct],
      deviceType,
      deviceBrand,
      deviceModel,
      serviceRequired,
    );

    const saveOrder = await this.orderRepository.save(orderAggregate.order);

    // Lock funds in client wallet
    await WalletClient.lockFundsForOrder(
      client.id,
      saveOrder.id,
      saveOrder.price,
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

    if (order.status !== "WORK_COMPLETED") {
      throw new BadRequestError(
        "Order must be marked as WORK_COMPLETED before releasing payment",
      );
    }

    await WalletClient.releaseFundsToArtisan(order.id, order.artisanId);

    //previous working fix
    // await EscrowService.releasePayment(order);

    // await this.orderRepository.update(aggregate.order);

    // ✅ Use aggregate
    const aggregate = new OrderAggregate(order);
    aggregate.completeOrder();

    await this.orderRepository.update(aggregate.order);
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
    estimatedCompletionDate?: Date,
  ): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new BadRequestError("Order not found");

    // Verify artisan ownership
    if (order.artisanId !== artisanId) {
      throw new BadRequestError(
        "You are not authorized to respond to this order",
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
    note?: string,
  ): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new BadRequestError("Order not found");

    // Verify artisan ownership
    if (order.artisanId !== artisanId) {
      throw new BadRequestError(
        "You are not authorized to respond to this order",
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

  async completeWork(orderId: string, artisanId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new BadRequestError("Order not found");

    if (order.artisanId !== artisanId) {
      throw new BadRequestError(
        "You are not authorized to complete this order",
      );
    }

    const aggregate = new OrderAggregate(order);
    aggregate.markWorkCompleted();

    await this.orderRepository.update(aggregate.order);

    // Publish work completed event
    const event = new WorkCompletedEvent({
      orderId: order.id,
      artisanId: order.artisanId,
      clientId: order.clientId,
      completedAt: new Date().toISOString(),
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
      "Unable to fetch required data. Please try again later.",
    );
  }

  // Request repair (draftOrder)
  async createDraftOrder(
    clientId: string,
    uploadedProductId: string,
    deviceType: string,
    deviceBrand: string,
    deviceModel: string,
    serviceRequired: string,
  ): Promise<{ draftOrderId: string; matchingServices: any[] }> {
    const client = await getClientById(clientId);
    const matchedProduct = client.uploadedProducts.find(
      (prod: any) => prod.id === uploadedProductId,
    );
    if (!matchedProduct) {
      throw new BadRequestError(
        `Uploaded product with ID ${uploadedProductId} not found for this client`,
      );
    }

    //Create a draft order (temporary, not yet confirmed)
    const draftOrder = {
      id: uuidv4(),
      clientId: client.id,
      uploadedProducts: [matchedProduct],
      deviceType,
      deviceBrand,
      deviceModel,
      serviceRequired,
      status: "DRAFT", // Important: mark as draft
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min expiry
    };

    // Save draft order to repository or cache (Redis is perfect for this)
    // await this.draftOrderRepository.save(draftOrder);
    // OR use Redis for temporary storage:

    if (!redis) {
      throw new Error("Not Initialized");
    }
    await redis.set(
      `draft_order:${draftOrder.id}`,
      JSON.stringify(draftOrder),
      { EX: 1800 },
    );

    // Search for matching services based on serviceRequired
    const matchingServices = await this.searchMatchingServices(serviceRequired);

    return { draftOrderId: draftOrder.id, matchingServices };
  }

  // Search for services that match the required service
  async searchMatchingServices(serviceRequired: string): Promise<any[]> {
    //// This would typically call the service-management service to find //matching services
    //// For simplicity, let's assume we have a local method to do this
    //const allServices = await this.serviceRepository.getAllServices();
    //return allServices.filter((service) =>
    //  service.details.title
    //    .toLowerCase()
    //    .includes(serviceRequired.toLowerCase())
    //);

    // Search services where skillSet contains keywords from serviceRequired
    const keywords = serviceRequired.toLowerCase().split(" ");

    /*
    // MongoDB query example
    const services = await (this.serviceRepository as any).findWithQuery({
      isActive: true,
      $or: [
        // Match against skillSet array
        { skillSet: { $in: keywords.map((k) => new RegExp(k, "i")) } },
        // Match against title
        { title: { $regex: serviceRequired, $options: "i" } },
        // Match against description
        { description: { $regex: serviceRequired, $options: "i" } },
      ],
    });
*/
    // Direct MongoDB query - properly structured
    const services = await ServiceModel.find({
      isActive: true,
      $or: [
        { skillSet: { $in: keywords.map((k) => new RegExp(k, "i")) } },
        { title: { $regex: serviceRequired, $options: "i" } },
        { description: { $regex: serviceRequired, $options: "i" } },
      ],
    }).lean();
    // Sort by relevance (services with more matching keywords first)
    const servicesWithScore = services.map((service: any) => {
      let score = 0;
      const serviceText = [
        service.title,
        service.description,
        ...service.skillSet,
      ]
        .join(" ")
        .toLowerCase();

      keywords.forEach((keyword) => {
        if (serviceText.includes(keyword)) score++;
      });

      return { ...service, id: service._id, relevanceScore: score }; // Use toJSON() if it's a Mongoose document
    });

    // Sort by score descending, then by rating
    return servicesWithScore
      .sort((a: any, b: any) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        // return b.rating - a.rating;
        return (b.rating || 0) - (a.rating || 0);
      })
      .slice(0, 10); // Return top 10 matches
  }

  async confirmOrder(
    clientId: string,
    draftOrderId: string,
    selectedServiceId: string,
  ): Promise<Order> {
    // Retrieve draft order
    // const draftOrder = await this.draftOrderRepository.findById(draftOrderId);
    // OR from Redis:
    if (!redis) {
      throw new Error("Not Initialized");
    }
    const draftOrderData = await redis.get(`draft_order:${draftOrderId}`);
    const draftOrder = draftOrderData ? JSON.parse(draftOrderData) : null;

    if (!draftOrder) {
      throw new BadRequestError("Draft order not found or expired");
    }

    if (draftOrder.clientId !== clientId) {
      throw new BadRequestError("Unauthorized access to draft order");
    }

    // Get selected service details
    const service = await getServiceById(selectedServiceId);
    const client = await getClientById(clientId);

    console.log("service in confirmOrder:", service);
    console.log("client in confirmOrder:", client);

    // Create the actual order
    const orderAggregate = OrderAggregate.createNew(
      client.id,
      service.artisanId,
      service.id,
      service.details.price, // Use service price, not client-provided
      client.deliveryAddress,
      draftOrder.uploadedProducts,
      draftOrder.deviceType,
      draftOrder.deviceBrand,
      draftOrder.deviceModel,
      draftOrder.serviceRequired,
    );

    const savedOrder = await this.orderRepository.save(orderAggregate.order);

    // Lock funds in client wallet
    await WalletClient.lockFundsForOrder(
      client.id,
      savedOrder.id,
      savedOrder.price,
    );

    // Delete draft order after confirmation
    // await this.draftOrderRepository.delete(draftOrderId);
    // OR from Redis:
    await redis.del(`draft_order:${draftOrderId}`);

    // Publish Event
    const event = new OrderCreatedEvent({
      orderId: savedOrder.id,
      clientId: client.id,
      artisanId: service.artisanId,
      serviceId: service.id,
      price: service.price,
      title: service.title,
      clientAddress: client.deliveryAddress,
      createdAt: savedOrder.createdAt.toISOString(),
    });
    await this.eventBus.publish("order_events", event);

    return savedOrder;
  }

  //Request history(order history)
  //async getOrderHistory(clientId: string): Promise<Order[]> {
  //  return this.orderRepository.findByClientId(clientId)
  //}
}
