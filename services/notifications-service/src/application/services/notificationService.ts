import { RedisEventBus } from "@fixserv-colauncha/shared";
import { INotificationRepository } from "../../domain/repository/notificationRepository";
import { NotificationDomainService } from "./notificationDomainService";
import { CreateNotificationDto } from "../dtos/createNotificationDto";
import { NotificationType } from "../../domain/value-objects/notificationTypes";
import { NotificationCreatedEvent } from "../../events/notificationCreatedEvent";
import { NotificationResponseDto } from "../dtos/notificationResponseDto";
import { NotificationId } from "../../domain/value-objects/notificationId";
import { NotificationReadEvent } from "../../events/notificationReadEvent";

export class NotificationService {
  constructor(
    private notificationRepository: INotificationRepository,
    private domainService: NotificationDomainService,
    private eventBus: RedisEventBus
  ) {}

  async createNotification(dto: CreateNotificationDto): Promise<void> {
    const notification = this.domainService.createNotification(
      dto.userId,
      new NotificationType(dto.type),
      dto.title,
      dto.message,
      dto.data || {}
    );

    await this.notificationRepository.save(notification);

    // Publish domain event
    const event = new NotificationCreatedEvent({
      notificationId: notification.id.value,
      userId: notification.userId,
      type: notification.type.value,
      title: notification.title,
      message: notification.message,
      data: notification.data,
    });

    await this.eventBus.publish("notification_events", event);
  }

  async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.findByUserId(
      userId,
      limit,
      offset
    );

    return notifications.map((notification) => notification.toJSON());
  }

  async getUnreadNotifications(
    userId: string
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.findUnreadByUserId(
      userId
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
    }
  ): Promise<void> {
    console.log("markAsRead called with:", { notificationId, userId }); // Debug log

    try {
      const notificationIdObj = new NotificationId(notificationId);
      console.log("Created NotificationId object:", notificationIdObj.value); // Debug log

      const notification = await this.notificationRepository.findById(
        notificationIdObj
      );
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

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const unreadNotifications =
      await this.notificationRepository.findUnreadByUserId(userId);
    return unreadNotifications.length;
  }

  async deleteNotification(
    notificationId: string,
    userId: string
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

    await this.notificationRepository.delete(
      new NotificationId(notificationId)
    );
  }
}
