export class NotificationPreference {
  constructor(
    private _userId: string,
    private _emailEnabled: boolean = true,
    private _pushEnabled: boolean = true,
    private _smsEnabled: boolean = false,
    private _categories: Record<string, boolean> = {}
  ) {}

  get userId(): string {
    return this._userId;
  }
  get emailEnabled(): boolean {
    return this._emailEnabled;
  }
  get pushEnabled(): boolean {
    return this._pushEnabled;
  }
  get smsEnabled(): boolean {
    return this._smsEnabled;
  }
  get categories(): Record<string, boolean> {
    return this._categories;
  }

  updateEmailPreference(enabled: boolean): void {
    this._emailEnabled = enabled;
  }

  updatePushPreference(enabled: boolean): void {
    this._pushEnabled = enabled;
  }

  updateSmsPreference(enabled: boolean): void {
    this._smsEnabled = enabled;
  }

  updateCategoryPreference(category: string, enabled: boolean): void {
    this._categories[category] = enabled;
  }

  isCategoryEnabled(category: string): boolean {
    return this._categories[category] ?? true;
  }
}
