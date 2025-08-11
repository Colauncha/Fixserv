import { Notification } from "../../domain/entities/notification";
import { NotificationPreference } from "../../domain/entities/notificationPreferences";
import { NotificationId } from "../../domain/value-objects/notificationId";
import { NotificationType } from "../../domain/value-objects/notificationTypes";

export class NotificationDomainService {
  createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, any> = {}
  ): Notification {
    return new Notification(
      new NotificationId(),
      userId,
      type,
      title,
      message,
      data
    );
  }

  shouldSendNotification(
    preferences: NotificationPreference | null,
    type: NotificationType
  ): {
    email: boolean;
    push: boolean;
    sms: boolean;
  } {
    if (!preferences) {
      return { email: true, push: true, sms: false };
    }

    const categoryEnabled = preferences.isCategoryEnabled(type.value);

    return {
      email: preferences.emailEnabled && categoryEnabled,
      push: preferences.pushEnabled && categoryEnabled,
      sms: preferences.smsEnabled && categoryEnabled,
    };
  }
}
