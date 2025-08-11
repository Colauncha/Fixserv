import { INotificationRepository } from "../../domain/repository/notificationRepository";

import { NotificationType } from "../../domain/value-objects/notificationTypes";
import { CreateNotificationDto } from "../dtos/createNotificationDto";
import { RedisEventBus } from "@fixserv-colauncha/shared";
import { NotificationCreatedEvent } from "../../events/notificationCreatedEvent";
import { NotificationDomainService } from "../services/notificationDomainService";

export class CreateNotificationUseCase {
  constructor(
    private notificationRepository: INotificationRepository,
    private domainService: NotificationDomainService,
    private eventBus: RedisEventBus
  ) {}

  async execute(dto: CreateNotificationDto): Promise<void> {
    const notification = this.domainService.createNotification(
      dto.userId,
      new NotificationType(dto.type),
      dto.title,
      dto.message,
      dto.data
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
}
