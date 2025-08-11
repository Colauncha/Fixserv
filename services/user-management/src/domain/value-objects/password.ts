import * as bcrypt from "bcryptjs";

export class Password {
  private readonly _hash: string;
  constructor(hash: string) {
    this._hash = hash;
  }

  get hash(): string {
    return this._hash;
  }

  public static async create(plainPassword: string): Promise<Password> {
    if (!plainPassword || plainPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    const hash = await bcrypt.hash(plainPassword, 10);
    return new Password(hash);
  }

  public static fromHash(hash: string): Password {
    if (!hash) {
      throw new Error("Hash cannot be empty");
    }
    return new Password(hash);
  }

  public async compare(plainPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, this._hash);
  }
  // ✅ Add this for cache deserialization (aliases fromHash)
  public static fromJSON(hash: string): Password {
    return this.fromHash(hash);
  }

  get value() {
    return this.hash;
  }
}
