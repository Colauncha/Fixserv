import { INotificationRepository } from "../../domain/repository/notificationRepository";
import { NotificationResponseDto } from "../dtos/notificationResponseDto";

export class GetUserNotificationsUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(
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
}
