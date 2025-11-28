import { BaseEvent } from "@fixserv-colauncha/shared";

export class UserCreatedEvent extends BaseEvent {
  eventName = "UserCreatedEvent";
  version = 1;

  constructor(
    public payload: {
      userId: string;
      email: string;
      fullName: string;
      role: "CLIENT" | "ARTISAN" | "ADMIN";
      referralCode?: string;
      // Optional additional data based on role
      additionalData?: {
        businessName?: string;
        skills?: string[];
        location?: string;
        servicePreferences?: string[];
        permissions?: string[];
        profileIncomplete?: boolean;
      };
    }
  ) {
    super(payload);
  }
}
