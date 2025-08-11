export class NotificationType {
  private static readonly VALID_TYPES = [
    "USER_CREATED",
    "REVIEW_CREATED",
    "REVIEW_PUBLISHED",
    "BOOKING_CONFIRMED",
    "BOOKING_CANCELLED",
    "PAYMENT_PROCESSED",
    "SERVICE_CREATED",
    "WALLET_TOPUP",
    "SYSTEM_ALERT",
  ] as const;

  constructor(private _value: string) {
    if (!NotificationType.VALID_TYPES.includes(_value as any)) {
      throw new Error(`Invalid notification type: ${_value}`);
    }
  }

  get value(): string {
    return this._value;
  }

  static USER_CREATED = new NotificationType("USER_CREATED");
  static REVIEW_CREATED = new NotificationType("REVIEW_CREATED");
  static REVIEW_PUBLISHED = new NotificationType("REVIEW_PUBLISHED");
  static BOOKING_CONFIRMED = new NotificationType("BOOKING_CONFIRMED");
  static BOOKING_CANCELLED = new NotificationType("BOOKING_CANCELLED");
  static PAYMENT_PROCESSED = new NotificationType("PAYMENT_PROCESSED");
  static SYSTEM_ALERT = new NotificationType("SYSTEM_ALERT");
}
