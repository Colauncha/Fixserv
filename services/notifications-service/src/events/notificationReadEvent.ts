import { BaseEvent } from "@fixserv-colauncha/shared";

export class NotificationReadEvent extends BaseEvent {
  eventName = "NotificationReadEvent";
  version = 1;

  constructor(
    public payload: {
      notificationId: string;
      userId: string;
      readAt: string;
      metadata?: {
        readFrom?: string; // web, mobile, email
        userAgent?: string;
        ipAddress?: string;
      };
    }
  ) {
    super(payload);
  }
}
