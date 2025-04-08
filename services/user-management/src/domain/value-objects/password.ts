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
    if (plainPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    const hash = await bcrypt.hash(plainPassword, 10);
    return new Password(hash);
  }

  public static fromHash(hash: string): any | Password {
    return new Password(hash);
  }

  public async compare(plainPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, this._hash);
  }
}
