import { INotificationRepository } from "../../domain/repository/notificationRepository";
import { NotificationId } from "../../domain/value-objects/notificationId";
import { RedisEventBus } from "@fixserv-colauncha/shared";

import { NotificationReadEvent } from "../../events/notificationReadEvent";

export class MarkAsReadUseCase {
  constructor(
    private notificationRepository: INotificationRepository,
    private eventBus: RedisEventBus
  ) {}

  async execute(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(
      new NotificationId(notificationId)
    );

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new Error("Unauthorized access to notification");
    }

    notification.markAsRead();
    await this.notificationRepository.update(notification);

    // Publish domain event
    const event = new NotificationReadEvent({
      notificationId: notification.id.value,
      userId: notification.userId,
      readAt: notification.readAt!.toISOString(),
    });

    await this.eventBus.publish("notification_events", event);
  }
}
