export class NotificationStatus {
  private static readonly VALID_STATUSES = ["read", "unread"] as const;

  constructor(private _value: string) {
    if (!NotificationStatus.VALID_STATUSES.includes(_value as any)) {
      throw new Error(`Invalid notification status: ${_value}`);
    }
  }

  get value(): string {
    return this._value;
  }

  static READ = new NotificationStatus("read");
  static UNREAD = new NotificationStatus("unread");
}
