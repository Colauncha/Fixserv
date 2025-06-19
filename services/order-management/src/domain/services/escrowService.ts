/*
import { OrderRepository } from "../repositories/orderRepository";
import { EscrowDetails } from "../value-objects/escrowDetails";

export class EscrowService {
  constructor(
    private paymentService: IPaymentService,
    private orderRepository: OrderRepository,
    private notificationService: INotificationService
  ) {}

  async initiateEscrow(orderId: string, amount: number): Promise<void> {
    const escrowId = `escrow_${Date.now()}`;

    // Create escrow with payment provider
    await this.paymentService.createEscrow(escrowId, amount);

    // Update order with escrow details
    await this.orderRepository.updateEscrowDetails(
      orderId,
      new EscrowDetails(escrowId, amount, "HELD")
    );

    // Notify both parties
    await this.notificationService.notifyEscrowCreated(
      orderId,
      escrowId,
      amount
    );
  }

  async handleOrderCompletion(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");

    // Notify client to release payment
    await this.notificationService.requestPaymentRelease(
      order.clientId,
      orderId,
      order.escrowDetails.amount
    );
  }

  async handleDispute(orderId: string, reason: string): Promise<void> {
    const disputeId = `dispute_${Date.now()}`;
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");

    // Update order with dispute details
    const updatedEscrow = new EscrowDetails(
      order.escrowDetails.escrowId,
      order.escrowDetails.amount,
      "DISPUTED",
      new DisputeDetails(disputeId, reason, new Date())
    );

    await this.orderRepository.updateEscrowDetails(orderId, updatedEscrow);

    // Notify admin and both parties
    await this.notificationService.notifyDisputeOpened(
      orderId,
      disputeId,
      reason
    );
  }

  async resolveDispute(
    orderId: string,
    resolution: "RELEASE" | "REFUND",
    resolutionNotes: string
  ): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order || !order.escrowDetails.disputeDetails) {
      throw new Error("Order or dispute not found");
    }

    // Update dispute details
    const updatedDispute = new DisputeDetails(
      order.escrowDetails.disputeDetails.disputeId,
      order.escrowDetails.disputeDetails.reason,
      order.escrowDetails.disputeDetails.openedAt,
      new Date(),
      resolutionNotes
    );

    const updatedEscrow = new EscrowDetails(
      order.escrowDetails.escrowId,
      order.escrowDetails.amount,
      resolution === "RELEASE" ? "RELEASED" : "REFUNDED",
      updatedDispute
    );

    // Execute resolution
    if (resolution === "RELEASE") {
      await this.paymentService.releaseEscrow(order.escrowDetails.escrowId);
    } else {
      await this.paymentService.refundEscrow(order.escrowDetails.escrowId);
    }

    // Update order
    await this.orderRepository.updateEscrowDetails(orderId, updatedEscrow);

    // Notify both parties
    await this.notificationService.notifyDisputeResolved(
      orderId,
      resolution,
      resolutionNotes
    );
  }
}
*/

/*
import { IPaymentService } from "../repositories/IPaymentService";
import { OrderRepository } from "../repositories/orderRepository";

// src/domain/services/escrow-service.ts
export class EscrowService {
  constructor(
    private paymentService: IPaymentService,
    // private notificationService: INotificationService,
    private orderRepository: OrderRepository
  ) {}

  async initializeEscrow(orderId: string, amount: number): Promise<string> {
    // const escrowId = `escrow_${uuidv4()}`;

    // Create escrow with payment service
    await this.paymentService.createEscrowPayment({
      escrowId,
      amount,
      clientId: "", // Will be set in order
      artisanId: "", // Will be set in order
      orderId,
    });

    // Update order with escrow details
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");

    order.escrowDetails = new EscrowDetails(escrowId, amount, "HELD");

    await this.orderRepository.save(order);

    // Notify parties
    await this.notificationService.notifyArtisanNewOrder(
      order.artisanId,
      orderId
    );

    await this.notificationService.notifyClientEscrowCreated(
      order.clientId,
      orderId,
      amount
    );

    return escrowId;
  }

  async releasePayment(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");

    // Verify order is completed
    if (order.status !== "COMPLETED") {
      throw new Error("Order must be completed before releasing payment");
    }

    // Release funds
    await this.paymentService.releaseEscrowPayment(
      order.escrowDetails.escrowId
    );

    // Update order payment status
    order.updatePaymentStatus("RELEASED");
    await this.orderRepository.save(order);

    // Notify artisan
    await this.notificationService.notifyPaymentReleased(
      order.artisanId,
      orderId,
      order.escrowDetails.amount
    );
  }

  async handleDispute(
    orderId: string,
    reason: string,
    raisedBy: "CLIENT" | "ARTISAN",
    userId: string
  ): Promise<string> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");

    const disputeId = `dispute_${uuidv4()}`;

    // Update order with dispute details
    order.escrowDetails.disputeDetails = new DisputeDetails(
      disputeId,
      reason,
      new Date()
    );
    order.updatePaymentStatus("DISPUTED");

    await this.orderRepository.save(order);

    // Notify admin and both parties
    await this.notificationService.notifyDisputeOpened(
      orderId,
      disputeId,
      raisedBy,
      userId
    );

    return disputeId;
  }

  async resolveDispute(
    orderId: string,
    resolution: "RELEASE" | "REFUND",
    resolutionNotes: string
  ): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order || !order.escrowDetails.disputeDetails) {
      throw new Error("Order or dispute not found");
    }

    // Execute resolution
    if (resolution === "RELEASE") {
      await this.paymentService.releaseEscrowPayment(
        order.escrowDetails.escrowId
      );
    } else {
      await this.paymentService.refundEscrowPayment(
        order.escrowDetails.escrowId
      );
    }

    // Update dispute details
    order.escrowDetails.disputeDetails.resolvedAt = new Date();
    order.escrowDetails.disputeDetails.resolution = resolutionNotes;
    order.updatePaymentStatus(
      resolution === "RELEASE" ? "RELEASED" : "REFUNDED"
    );

    await this.orderRepository.save(order);

    // Notify parties
    await this.notificationService.notifyDisputeResolved(
      orderId,
      resolution,
      resolutionNotes
    );
  }
}
*/
