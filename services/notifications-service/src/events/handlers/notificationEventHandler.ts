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
          case "CertificateApprovedEvent":
            await this.handleCertificateApproved(evt);
            break;
          case "CertificateRejectedEvent":
            await this.handleCertificateRejected(evt);
            break;
          case "AccountSuspendedEvent":
            await this.handleAccountSuspended(evt);
            break;
          case "AccountUnsuspendedEvent":
            await this.handleAccountUnsuspended(evt);
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
          case "DisputeResolved":
            await this.handleDisputeResolved(evt);
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

    const fixpointsEventsSub = await this.eventBus.subscribe(
      "fixpoints_events",
      async (evt: any) => {
        switch (evt.eventName) {
          case "FixpointsAwarded":
            await this.handleFixpointsAwarded(evt);
            break;
          default:
            console.log(
              "Notification: Unknown fixpoints event:",
              evt.eventName,
            );
        }
      },
    );
    this.subscriptions.push(fixpointsEventsSub);
    console.log("Notification-Service: Subscribed to fixpoints_events");
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

  private async handleReviewCreated1(event: any): Promise<void> {
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

  private async handleReviewCreated(event: any): Promise<void> {
    try {
      const { artisanId, clientId, artisanRating, comment, hasComment } =
        event.payload;

      // Notify artisan of the incoming review
      await this.notificationService.createNotification({
        userId: artisanId,
        type: "REVIEW_CREATED",
        title: "New Review Received ⭐",
        message:
          hasComment && comment
            ? `A client rated you ${artisanRating}/5 and left a comment: "${comment.slice(0, 80)}${comment.length > 80 ? "..." : ""}"`
            : `A client rated you ${artisanRating}/5 on a completed order.`,
        data: {
          reviewId: event.payload.reviewId,
          clientId,
          artisanRating,
          serviceRating: event.payload.serviceRating,
          hasComment,
        },
      });

      console.log(`✅ Review notification sent to artisan ${artisanId}`);
    } catch (error) {
      console.error("Error handling ReviewCreated event:", error);
    }
  }

  private async handleReviewPublished1(event: any): Promise<void> {
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

  private async handleReviewPublished(event: any): Promise<void> {
    try {
      const { artisanId, artisanRating, hasComment, comment } = event.payload;

      await this.notificationService.createNotification({
        userId: artisanId,
        type: "REVIEW_PUBLISHED",
        title: "Review Published 📢",
        message:
          hasComment && comment
            ? `A review with a ${artisanRating}/5 rating and comment is now live on your profile.`
            : `A ${artisanRating}/5 rating is now live on your profile.`,
        data: {
          reviewId: event.payload.reviewId,
          clientId: event.payload.clientId,
          artisanRating,
          hasComment,
        },
      });

      console.log(
        `✅ Review published notification sent to artisan ${artisanId}`,
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
        userId: artisanId,
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

  private async handleDisputeResolved(event: any): Promise<void> {
    try {
      const { orderId, clientId, artisanId, resolution, note } = event.payload;

      const clientMessage =
        resolution === "REFUND_CLIENT"
          ? `Your dispute for order ${orderId} has been resolved. Your funds have been refunded to your wallet.`
          : `Your dispute for order ${orderId} has been resolved. Payment has been released to the artisan.`;

      const artisanMessage =
        resolution === "RELEASE_TO_ARTISAN"
          ? `The dispute for order ${orderId} has been resolved in your favour. Payment has been released to your wallet.`
          : `The dispute for order ${orderId} has been resolved. Funds have been refunded to the client.`;

      await Promise.all([
        this.notificationService.createNotification({
          userId: clientId,
          type: "ORDER_ACCEPTED",
          title: "Dispute Resolved",
          message: clientMessage,
          data: { orderId, resolution, note },
        }),
        this.notificationService.createNotification({
          userId: artisanId,
          type: "ORDER_ACCEPTED",
          title: "Dispute Resolved",
          message: artisanMessage,
          data: { orderId, resolution, note },
        }),
      ]);

      console.log(
        `✅ Dispute resolution notifications sent for order: ${orderId}`,
      );
    } catch (error) {
      console.error("Error handling DisputeResolved event:", error);
    }
  }

  private async handleFixpointsAwarded(event: any): Promise<void> {
    try {
      const { userId, points, reason, title, message, totalPoints, metadata } =
        event.payload;

      // Map reason to a specific notification type and message
      const notificationConfig = this.getFixpointsNotificationConfig(
        reason,
        points,
        totalPoints,
        metadata,
      );

      await this.notificationService.createNotification({
        userId,
        type: "FIXPOINTS_AWARDED",
        title: notificationConfig.title,
        message: notificationConfig.message,
        data: {
          points,
          reason,
          totalPoints,
          ...metadata,
        },
      });

      console.log(
        `✅ Fixpoints notification sent to user ${userId} [${reason}]: +${points}pts`,
      );
    } catch (error) {
      console.error("Error handling FixpointsAwarded event:", error);
    }
  }

  private getFixpointsNotificationConfig(
    reason: string,
    points: number,
    totalPoints: number,
    metadata?: Record<string, any>,
  ): { title: string; message: string } {
    const remaining = Math.max(0, 1000 - totalPoints);
    const progressNote =
      totalPoints >= 1000
        ? "You can now redeem your Fixpoints for cash!"
        : `You need ${remaining} more points to redeem.`;

    const configs: Record<string, { title: string; message: string }> = {
      SIGNUP_BONUS: {
        title: "Welcome Bonus! 🎉",
        message: `You've earned ${points} Fixpoints for joining Fixserv! ${progressNote}`,
      },
      VERIFICATION_BONUS: {
        title: "Verification Bonus! ✅",
        message: `Your account is verified! You've earned ${points} Fixpoints. ${progressNote}`,
      },
      PROFILE_COMPLETION_BONUS: {
        title: "Profile Complete! 🙌",
        message: `Your profile is looking great! You've earned ${points} Fixpoints for completing it. ${progressNote}`,
      },
      FIRST_BOOKING_BONUS: {
        title: "First Booking Bonus! 🛠️",
        message: `You've earned ${points} Fixpoints for confirming your first repair booking! ${progressNote}`,
      },
      FIRST_FEEDBACK_BONUS: {
        title: "Feedback Bonus! ⭐",
        message: `Thanks for your review! You've earned ${points} Fixpoints for your first feedback. ${progressNote}`,
      },
      REFERRAL_REWARD: {
        title: "Referral Bonus! 🎁",
        message: `Someone signed up with your referral code! You've earned ${points} Fixpoints. ${progressNote}`,
      },
    };

    return (
      configs[reason] ?? {
        title: "Fixpoints Earned!",
        message: `You've earned ${points} Fixpoints. Total: ${totalPoints}pts. ${progressNote}`,
      }
    );
  }

  private async handleCertificateApproved(event: any): Promise<void> {
    try {
      const { userId, certificateName, approvedAt } = event.payload;

      await this.notificationService.createNotification({
        userId,
        type: "CERTIFICATE_APPROVED",
        title: "Certificate Approved! ✅",
        message: `Great news! Your certificate "${certificateName}" has been approved. You are now a verified artisan on Fixserv.`,
        data: {
          certificateName,
          approvedAt,
          isNowVerified: true,
        },
      });

      console.log(
        `✅ Certificate approval notification sent to artisan ${userId}`,
      );
    } catch (error) {
      console.error("Error handling CertificateApproved event:", error);
    }
  }

  private async handleCertificateRejected(event: any): Promise<void> {
    try {
      const { userId, certificateName, rejectionReason, rejectedAt } =
        event.payload;

      await this.notificationService.createNotification({
        userId,
        type: "CERTIFICATE_REJECTED",
        title: "Certificate Not Approved ❌",
        message: `Your certificate "${certificateName}" was not approved. Reason: ${rejectionReason}. You can upload a new certificate and resubmit.`,
        data: {
          certificateName,
          rejectionReason,
          rejectedAt,
          canResubmit: true,
        },
      });

      console.log(
        `✅ Certificate rejection notification sent to artisan ${userId}`,
      );
    } catch (error) {
      console.error("Error handling CertificateRejected event:", error);
    }
  }

  private async handleAccountSuspended(event: any): Promise<void> {
    try {
      const { userId, reason, suspendedUntil, suspendedBy } = event.payload;

      const untilText = suspendedUntil
        ? `until ${new Date(suspendedUntil).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}`
        : "until further notice";

      await this.notificationService.createNotification({
        userId,
        type: "ACCOUNT_SUSPENDED",
        title: "Account Suspended",
        message: `Your Fixserv account has been suspended ${untilText}. Reason: ${reason}. If you believe this is a mistake, please contact support.`,
        data: {
          reason,
          suspendedUntil,
          suspendedBy,
          supportEmail: process.env.SUPPORT_EMAIL ?? "support@fixserv.com",
        },
      });

      console.log(`✅ Suspension notification sent to user ${userId}`);
    } catch (error) {
      console.error("Error handling AccountSuspended event:", error);
    }
  }

  private async handleAccountUnsuspended(event: any): Promise<void> {
    try {
      const { userId } = event.payload;

      await this.notificationService.createNotification({
        userId,
        type: "ACCOUNT_UNSUSPENDED",
        title: "Account Reinstated ✅",
        message:
          "Your Fixserv account has been reinstated. You can now access all features again. Welcome back!",
        data: {
          reinstatedAt: new Date(),
        },
      });

      console.log(`✅ Reinstatement notification sent to user ${userId}`);
    } catch (error) {
      console.error("Error handling AccountUnsuspended event:", error);
    }
  }
}
