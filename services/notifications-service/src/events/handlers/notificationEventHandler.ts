import { RedisEventBus } from "@fixserv-colauncha/shared";
import { NotificationService } from "../../application/services/notificationService";

export class NotificationEventHandler {
  private eventBus: RedisEventBus;
  private notificationService: NotificationService;
  private subscriptions: { unsubscribe: () => Promise<void> }[] = [];

  constructor(notificationService: NotificationService) {
    this.eventBus = RedisEventBus.instance(process.env.REDIS_URL);
    this.notificationService = notificationService;
  }

  async setupSubscriptions(): Promise<void> {
    // Subscribe to user events
    const userEventsSub = await this.eventBus.subscribe(
      "user_events",
      async (evt: any) => {
        switch (evt.eventName) {
          case "UserCreatedEvent":
            await this.handleUserCreated(evt);
            break;
        }
      },
    );
    console.log("Subscribed to user_events");
    this.subscriptions.push(userEventsSub);

    // Subscribe to review events
    const reviewEventsSub = await this.eventBus.subscribe(
      "review_events",
      async (evt: any) => {
        switch (evt.eventName) {
          case "ReviewCreated":
            await this.handleReviewCreated(evt);
            break;
          case "ReviewPublished":
            await this.handleReviewPublished(evt);
            break;
        }
      },
    );
    this.subscriptions.push(reviewEventsSub);

    // Subscribe to order events
    const orderEventsSub = await this.eventBus.subscribe(
      "order_events",
      async (evt: any) => {
        switch (evt.eventName) {
          case "OrderCreated":
            await this.handleOrderCreated(evt);
            break;
          case "ArtisanOrderNotification":
            await this.handleArtisanOrderNotification(evt);
            break;
          case "OrderAccepted":
            await this.handleOrderAccepted(evt);
            break;
          case "OrderRejected":
            await this.handleOrderRejected(evt);
            break;
          case "OrderCompleted":
            await this.handleOrderCompleted(evt);
            break;
          case "PaymentProcessed":
            await this.handlePaymentProcessed(evt);
            break;
          case "WorkStarted":
            await this.handleWorkStarted(evt);
            break;
          case "WorkCompleted":
            await this.handleWorkCompleted(evt);
            break;
          case "OrderPaymentReleased":
            await this.handlePaymentRelease(evt);
            break;
          case "OrderCancelled":
            await this.handleOrderCancelled(evt);
            break;
        }
      },
    );
    this.subscriptions.push(orderEventsSub);

    //subscribe to service events
    const serviceEventsSub = await this.eventBus.subscribe(
      "service_events",
      async (evt: any) => {
        switch (evt.eventName) {
          case "ServiceCreated":
            await this.handleServiceCreated(evt);
            break;
        }
      },
    );
    this.subscriptions.push(serviceEventsSub);

    const walletEventsSub = await this.eventBus.subscribe(
      "wallet_events",
      async (evt: any) => {
        switch (evt.eventName) {
          // case "WalletTopUpEvent":
          case "WalletTopUp":
            await this.handleWalletTopUp(evt);
            break;
          case "WalletWithdrawal":
            await this.handleWalletWithdrawal(evt);
            break;
          case "WalletTopUpFailed":
            await this.handleWalletTopUpFailed(evt);
            break;
        }
      },
    );
    this.subscriptions.push(walletEventsSub);
    console.log("Notification service subscribed to all events");
  }

  async cleanup(): Promise<void> {
    await Promise.all(this.subscriptions.map((sub) => sub.unsubscribe()));
    this.subscriptions = [];
  }

  private async handleUserCreated(event: any): Promise<void> {
    try {
      await this.notificationService.createNotification({
        userId: event.payload.userId,
        type: "USER_CREATED",
        title: "Welcome to FixServ!",
        message: `Hello ${event.payload.fullName}, welcome to our platform!`,
        data: {
          userRole: event.payload.role,
          email: event.payload.email,
        },
      });

      console.log(
        `Welcome notification created for user: ${event.payload.fullName}`,
      );
    } catch (error) {
      console.error("Error handling UserCreated event:", error);
    }
  }

  private async handleReviewCreated(event: any): Promise<void> {
    try {
      await this.notificationService.createNotification({
        userId: event.payload.artisanId,
        type: "REVIEW_CREATED",
        title: "New Review Received",
        message: "You have received a new review for your service.",
        data: {
          reviewId: event.payload.reviewId,
          clientId: event.payload.clientId,
        },
      });

      console.log(
        `Review notification created for artisan: ${event.payload.artisanId}`,
      );
    } catch (error) {
      console.error("Error handling ReviewCreated event:", error);
    }
  }

  private async handleReviewPublished(event: any): Promise<void> {
    try {
      await this.notificationService.createNotification({
        userId: event.payload.artisanId,
        type: "REVIEW_PUBLISHED",
        title: "Review Published",
        message:
          "Your review has been published and is now visible to other users.",
        data: {
          reviewId: event.payload.reviewId,
          rating: event.payload.rating,
        },
      });

      console.log(
        `Review published notification created for artisan: ${event.payload.artisanId}`,
      );
    } catch (error) {
      console.error("Error handling ReviewPublished event:", error);
    }
  }

  private async handleOrderCreated(event: any): Promise<void> {
    try {
      console.log("event:", event);
      // Notify artisan about new order
      await this.notificationService.createNotification({
        userId: event.payload.artisanId,
        type: "BOOKING_CONFIRMED",
        title: "New Order Received",
        message: `You have received a new order for ${event.payload.title}.`,
        data: {
          orderId: event.payload.orderId,
          clientId: event.payload.clientId,
          title: event.payload.title,
          amount: event.payload.price,
        },
      });

      // Notify client about order confirmation
      await this.notificationService.createNotification({
        userId: event.payload.clientId,
        type: "BOOKING_CONFIRMED",
        title: "Order Confirmed",
        message: `Your order for ${event.payload.title} has been confirmed.`,
        data: {
          orderId: event.payload.orderId,
          artisanId: event.payload.artisanId,
          title: event.payload.title,
          amount: event.payload.price,
        },
      });

      console.log(
        `Order notifications created for order: ${event.payload.orderId}`,
      );
    } catch (error) {
      console.error("Error handling OrderCreated event:", error);
    }
  }

  private async handleOrderCompleted(event: any): Promise<void> {
    try {
      // Notify client about order completion
      await this.notificationService.createNotification({
        userId: event.payload.clientId,
        type: "BOOKING_CONFIRMED",
        title: "Order Completed",
        message: "Your order has been completed successfully!",
        data: {
          orderId: event.payload.orderId,
          artisanId: event.payload.artisanId,
        },
      });

      console.log(
        `Order completion notification created for client: ${event.payload.clientId}`,
      );
    } catch (error) {
      console.error("Error handling OrderCompleted event:", error);
    }
  }

  private async handlePaymentProcessed(event: any): Promise<void> {
    try {
      // Notify both parties about payment
      await this.notificationService.createNotification({
        userId: event.payload.clientId,
        type: "PAYMENT_PROCESSED",
        title: "Payment Processed",
        message: `Your payment of ₦${event.payload.amount} has been processed successfully.`,
        data: {
          orderId: event.payload.orderId,
          amount: event.payload.amount,
          reference: event.payload.reference,
        },
      });

      await this.notificationService.createNotification({
        userId: event.payload.artisanId,
        type: "PAYMENT_PROCESSED",
        title: "Payment Received",
        message: `You have received a payment of ₦${event.payload.amount}.`,
        data: {
          orderId: event.payload.orderId,
          amount: event.payload.amount,
          reference: event.payload.reference,
        },
      });

      console.log(
        `Payment notifications created for order: ${event.payload.orderId}`,
      );
    } catch (error) {
      console.error("Error handling PaymentProcessed event:", error);
    }
  }

  private async handleServiceCreated(event: any): Promise<void> {
    try {
      // Notify artisan about new service
      await this.notificationService.createNotification({
        userId: event.payload.artisanId,
        type: "SERVICE_CREATED",
        title: "New Service Created",
        message: `You have created a new service: ${event.payload.serviceName}.`,
        data: {
          serviceId: event.payload.serviceId,
          serviceName: event.payload.serviceName || event.payload.title,
        },
      });

      console.log(
        `Service created notification created for artisan: ${event.payload.artisanId}`,
      );
    } catch (error) {
      console.error("Error handling ServiceCreated event:", error);
    }
  }

  private async handleWalletTopUp(event: any): Promise<void> {
    try {
      const { amount, reference } = event.payload;
      // Notify user about wallet top-up
      await this.notificationService.createNotification({
        userId: event.payload.userId,
        type: "WALLET_TOPUP",
        title: "Wallet Top-Up Successful",
        message: `Your wallet has been credited with ₦${amount.toLocaleString()}.`,
        data: {
          amount: event.payload.amount,
          // transactionId: event.payload.transactionId,
          reference,
        },
      });

      console.log(
        `Wallet top-up notification created for user: ${event.payload.userId}`,
      );
    } catch (error) {
      console.error("Error handling WalletTopUpEvent:", error);
    }
  }
  // Add the handler method:
  private async handleArtisanOrderNotification(event: any): Promise<void> {
    try {
      const {
        artisanId,
        orderId,
        clientId,
        serviceTitle,
        price,
        deviceType,
        deviceBrand,
        deviceModel,
        serviceRequired,
      } = event.payload;

      await this.notificationService.createNotification({
        userId: artisanId, // targets ONLY this specific artisan
        type: "NEW_ORDER_REQUEST",
        title: "New Order Request",
        message: `A client has requested your service: ${serviceTitle}. Device: ${deviceBrand} ${deviceModel} (${deviceType}). Issue: ${serviceRequired}. Price: ₦${price}. Please accept or reject this order.`,
        data: {
          orderId,
          clientId,
          serviceTitle,
          price,
          deviceType,
          deviceBrand,
          deviceModel,
          serviceRequired,
          actionRequired: true, // useful for frontend to show action buttons
          actions: ["ACCEPT", "REJECT"],
        },
      });

      console.log(
        `✅ Order notification sent to artisan: ${artisanId} for order: ${orderId}`,
      );
    } catch (error) {
      console.error("Error handling ArtisanOrderNotification event:", error);
    }
  }

  // Also add handlers for accept/reject so the CLIENT gets notified too:
  private async handleOrderAccepted(event: any): Promise<void> {
    try {
      await this.notificationService.createNotification({
        userId: event.payload.clientId,
        type: "ORDER_ACCEPTED",
        title: "Order Accepted!",
        message: `Great news! Your order has been accepted by the artisan.${
          event.payload.estimatedCompletionDate
            ? ` Estimated completion: ${new Date(event.payload.estimatedCompletionDate).toLocaleDateString()}`
            : ""
        }`,
        data: {
          orderId: event.payload.orderId,
          artisanId: event.payload.artisanId,
          estimatedCompletionDate: event.payload.estimatedCompletionDate,
        },
      });
      console.log(
        `✅ Order accepted notification sent to client: ${event.payload.clientId}`,
      );
    } catch (error) {
      console.error("Error handling OrderAccepted event:", error);
    }
  }

  private async handleOrderRejected(event: any): Promise<void> {
    try {
      await this.notificationService.createNotification({
        userId: event.payload.clientId,
        type: "ORDER_REJECTED",
        title: "Order Not Accepted",
        message: `Unfortunately, the artisan could not accept your order. Reason: ${event.payload.rejectionReason}.${
          event.payload.rejectionNote
            ? ` Note: ${event.payload.rejectionNote}`
            : ""
        } Your funds have been refunded.`,
        data: {
          orderId: event.payload.orderId,
          artisanId: event.payload.artisanId,
          rejectionReason: event.payload.rejectionReason,
          rejectionNote: event.payload.rejectionNote,
        },
      });

      await this.notificationService.createNotification({
        userId: event.payload.artisanId,
        type: "ORDER_REJECTED",
        title: "Order Rejected",
        message: `You have rejected the order from client ${event.payload.clientId}. Reason: ${event.payload.rejectionReason}.${
          event.payload.rejectionNote
            ? ` Note: ${event.payload.rejectionNote}`
            : ""
        }`,
        data: {
          orderId: event.payload.orderId,
          clientId: event.payload.clientId,
          rejectionReason: event.payload.rejectionReason,
          rejectionNote: event.payload.rejectionNote,
        },
      });

      console.log(
        `✅ Order rejected notification sent to client: ${event.payload.clientId} and artisan: ${event.payload.artisanId} for order: ${event.payload.orderId}`,
      );
    } catch (error) {
      console.error("Error handling OrderRejected event:", error);
    }
  }

  private async handleWorkStarted(event: any): Promise<void> {
    try {
      await this.notificationService.createNotification({
        userId: event.payload.clientId,
        type: "WORK_STARTED",
        title: "Work Started",
        message: `The work on your order has started.`,
        data: {
          orderId: event.payload.orderId,
          artisanId: event.payload.artisanId,
          deviceType: event.payload.deviceType,
          deviceBrand: event.payload.deviceBrand,
          deviceModel: event.payload.deviceModel,
          serviceRequired: event.payload.serviceRequired,
        },
      });
      console.log(
        `✅ Work started notification sent to client: ${event.payload.clientId}`,
      );
    } catch (error) {
      console.error("Error handling WorkStarted event:", error);
    }
  }
  private async handleWorkCompleted(event: any): Promise<void> {
    try {
      await this.notificationService.createNotification({
        userId: event.payload.clientId,
        type: "WORK_COMPLETED",
        title: "Work Completed",
        message: `The work on your order has been completed.`,
        data: {
          orderId: event.payload.orderId,
          artisanId: event.payload.artisanId,
          deviceType: event.payload.deviceType,
          deviceBrand: event.payload.deviceBrand,
          deviceModel: event.payload.deviceModel,
          serviceRequired: event.payload.serviceRequired,
        },
      });
      console.log(
        `✅ Work completed notification sent to client: ${event.payload.clientId}`,
      );
    } catch (error) {
      console.error("Error handling WorkCompleted event:", error);
    }
  }
  private async handlePaymentRelease(event: any): Promise<void> {
    try {
      const {
        orderId,
        artisanId,
        clientId,
        amount,
        deviceType,
        deviceBrand,
        deviceModel,
        serviceRequired,
      } = event.payload;

      await this.notificationService.createNotification({
        userId: event.payload.clientId,
        type: "PAYMENT_RELEASED",
        title: "Payment Released",
        message: `₦${amount} has been released to your wallet for order ${orderId}.`,
        data: {
          orderId,
          artisanId: event,
          amount,
          deviceType,
          deviceBrand,
          deviceModel,
          serviceRequired,
        },
      });

      await this.notificationService.createNotification({
        userId: clientId,
        type: "PAYMENT_RELEASED",
        title: "Payment Released",
        message: `Your payment of ₦${amount} has been released to the artisan for order ${orderId}.`,
        data: {
          orderId,
          artisanId,
          amount,
          deviceType,
          deviceBrand,
          deviceModel,
          serviceRequired,
        },
      });
      console.log(
        `✅ Payment released notification sent to client: ${event.payload.clientId} and artisan: ${event.payload.artisanId} for order: ${event.payload.orderId}`,
      );
    } catch (error) {
      console.error("Error handling PaymentRelease event:", error);
    }
  }
  private async handleOrderCancelled(event: any): Promise<void> {
    try {
      // Notify artisan that client cancelled
      await this.notificationService.createNotification({
        userId: event.payload.artisanId,
        type: "ORDER_CANCELLED", // reuse existing type or add ORDER_CANCELLED
        title: "Order Cancelled",
        message: "The client has cancelled their order.",
        data: {
          orderId: event.payload.orderId,
          clientId: event.payload.clientId,
          cancelledAt: event.payload.cancelledAt,
          deviceType: event.payload.deviceType,
          deviceBrand: event.payload.deviceBrand,
          deviceModel: event.payload.deviceModel,
          serviceRequired: event.payload.serviceRequired,
        },
      });

      // Notify client that cancellation + refund is processing
      await this.notificationService.createNotification({
        userId: event.payload.clientId,
        type: "ORDER_CANCELLED",
        title: "Order Cancelled",
        message:
          "Your order has been cancelled and your funds will be refunded.",
        data: {
          orderId: event.payload.orderId,
          cancelledAt: event.payload.cancelledAt,
          deviceType: event.payload.deviceType,
          deviceBrand: event.payload.deviceBrand,
          deviceModel: event.payload.deviceModel,
          serviceRequired: event.payload.serviceRequired,
        },
      });
      console.log(
        `✅ Order cancelled notifications sent for order: ${
          event.payload.orderId
        } to artisan: ${event.payload.artisanId} and client: ${event.payload.clientId}`,
      );
    } catch (error) {
      console.error("Error handling OrderCancelled event:", error);
    }
  }
  private async handleWalletWithdrawal2(event: any): Promise<void> {
    try {
      const { userId, amount, accountNumber } = event.payload;

      await this.notificationService.createNotification({
        userId,
        type: "WALLET_WITHDRAWAL",
        title: "Withdrawal Processed",
        // message: `₦${amount} has been withdrawn from your wallet.`,
        message: `₦${amount} has been requested for withdrawal from your wallet.`,
        data: {
          userId,
          amount,
          accountNumber,
        },
      });
      console.log(
        `✅ Wallet withdrawal notification sent to user: ${event.payload.userId}`,
      );
    } catch (error) {
      console.error("Error handling WalletWithdrawal event:", error);
    }
  }
  private async handleWalletWithdrawal(event: any): Promise<void> {
    try {
      const { userId, amount, accountNumber, status } = event.payload;
      const isSuccess = status === "SUCCESS";

      await this.notificationService.createNotification({
        userId,
        type: isSuccess ? "PAYMENT_RELEASED" : "PAYMENT_PROCESSED",
        title: isSuccess ? "Withdrawal Successful" : "Withdrawal Failed",
        message: isSuccess
          ? `₦${amount.toLocaleString()} has been successfully sent to your account ending in ${accountNumber.slice(-4)}.`
          : `Your withdrawal of ₦${amount.toLocaleString()} failed. Your funds have been refunded to your wallet.`,
        data: {
          amount,
          accountNumber: accountNumber.slice(-4),
          status,
        },
      });

      console.log(`✅ Withdrawal notification sent to user: ${userId}`);
    } catch (error) {
      console.error("Error handling WalletWithdrawal event:", error);
    }
  }
  private async handleWalletTopUpFailed(event: any): Promise<void> {
    try {
      const { userId, amount, reason } = event.payload;

      await this.notificationService.createNotification({
        userId,
        type: "PAYMENT_PROCESSED",
        title: "Wallet Top-Up Failed",
        message: `Your wallet top-up of ₦${amount.toLocaleString()} failed. Reason: ${reason}. Please try again.`,
        data: { amount, reason },
      });

      console.log(`✅ Failed top-up notification sent to user: ${userId}`);
    } catch (error) {
      console.error("Error handling WalletTopUpFailed event:", error);
    }
  }
}
