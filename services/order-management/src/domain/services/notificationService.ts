// src/infrastructure/services/notification-service.ts
/*
export class MockNotificationService implements INotificationService {
  private sentNotifications: Notification[] = [];

  async notifyArtisanNewOrder(
    artisanId: string,
    orderId: string
  ): Promise<void> {
    const notification = {
      type: "ARTISAN_NEW_ORDER",
      recipientId: artisanId,
      orderId,
      message: `You have a new order #${orderId}`,
      sentAt: new Date(),
    };
    this.sentNotifications.push(notification);
    console.log(
      `Notification sent to artisan ${artisanId}: ${notification.message}`
    );
  }

  async notifyClientOrderAccepted(
    clientId: string,
    orderId: string
  ): Promise<void> {
    const notification = {
      type: "CLIENT_ORDER_ACCEPTED",
      recipientId: clientId,
      orderId,
      message: `Your order #${orderId} has been accepted`,
      sentAt: new Date(),
    };
    this.sentNotifications.push(notification);
    console.log(
      `Notification sent to client ${clientId}: ${notification.message}`
    );
  }

  async notifyPaymentReleased(
    artisanId: string,
    orderId: string,
    amount: number
  ): Promise<void> {
    const notification = {
      type: "PAYMENT_RELEASED",
      recipientId: artisanId,
      orderId,
      message: `Payment of $${amount} for order #${orderId} has been released to you`,
      sentAt: new Date(),
    };
    this.sentNotifications.push(notification);
    console.log(`Payment notification sent to artisan ${artisanId}`);
  }

  async notifyDisputeOpened(orderId: string, disputeId: string): Promise<void> {
    console.log(`Dispute alert for order ${orderId}. Dispute ID: ${disputeId}`);
  }

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return this.sentNotifications.filter((n) => n.recipientId === userId);
  }
}

interface Notification {
  type: string;
  recipientId: string;
  orderId: string;
  message: string;
  sentAt: Date;
}
*/
