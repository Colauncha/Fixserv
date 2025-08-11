import { Notification } from "../entities/notification";
import { NotificationPreference } from "../entities/notificationPreferences";
import { NotificationId } from "../value-objects/notificationId";

export interface INotificationRepository {
  save(notification: Notification): Promise<void>;
  findById(id: NotificationId): Promise<Notification | null>;
  findByUserId(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<Notification[]>;
  findUnreadByUserId(userId: string): Promise<Notification[]>;
  update(notification: Notification): Promise<void>;
  delete(id: NotificationId): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;

  // Preferences
  savePreferences(preferences: NotificationPreference): Promise<void>;
  findPreferencesByUserId(
    userId: string
  ): Promise<NotificationPreference | null>;
}
