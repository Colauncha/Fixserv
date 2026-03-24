import { Notification } from "../entities/notification";
import { NotificationPreference } from "../entities/notificationPreferences";
import { NotificationId } from "../value-objects/notificationId";

export interface INotificationRepository {
  save(notification: Notification): Promise<void>;
  findById(id: NotificationId): Promise<Notification | null>;
  findByUserId(
    userId: string,
    userRole: string,
    limit?: number,
    offset?: number,
  ): Promise<Notification[]>;
  findUnreadByUserId(userId: string, userRole: string): Promise<Notification[]>;
  update(notification: Notification): Promise<void>;
  delete(id: NotificationId, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  saveWithRole(notification: Notification, targetRole?: string): Promise<void>;

  countUnreadByUserId(userId: string, userRole: string): Promise<number>;

  // Preferences
  savePreferences(preferences: NotificationPreference): Promise<void>;
  findPreferencesByUserId(
    userId: string,
  ): Promise<NotificationPreference | null>;
}
