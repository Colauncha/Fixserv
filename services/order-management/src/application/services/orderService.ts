import { v4 as uuidv4 } from "uuid";
import { Order, OrderStatus, PaymentStatus } from "../../domain/entities/order";
import { OrderRepository } from "../../domain/repositories/orderRepository";
import { EscrowDetails } from "../../domain/value-objects/escrowDetails";
import { orderRepositoryImpls } from "../../infrastructure/persistence/orderRepositoryImpl";
import { IPaymentService } from "../../domain/repositories/IPaymentService";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { PaymentService } from "../../domain/services/paymentService";

export class OrderService {
  constructor(
    private orderRepository: orderRepositoryImpls,
    private paymentService: PaymentService // private notificationService: INotificationService
  ) {}

  async createOrder(
    clientId: string,
    artisanId: string,
    serviceId: string,
    amount: number
  ): Promise<Order> {
    const escrowId = uuidv4();
    const orderId = uuidv4();

    const order = new Order(
      orderId,
      clientId,
      artisanId,
      serviceId,
      OrderStatus.PENDING,
      PaymentStatus.PENDING,
      new EscrowDetails(escrowId, amount, "HELD")
    );

    // Initiate escrow payment
    await this.paymentService.createEscrowPayment({
      escrowId,
      amount,
      clientId,
      artisanId,
      orderId,
    });

    await this.orderRepository.save(order);

    // Notify artisan
    // await this.notificationService.notifyArtisanNewOrder(artisanId, //orderId);

    return order;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new BadRequestError("No Order with that Id found");
    }
    return order;
  }

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    actorId: string
  ): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new BadRequestError("Order not found");
    }

    // Validate status transition
    this.validateStatusTransition(order.status, newStatus, actorId, order);

    await this.orderRepository.updateStatus(orderId, newStatus);

    // Handle status-specific logic
    // if (newStatus === OrderStatus.COMPLETED) {
    //   await this.handleOrderCompletion(order);
    // }
  }

  async releasePayment(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.paymentStatus !== PaymentStatus.HELD_IN_ESCROW) {
      throw new Error("Payment cannot be released from current status");
    }

    await this.paymentService.releaseEscrowPayment(
      order.escrowDetails.escrowId
    );

    await this.orderRepository.updatePaymentStatus(
      orderId,
      PaymentStatus.RELEASED
    );

    //await this.notificationService.notifyPaymentReleased(
    //  order.artisanId,
    //  orderId,
    //  order.escrowDetails.amount
    //);
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    actorId: string,
    order: Order
  ): void {
    // Implement your status transition validation logic here
    // Example: Only artisan can accept an order
    if (newStatus === OrderStatus.ACCEPTED && actorId !== order.artisanId) {
      throw new Error("Only artisan can accept an order");
    }
    // Add other validation rules...
  }

  /*
  private async handleOrderCompletion(order: Order): Promise<void> {
    // Send completion notifications
    await Promise.all([
      this.notificationService.notifyOrderCompletion(
        order.clientId,
        order.orderId
      ),
      this.notificationService.notifyOrderCompletion(
        order.artisanId,
        order.orderId
      ),
    ]);

    // Request review
    await this.notificationService.requestReview(order.clientId, order.orderId);
  }
    */
}
