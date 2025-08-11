import { BadRequestError } from "@fixserv-colauncha/shared";

export class ServicePreferences {
  private readonly _categories: string[];
  constructor(categories: string[]) {
    if (!categories || categories.length === 0) {
      throw new BadRequestError("At least one service preference is required");
    }

    this._categories = [...new Set(categories)];
  }
  get categories(): string[] {
    return [...this._categories];
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
