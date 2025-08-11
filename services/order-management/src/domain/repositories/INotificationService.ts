// src/domain/interfaces/INotificationService.ts
export interface NotificationPayload {
  recipientId: string;
  orderId: string;
  additionalData?: Record<string, any>;
}

export interface INotificationService {
  /**
   * Notifies artisan about a new order
   * @param artisanId ID of the artisan
   * @param orderId ID of the new order
   */
  notifyArtisanNewOrder(artisanId: string, orderId: string): Promise<void>;

  /**
   * Notifies client that their order was accepted
   * @param clientId ID of the client
   * @param orderId ID of the order
   */
  notifyClientOrderAccepted(clientId: string, orderId: string): Promise<void>;

  /**
   * Notifies client about escrow creation
   * @param clientId ID of the client
   * @param orderId ID of the order
   * @param amount Amount held in escrow
   */
  notifyClientEscrowCreated(
    clientId: string,
    orderId: string,
    amount: number
  ): Promise<void>;

  /**
   * Notifies artisan about payment release
   * @param artisanId ID of the artisan
   * @param orderId ID of the order
   * @param amount Amount released
   */
  notifyPaymentReleased(
    artisanId: string,
    orderId: string,
    amount: number
  ): Promise<void>;

  /**
   * Notifies about dispute initiation
   * @param orderId ID of the disputed order
   * @param disputeId ID of the dispute case
   * @param raisedBy Who initiated the dispute ('CLIENT' or 'ARTISAN')
   * @param userId ID of the user who raised the dispute
   */
  notifyDisputeOpened(
    orderId: string,
    disputeId: string,
    raisedBy: "CLIENT" | "ARTISAN",
    userId: string
  ): Promise<void>;

  /**
   * Notifies about dispute resolution
   * @param orderId ID of the order
   * @param resolution Resolution outcome ('RELEASED' or 'REFUNDED')
   * @param resolutionNotes Explanation of resolution
   */
  notifyDisputeResolved(
    orderId: string,
    resolution: "RELEASED" | "REFUNDED",
    resolutionNotes: string
  ): Promise<void>;

  /**
   * Sends a generic notification
   * @param payload Notification details
   */
  sendNotification(payload: NotificationPayload): Promise<void>;

  /**
   * Gets notifications for a specific user
   * @param userId ID of the user
   * @param limit Maximum number of notifications to return
   */
  getNotifications(
    userId: string,
    limit?: number
  ): Promise<NotificationPayload[]>;
}
