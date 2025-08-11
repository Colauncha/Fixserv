import { BaseEvent } from "@fixserv-colauncha/shared";

export class NotificationCreatedEvent extends BaseEvent {
  eventName = "NotificationCreatedEvent";
  version = 1;

  constructor(
    public payload: {
      notificationId: string;
      userId: string;
      type: string;
      title: string;
      message: string;
      data: Record<string, any>;
    }
  ) {
    super(payload);
  }
}
