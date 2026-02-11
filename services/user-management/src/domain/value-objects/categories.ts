import { Category } from "./category";

export class Categories {
  private readonly _categories: Category[];

  constructor(categories: Category[] | string[]) {
    if (categories.length === 0) {
      throw new Error("Artisan must have at least one category");
    }

    // Handle both Category objects and strings
    this._categories = categories.map((cat) =>
      typeof cat === "string" ? new Category(cat, "", undefined) : cat,
    );
  }

  get categories(): Category[] {
    return [...this._categories];
  }

  get categoryNames(): string[] {
    return this._categories.map((cat) => cat.name);
  }

  hasCategory(categoryName: string): boolean {
    const normalizedName = categoryName.trim().toUpperCase();
    return this._categories.some((cat) => cat.name === normalizedName);
  }

  addCategory(category: Category | string): Categories {
    const newCategory =
      typeof category === "string"
        ? new Category(category, "", undefined)
        : category;

    // Prevent duplicates
    if (this.hasCategory(newCategory.name)) {
      return this;
    }

    return new Categories([...this._categories, newCategory]);
  }

  removeCategory(categoryName: string): Categories {
    const normalizedName = categoryName.trim().toUpperCase();
    const filtered = this._categories.filter(
      (cat) => cat.name !== normalizedName,
    );

    if (filtered.length === 0) {
      throw new Error("Artisan must have at least one category");
    }

    return new Categories(filtered);
  }

  toJSON() {
    return this._categories.map((cat) => cat.toJSON());
  }

  static fromJSON(data: any[]): Categories {
    const categories = data.map((item) =>
      typeof item === "string"
        ? new Category(item, "", undefined)
        : Category.fromJSON(item),
    );
    return new Categories(categories);
  }
}
