type RepairCategory = "phone-repair" | "laptop-repair" | "home-appliances";

export class ServicePreferences {
  private readonly _categories: RepairCategory[];
  constructor(categories: string[]) {
    if (categories.length === 0) {
      throw new Error("At least one service preference is required");
    }
    const validCategories = categories.filter((category) =>
      ["phone-repair", "laptop-repair", "home-appliances"].includes(category)
    ) as RepairCategory[];
    if (validCategories.length !== categories.length) {
      throw new Error("Invalid service category detected");
    }
    this._categories = validCategories;
  }
  get categories(): RepairCategory[] {
    return [...this._categories];
  }
  includes(category: RepairCategory): boolean {
    return this._categories.includes(category);
  }
}
