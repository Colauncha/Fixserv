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
    "ORDER_ACCEPTED",
    "ORDER_REJECTED",
    "NEW_ORDER_REQUEST",
    "WORK_STARTED",
    "WORK_COMPLETED",
    "PAYMENT_RELEASED",
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
  static SERVICE_CREATED = new NotificationType("SERVICE_CREATED");
  static WALLET_TOPUP = new NotificationType("WALLET_TOPUP");
  static ORDER_ACCEPTED = new NotificationType("ORDER_ACCEPTED");
  static ORDER_REJECTED = new NotificationType("ORDER_REJECTED");
  static NEW_ORDER_REQUEST = new NotificationType("NEW_ORDER_REQUEST");
  static WORK_STARTED = new NotificationType("WORK_STARTED");
  static WORK_COMPLETED = new NotificationType("WORK_COMPLETED");
  static PAYMENT_RELEASED = new NotificationType("PAYMENT_RELEASED");
}
