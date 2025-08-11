export class ServicePreferences {
  private readonly _categories: string[];

  constructor(categories: string[]) {
    if (!categories || categories.length === 0) {
      throw new Error("At least one service preference is required");
    }
    this._categories = [...new Set(categories)]; // Remove duplicates
  }

  get categories(): string[] {
    return [...this._categories]; // Return copy to prevent modification
  }

  addPreference(newPreference: string): ServicePreferences {
    return new ServicePreferences([...this._categories, newPreference]);
  }

  removePreference(preferenceToRemove: string): ServicePreferences {
    return new ServicePreferences(
      this._categories.filter((p) => p !== preferenceToRemove)
    );
  }

  hasPreference(preference: string): boolean {
    return this._categories.includes(preference);
  }

  toJSON() {
    return this._categories;
  }
}
