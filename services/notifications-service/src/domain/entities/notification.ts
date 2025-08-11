import { NotificationId } from "../value-objects/notificationId";
import { NotificationType } from "../value-objects/notificationTypes";
import { NotificationStatus } from "../value-objects/notificationStatus";

export class Notification {
  constructor(
    private _id: NotificationId,
    private _userId: string,
    private _type: NotificationType,
    private _title: string,
    private _message: string,
    private _data: Record<string, any> = {},
    private _status: NotificationStatus = NotificationStatus.UNREAD,
    private _createdAt: Date = new Date(),
    private _readAt?: Date
  ) {}

  get id(): NotificationId {
    return this._id;
  }
  get userId(): string {
    return this._userId;
  }
  get type(): NotificationType {
    return this._type;
  }
  get title(): string {
    return this._title;
  }
  get message(): string {
    return this._message;
  }
  get data(): Record<string, any> {
    return this._data;
  }
  get status(): NotificationStatus {
    return this._status;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get readAt(): Date | undefined {
    return this._readAt;
  }

  markAsRead(): void {
    console.log("markAsRead called - current status:", this._status.value);

    if (this._status === NotificationStatus.READ) {
      throw new Error("Notification is already read");
    }
    this._status = NotificationStatus.READ;
    this._readAt = new Date();
    console.log("After markAsRead - new status:", this._status.value);
    console.log("After markAsRead - new readAt:", this._readAt);
  }

  isRead(): boolean {
    console.log("isRead check - current status:", this._status.value);
    return this._status === NotificationStatus.READ;
  }

  toJSON() {
    return {
      id: this._id.value,
      userId: this._userId,
      type: this._type.value,
      title: this._title,
      message: this._message,
      data: this._data,
      status: this._status.value,
      createdAt: this._createdAt.toISOString(),
      readAt: this._readAt?.toISOString(),
    };
  }
}
