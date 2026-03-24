import { RedisEventBus } from "@fixserv-colauncha/shared";
import { INotificationRepository } from "../../domain/repository/notificationRepository";
import { NotificationDomainService } from "./notificationDomainService";
import { CreateNotificationDto } from "../dtos/createNotificationDto";
import { NotificationType } from "../../domain/value-objects/notificationTypes";
import { NotificationCreatedEvent } from "../../events/notificationCreatedEvent";
import { NotificationResponseDto } from "../dtos/notificationResponseDto";
import { NotificationId } from "../../domain/value-objects/notificationId";
import { NotificationReadEvent } from "../../events/notificationReadEvent";
import {
  NotificationModel,
  NotificationDismissedModel,
  NotificationReadTrackingModel,
} from "../../infrastructure/persistence/models/notificationModel";

export class NotificationService {
  constructor(
    private notificationRepository: INotificationRepository,
    private domainService: NotificationDomainService,
    private eventBus: RedisEventBus,
  ) {}

  async createNotification(dto: CreateNotificationDto): Promise<void> {
    const notification = this.domainService.createNotification(
      dto.userId || "broadcast",
      new NotificationType(dto.type),
      dto.title,
      dto.message,
      dto.data || {},
    );

    // await this.notificationRepository.save(notification);

    // Save with targetRole if it's a broadcast
    await this.notificationRepository.saveWithRole(
      notification,
      dto.targetRole,
    );

    // Publish domain event
    /*
    const event = new NotificationCreatedEvent({
      notificationId: notification.id.value,
      userId: notification.userId,
      type: notification.type.value,
      title: notification.title,
      message: notification.message,
      data: notification.data,
    });
    */
    const event = new NotificationCreatedEvent({
      notificationId: notification.id.value,
      userId: dto.userId || "broadcast",
      targetRole: dto.targetRole,
      type: notification.type.value,
      title: notification.title,
      message: notification.message,
      data: notification.data,
    });

    await this.eventBus.publish("notification_events", event);
  }

  async getUserNotifications(
    userId: string,
    userRole: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.findByUserId(
      userId,
      userRole,
      limit,
      offset,
    );

    return notifications.map((notification) => notification.toJSON());
  }

  async getUnreadNotifications(
    userId: string,
    userRole: string,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.findUnreadByUserId(
      userId,
      userRole,
    );
    return notifications.map((notification) => notification.toJSON());
  }

  /*
  async markAsRead(
    notificationId: string,
    userId: string,
    metadata?: {
      readFrom?: string;
      userAgent?: string;
      ipAddress?: string;
    }
  ): Promise<void> {
    const notification = await this.notificationRepository.findById(
      new NotificationId(notificationId)
    );

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new Error("Unauthorized access to notification");
    }

    if (notification.isRead()) {
      throw new Error("Notification is already read");
    }

    notification.markAsRead();
    await this.notificationRepository.update(notification);

    // Publish domain event
    const event = new NotificationReadEvent({
      notificationId: notification.id.value,
      userId: notification.userId,
      readAt: notification.readAt!.toISOString(),
      metadata,
    });

    await this.eventBus.publish("notification_events", event);
  }
    */
  async markAsRead(
    notificationId: string,
    userId: string,
    metadata?: {
      readFrom?: string;
      userAgent?: string;
      ipAddress?: string;
    },
  ): Promise<void> {
    console.log("markAsRead called with:", { notificationId, userId }); // Debug log

    try {
      const notificationIdObj = new NotificationId(notificationId);
      console.log("Created NotificationId object:", notificationIdObj.value); // Debug log

      const notification =
        await this.notificationRepository.findById(notificationIdObj);
      console.log("Found notification:", notification ? "Yes" : "No"); // Debug log

      if (!notification) {
        throw new Error("Notification not found");
      }

      if (notification.userId !== userId) {
        throw new Error("Unauthorized access to notification");
      }

      if (notification.isRead()) {
        throw new Error("Notification is already read");
      }

      notification.markAsRead();
      await this.notificationRepository.update(notification);

      // Publish domain event
      const event = new NotificationReadEvent({
        notificationId: notification.id.value,
        userId: notification.userId,
        readAt: notification.readAt!.toISOString(),
        metadata,
      });

      await this.eventBus.publish("notification_events", event);
    } catch (error) {
      console.error("Error in markAsRead:", error);
      throw error;
    }
  }

  /*
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }
    */
  async markAllAsRead(userId: string, userRole: string): Promise<void> {
    const now = new Date();

    // Mark personal notifications as read
    await NotificationModel.updateMany(
      { userId, status: "unread" },
      { $set: { status: "read", readAt: now } },
    );

    // Find all unread broadcast notifications for this role
    const dismissed = await NotificationDismissedModel.find({ userId })
      .select("notificationId")
      .lean();
    const dismissedIds = dismissed.map((d) => d.notificationId);

    const alreadyRead = await NotificationReadTrackingModel.find({ userId })
      .select("notificationId")
      .lean();
    const alreadyReadIds = alreadyRead.map((r) => r.notificationId);

    const unreadBroadcasts = await NotificationModel.find({
      _id: { $nin: [...dismissedIds, ...alreadyReadIds] },
      $or: [{ targetRole: userRole }, { targetRole: "ALL" }],
    })
      .select("_id")
      .lean();

    // Bulk insert read tracking records
    if (unreadBroadcasts.length > 0) {
      const trackingDocs = unreadBroadcasts.map((n) => ({
        notificationId: n._id.toString(),
        userId,
        readAt: now,
      }));

      await NotificationReadTrackingModel.insertMany(trackingDocs, {
        ordered: false, // continue even if some already exist
      }).catch(() => {}); // ignore duplicate key errors
    }
  }

  async getUnreadCount(userId: string, userRole: string): Promise<number> {
    // const unreadNotifications =
    // await this.notificationRepository.findUnreadByUserId(userId);
    // return unreadNotifications.length;
    return this.notificationRepository.countUnreadByUserId(userId, userRole);
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    const notification = await this.notificationRepository.findById(
      new NotificationId(notificationId),
    );

    if (!notification) {
      throw new Error("Notification not found");
    }

    /*
    if (notification.userId !== userId) {
      throw new Error("Unauthorized access to notification");
    }

    await this.notificationRepository.delete(
      new NotificationId(notificationId),
    );
    */
    // For personal notifications, verify ownership
    const doc = await NotificationModel.findById(notificationId).lean();
    if (!doc?.targetRole && notification.userId !== userId) {
      throw new Error("Unauthorized access to notification");
    }

    // Pass userId so repository knows who is dismissing
    await this.notificationRepository.delete(
      new NotificationId(notificationId),
      userId,
    );
  }
}
