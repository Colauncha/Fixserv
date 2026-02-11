export class Category {
  private readonly _name: string;
  private readonly _description: string;
  private readonly _iconUrl?: string;

  constructor(name: string, description: string, iconUrl?: string) {
    if (!name || name.trim().length === 0) {
      throw new Error("Category name cannot be empty");
    }

    this._name = name.trim().toUpperCase();
    this._description = description.trim();
    this._iconUrl = iconUrl;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get iconUrl(): string | undefined {
    return this._iconUrl;
  }

  equals(other: Category): boolean {
    return this._name === other._name;
  }

  toJSON() {
    return {
      name: this._name,
      description: this._description,
      iconUrl: this._iconUrl,
    };
  }

  static fromJSON(data: any): Category {
    return new Category(data.name, data.description, data.iconUrl);
  }
}
