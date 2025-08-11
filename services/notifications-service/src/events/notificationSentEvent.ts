import { BaseEvent } from "@fixserv-colauncha/shared";

export class NotificationSentEvent extends BaseEvent {
  eventName = "NotificationSentEvent";
  version = 1;

  constructor(
    public payload: {
      notificationId: string;
      userId: string;
      channels: {
        email?: {
          sent: boolean;
          sentAt?: string;
          error?: string;
          messageId?: string;
        };
        push?: {
          sent: boolean;
          sentAt?: string;
          error?: string;
          deviceTokens?: string[];
        };
        sms?: {
          sent: boolean;
          sentAt?: string;
          error?: string;
          phoneNumber?: string;
        };
      };
      totalChannels: number;
      successfulChannels: number;
      failedChannels: number;
    }
  ) {
    super(payload);
  }
}
